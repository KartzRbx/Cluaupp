import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";
import { pkg } from "./package-info.js";
import { start as startLsp } from "./lsp.js";
import { toLuauPath } from "./preprocess.js";
import { installEditorSupport, syncEditorSupport } from "./intellisense.js";
import { RojoMapper } from "./utils/rojo-mapper.js";
import { ProcessOrchestrator } from "./utils/process-orchestrator.js";
import { build as buildProject, init, loadConfig, watch, collectCpp } from "./utils/project.js";
import { transpileSource } from "./transpile.js";
import type { BuildOptions, BuildResult } from "./types.js";

const program = new Command();

program
	.name("cluaupp")
	.description("Definitive transpiler from C++ subset to structured Luau")
	.version(pkg.version, "-v, --version", "print version")
	.showHelpAfterError()
	.action(() => {
		program.outputHelp();
	});

program
	.command("init")
	.description("create a game (src/server, src/client, src/shared)")
	.argument("[folder]", "destination folder", ".")
	.action(async (folder: string) => {
		try {
			await init(path.resolve(process.cwd(), folder));
		} catch (err) {
			console.error(err instanceof Error ? err.message : err);
			process.exit(1);
		}
	});

program
	.command("build")
	.description("Transpila um arquivo, diretório ou projeto C++ para Luau")
	.argument("[folder]", "project folder", ".")
	.option("-i, --input <path>", "Arquivo ou diretório C++ de entrada")
	.option("-o, --output <path>", "Arquivo ou diretório Luau de saída")
	.option("-r, --rojo <path>", "Caminho para o default.project.json do Rojo", "./default.project.json")
	.option("--strict", "Emitir --!strict")
	.option("--format", "Rodar StyLua no output")
	.option("--analyze", "Rodar luau-analyze no output")
	.action(async (folder: string, options: {
		input?: string;
		output?: string;
		rojo: string;
		strict?: boolean;
		format?: boolean;
		analyze?: boolean;
	}) => {
		if (options.input) {
			await buildInput(options);
			return;
		}
		try {
			buildProject(path.resolve(process.cwd(), folder), {
				format: options.format === true,
				analyze: options.analyze === true,
				rojo: options.rojo,
			});
		} catch (err) {
			console.error(err instanceof Error ? err.message : err);
			process.exit(1);
		}
	});

program
	.command("watch")
	.description("rebuild on save")
	.argument("[folder]", "project folder", ".")
	.option("-r, --rojo <path>", "Caminho para o default.project.json do Rojo", "./default.project.json")
	.option("--format", "Rodar StyLua no output")
	.action((folder: string, options: { rojo?: string; format?: boolean }) => {
		try {
			watch(path.resolve(process.cwd(), folder), {
				format: options.format === true,
				rojo: options.rojo,
			});
		} catch (err) {
			console.error(err instanceof Error ? err.message : err);
			process.exit(1);
		}
	});

program
	.command("lsp")
	.description("Cluaupp subset diagnostics over stdio (JSON-RPC). C++ completion is clangd.")
	.argument("[folder]", "project folder", ".")
	.action((folder: string) => {
		startLsp({ projectRoot: path.resolve(process.cwd(), folder) });
	});

program
	.command("intellisense")
	.alias("intelisense")
	.description("install LLVM clangd and write compile_commands.json")
	.argument("[folder]", "project folder", ".")
	.action(async (folder: string) => {
		try {
			const root = path.resolve(process.cwd(), folder);
			syncEditorSupport(root, loadConfig(root));
			const installed = await installEditorSupport();
			console.log("cluaupp: compile_commands.json, .clangd, and .vscode updated in", root);
			console.log("cluaupp: C++ completion is clangd (include/cluaupp/roblox.hpp)");
			if (installed.clangd || installed.llvm) {
				console.log("cluaupp: reload Cursor (Ctrl+Shift+P → Developer: Reload Window)");
			}
		} catch (err) {
			console.error(err instanceof Error ? err.message : err);
			process.exit(1);
		}
	});

async function buildInput(options: {
	input?: string;
	output?: string;
	rojo: string;
	strict?: boolean;
	format?: boolean;
	analyze?: boolean;
}): Promise<void> {
	if (!options.input || !options.output) {
		console.error("[Erro] --input e --output são obrigatórios neste modo.");
		process.exit(1);
	}

	const inputPath = path.resolve(options.input);
	const outputPath = path.resolve(options.output);

	try {
		await fs.stat(inputPath);
	} catch {
		console.error(`[Erro] O caminho de entrada especificado não existe: ${inputPath}`);
		process.exit(1);
	}

	console.log("🏁 Inicializando Pipeline do Compilador Cluaupp V2...");

	const mapper = new RojoMapper(path.resolve(options.rojo), path.dirname(inputPath));
	await mapper.load();

	const inputs = (await fs.stat(inputPath)).isDirectory()
		? collectCpp(inputPath)
		: [inputPath];

	if (inputs.length === 0) {
		console.error("no .cpp/.h/.hpp files in", inputPath);
		process.exit(1);
	}

	const outputIsFile = /\.luau$/i.test(outputPath);
	if (outputIsFile && inputs.length > 1) {
		console.error("[Erro] --output deve ser um diretório quando a entrada contém vários arquivos.");
		process.exit(1);
	}

	for (const file of inputs) {
		const sourceCode = await fs.readFile(file, "utf8");
		const rel = path.basename(file);
		const compiled = transpileSource(sourceCode, rel, {
			strict: options.strict === true,
			filePath: file,
			relativeName: rel,
			srcDir: path.dirname(file),
			includeDirs: [path.dirname(file)],
		}, mapper);

		const dest = outputIsFile ? outputPath : path.join(outputPath, path.basename(toLuauPath(rel)));
		await fs.mkdir(path.dirname(dest), { recursive: true });
		const luau = compiled.files[0]?.contents ?? "";
		await fs.writeFile(dest, luau, "utf8");

		if (options.format === true) {
			await ProcessOrchestrator.formatWithStyLua(dest);
		}
		if (options.analyze === true) {
			const analysisReport = await ProcessOrchestrator.analyzeWithLuau(dest);
			if (analysisReport) {
				console.log("\nRelatório de Análise Estática do Luau:\n", analysisReport);
			}
		}
		console.log(`Transpilação concluída! ${file} → ${dest}`);
	}
}

export function build(root: string, options: BuildOptions = {}): BuildResult {
	return buildProject(root, options);
}

export { watch, init, program };

export function dispatch(args: string[]): Promise<Command> {
	return program.parseAsync(["node", "cluaupp", ...args]);
}

function isMain(): boolean {
	const entry = process.argv[1];
	if (!entry) {
		return false;
	}
	return ["cli.js", "cli.ts", "cluaupp.js", "cluau.js"].includes(path.basename(entry));
}

if (isMain()) {
	program.parseAsync(process.argv).catch((err: unknown) => {
		console.error(err instanceof Error ? err.message : err);
		process.exit(1);
	});
}
