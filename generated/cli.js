"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = exports.init = exports.watch = void 0;
exports.build = build;
exports.dispatch = dispatch;
const commander_1 = require("commander");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const package_info_js_1 = require("./package-info.js");
const lsp_js_1 = require("./lsp.js");
const preprocess_js_1 = require("./preprocess.js");
const intellisense_js_1 = require("./intellisense.js");
const rojo_mapper_js_1 = require("./utils/rojo-mapper.js");
const process_orchestrator_js_1 = require("./utils/process-orchestrator.js");
const project_js_1 = require("./utils/project.js");
Object.defineProperty(exports, "init", { enumerable: true, get: function () { return project_js_1.init; } });
Object.defineProperty(exports, "watch", { enumerable: true, get: function () { return project_js_1.watch; } });
const transpile_js_1 = require("./transpile.js");
const program = new commander_1.Command();
exports.program = program;
program
    .name("cluaupp")
    .description("Definitive transpiler from C++ subset to structured Luau")
    .version(package_info_js_1.pkg.version, "-v, --version", "print version")
    .showHelpAfterError()
    .action(() => {
    program.outputHelp();
});
program
    .command("init")
    .description("create a game (src/server, src/client, src/shared)")
    .argument("[folder]", "destination folder", ".")
    .action(async (folder) => {
    try {
        await (0, project_js_1.init)(node_path_1.default.resolve(process.cwd(), folder));
    }
    catch (err) {
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
    .action(async (folder, options) => {
    if (options.input) {
        await buildInput(options);
        return;
    }
    try {
        (0, project_js_1.build)(node_path_1.default.resolve(process.cwd(), folder), {
            format: options.format === true,
            analyze: options.analyze === true,
            rojo: options.rojo,
        });
    }
    catch (err) {
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
    .action((folder, options) => {
    try {
        (0, project_js_1.watch)(node_path_1.default.resolve(process.cwd(), folder), {
            format: options.format === true,
            rojo: options.rojo,
        });
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    }
});
program
    .command("lsp")
    .description("Cluaupp subset diagnostics over stdio (JSON-RPC). C++ completion is clangd.")
    .argument("[folder]", "project folder", ".")
    .action((folder) => {
    (0, lsp_js_1.start)({ projectRoot: node_path_1.default.resolve(process.cwd(), folder) });
});
program
    .command("intellisense")
    .alias("intelisense")
    .description("install LLVM clangd and write compile_commands.json")
    .argument("[folder]", "project folder", ".")
    .action(async (folder) => {
    try {
        const root = node_path_1.default.resolve(process.cwd(), folder);
        (0, intellisense_js_1.syncEditorSupport)(root, (0, project_js_1.loadConfig)(root));
        const installed = await (0, intellisense_js_1.installEditorSupport)();
        console.log("cluaupp: compile_commands.json, .clangd, and .vscode updated in", root);
        console.log("cluaupp: C++ completion is clangd (include/cluaupp/roblox.hpp)");
        if (installed.clangd || installed.llvm) {
            console.log("cluaupp: reload Cursor (Ctrl+Shift+P → Developer: Reload Window)");
        }
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    }
});
async function buildInput(options) {
    if (!options.input || !options.output) {
        console.error("[Erro] --input e --output são obrigatórios neste modo.");
        process.exit(1);
    }
    const inputPath = node_path_1.default.resolve(options.input);
    const outputPath = node_path_1.default.resolve(options.output);
    try {
        await promises_1.default.stat(inputPath);
    }
    catch {
        console.error(`[Erro] O caminho de entrada especificado não existe: ${inputPath}`);
        process.exit(1);
    }
    console.log("🏁 Inicializando Pipeline do Compilador Cluaupp V2...");
    const mapper = new rojo_mapper_js_1.RojoMapper(node_path_1.default.resolve(options.rojo), node_path_1.default.dirname(inputPath));
    await mapper.load();
    const inputs = (await promises_1.default.stat(inputPath)).isDirectory()
        ? (0, project_js_1.collectCpp)(inputPath)
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
        const sourceCode = await promises_1.default.readFile(file, "utf8");
        const rel = node_path_1.default.basename(file);
        const compiled = (0, transpile_js_1.transpileSource)(sourceCode, rel, {
            strict: options.strict === true,
            filePath: file,
            relativeName: rel,
            srcDir: node_path_1.default.dirname(file),
            includeDirs: [node_path_1.default.dirname(file)],
        }, mapper);
        const dest = outputIsFile ? outputPath : node_path_1.default.join(outputPath, node_path_1.default.basename((0, preprocess_js_1.toLuauPath)(rel)));
        await promises_1.default.mkdir(node_path_1.default.dirname(dest), { recursive: true });
        const luau = compiled.files[0]?.contents ?? "";
        await promises_1.default.writeFile(dest, luau, "utf8");
        if (options.format === true) {
            await process_orchestrator_js_1.ProcessOrchestrator.formatWithStyLua(dest);
        }
        if (options.analyze === true) {
            const analysisReport = await process_orchestrator_js_1.ProcessOrchestrator.analyzeWithLuau(dest);
            if (analysisReport) {
                console.log("\nRelatório de Análise Estática do Luau:\n", analysisReport);
            }
        }
        console.log(`Transpilação concluída! ${file} → ${dest}`);
    }
}
function build(root, options = {}) {
    return (0, project_js_1.build)(root, options);
}
function dispatch(args) {
    return program.parseAsync(["node", "cluaupp", ...args]);
}
function isMain() {
    const entry = process.argv[1];
    if (!entry) {
        return false;
    }
    return ["cli.js", "cli.ts", "cluaupp.js", "cluau.js"].includes(node_path_1.default.basename(entry));
}
if (isMain()) {
    program.parseAsync(process.argv).catch((err) => {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    });
}
