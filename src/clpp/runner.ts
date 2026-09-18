import { spawnSync } from "node:child_process";
import { CLPP_INSTALL_HINT, MIN_CLPP_VERSION, type CompileArtifact, type CompileRequest, type LanguageManifest } from "./contract.js";

const MISSING_CLPP = `cluaupp: clpp not found. ${CLPP_INSTALL_HINT}`;

type Semver = { major: number; minor: number; patch: number };

let cachedBin: string | null | undefined;

function parseSemver(text: string): Semver | null {
	const match = String(text).match(/(\d+)\.(\d+)\.(\d+)/);
	if (!match) {
		return null;
	}
	return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function cmpSemver(a: Semver, b: Semver): number {
	return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

function minClpp(): Semver {
	return parseSemver(MIN_CLPP_VERSION) || { major: 0, minor: 2, patch: 6 };
}

function tooOldMessage(bin: string, version: string | null): string {
	return `cluaupp: clpp ${version || "unknown"} is too old (${bin}). Need CL++ ${MIN_CLPP_VERSION}+ (for-in, GetService<T>, #pragma). cargo 0.1.0 cannot parse current CL++. Install https://github.com/KartzRbx/CLPP/releases or set CLPP_PATH to the newer binary.`;
}

function probeVersion(bin: string): string | null {
	const result = spawnSync(bin, ["--version"], { encoding: "utf8", windowsHide: true });
	if (result.status !== 0) {
		return null;
	}
	return String(result.stdout || result.stderr || "").trim() || null;
}

function listClppCandidates(): string[] {
	if (process.env.CLPP_PATH) {
		return [process.env.CLPP_PATH];
	}
	const finder = process.platform === "win32" ? "where" : "which";
	const found = spawnSync(finder, ["clpp"], { encoding: "utf8", windowsHide: true });
	if (found.status !== 0) {
		return [];
	}
	const seen = new Set<string>();
	const out: string[] = [];
	for (const line of String(found.stdout || "").split(/\r?\n/)) {
		const item = line.trim();
		if (!item || seen.has(item.toLowerCase())) {
			continue;
		}
		seen.add(item.toLowerCase());
		out.push(item);
	}
	return out;
}

function pickClppBinary(): string | null {
	const candidates = listClppCandidates();
	if (candidates.length === 0) {
		return null;
	}
	let best: { bin: string; parsed: Semver } | null = null;
	let fallback: string | null = null;
	for (const bin of candidates) {
		const version = probeVersion(bin);
		const parsed = parseSemver(version || "");
		if (!fallback) {
			fallback = bin;
		}
		if (!parsed) {
			continue;
		}
		if (!best || cmpSemver(parsed, best.parsed) > 0) {
			best = { bin, parsed };
		}
	}
	return best?.bin || fallback;
}

function whichClpp(): string | null {
	if (cachedBin !== undefined) {
		return cachedBin;
	}
	cachedBin = pickClppBinary();
	return cachedBin;
}

export function hasClpp(): boolean {
	return Boolean(whichClpp());
}

export function resolveClppBinary(): string {
	const bin = whichClpp();
	if (!bin) {
		throw new Error(MISSING_CLPP);
	}
	const version = probeVersion(bin);
	const parsed = parseSemver(version || "");
	if (!parsed || cmpSemver(parsed, minClpp()) < 0) {
		throw new Error(tooOldMessage(bin, version));
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
		cwd: request.cwd,
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
	return probeVersion(bin);
}

export function clppInstalls(): Array<{ bin: string; version: string | null; selected: boolean }> {
	const selected = whichClpp();
	return listClppCandidates().map((bin) => ({
		bin,
		version: probeVersion(bin),
		selected: bin === selected,
	}));
}
