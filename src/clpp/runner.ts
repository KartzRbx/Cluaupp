import { spawnSync } from "node:child_process";
import { CLPP_INSTALL_HINT, type CompileArtifact, type CompileRequest, type LanguageManifest } from "./contract.js";

const MISSING_CLPP = `cluaupp: clpp not found. ${CLPP_INSTALL_HINT}`;

function whichClpp(): string | null {
	if (process.env.CLPP_PATH) {
		return process.env.CLPP_PATH;
	}
	const finder = process.platform === "win32" ? "where" : "which";
	const found = spawnSync(finder, ["clpp"], { encoding: "utf8", windowsHide: true });
	if (found.status !== 0) {
		return null;
	}
	const line = String(found.stdout || "")
		.split(/\r?\n/)
		.map((item) => item.trim())
		.find((item) => item.length > 0);
	return line || "clpp";
}

export function hasClpp(): boolean {
	return Boolean(whichClpp());
}

export function resolveClppBinary(): string {
	const bin = whichClpp();
	if (!bin) {
		throw new Error(MISSING_CLPP);
	}
	return bin;
}

function parseArtifact(stdout: string, fileName: string, fallbackError: string): CompileArtifact {
	const text = String(stdout || "").trim();
	try {
		const parsed = JSON.parse(text) as CompileArtifact;
		if (parsed && typeof parsed === "object") {
			return parsed;
		}
	} catch {
		// fall through
	}
	return {
		ok: false,
		luau: "",
		fileName,
		outputHint: "",
		scriptKind: null,
		isScript: false,
		isHeader: false,
		rojoClass: "ModuleScript",
		libraries: [],
		error: fallbackError || "clpp returned invalid JSON",
	};
}

export function compileViaClpp(request: CompileRequest): CompileArtifact {
	const bin = resolveClppBinary();
	const payload = JSON.stringify({
		source: request.source,
		fileName: request.fileName,
		strict: request.strict,
	});
	const result = spawnSync(bin, ["api", "compile"], {
		input: payload,
		encoding: "utf8",
		maxBuffer: 16 * 1024 * 1024,
		windowsHide: true,
	});
	const stderr = String(result.stderr || "").trim();
	const artifact = parseArtifact(result.stdout, request.fileName, stderr || result.error?.message || "clpp api compile failed");
	if (!artifact.ok) {
		throw new Error(artifact.error || stderr || `clpp failed (${result.status})`);
	}
	return artifact;
}

export function clppManifest(): LanguageManifest {
	const bin = resolveClppBinary();
	const result = spawnSync(bin, ["api", "manifest"], {
		encoding: "utf8",
		windowsHide: true,
	});
	if (result.status !== 0) {
		throw new Error(String(result.stderr || result.error?.message || "clpp api manifest failed"));
	}
	return JSON.parse(result.stdout) as LanguageManifest;
}

export function clppVersion(): string | null {
	const bin = whichClpp();
	if (!bin) {
		return null;
	}
	const result = spawnSync(bin, ["--version"], { encoding: "utf8", windowsHide: true });
	if (result.status !== 0) {
		return null;
	}
	return String(result.stdout || "").trim() || null;
}
