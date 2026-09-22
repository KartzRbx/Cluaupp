/**
 * Authority / architecture rules — import boundaries (CLUAU-AUTH*).
 */

import fs from "node:fs";
import path from "node:path";
import { runContextFromFileName, type RunContext } from "./roblox.js";
import { type PlatformDiagnostic, lineColAt, stripCommentsKeepStrings } from "./diagnostics.js";

export interface ArchitectureRules {
	clientCannotImport?: string[];
	sharedCannotUse?: string[];
	serverCannotImport?: string[];
}

export interface ComponentContract {
	/** Instance path suffix or exact path, e.g. "Enemy" or "Workspace.Mobs.Enemy" */
	path: string;
	children: Record<string, string>; // name → expected className (or BasePart etc.)
}

export interface PlatformPolicy {
	rules?: ArchitectureRules;
	components?: ComponentContract[];
}

export function loadPlatformPolicy(projectRoot: string): PlatformPolicy {
	const file = path.join(projectRoot, "cluaupp.config.json");
	if (!fs.existsSync(file)) {
		return defaultPolicy();
	}
	try {
		const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
		const rules = (raw.rules as ArchitectureRules) || {};
		const components = Array.isArray(raw.components) ? (raw.components as ComponentContract[]) : [];
		return {
			rules: { ...defaultPolicy().rules, ...rules },
			components: components.length ? components : defaultPolicy().components,
		};
	} catch {
		return defaultPolicy();
	}
}

function defaultPolicy(): PlatformPolicy {
	return {
		rules: {
			clientCannotImport: ["ServerScriptService", "ServerStorage"],
			sharedCannotUse: ["DataStoreService", "MessagingService", "ServerStorage"],
			serverCannotImport: [],
		},
		components: [],
	};
}

const INCLUDE_RE = /#include\s*[<"]([^>"]+)[>"]/g;
const IMPORT_RE = /\bimport\s*\{[^}]*\}\s*from\s*"([^"]+)"/g;
const REQUIRE_RE = /require\s*\(\s*([^)]+)\)/g;
const GET_SERVICE = /GetService\s*(?:<\s*([A-Za-z_]\w*)\s*>|\(\s*"([A-Za-z_]\w*)"\s*\))/g;

export function checkAuthority(
	source: string,
	fileName: string,
	policy: PlatformPolicy = defaultPolicy(),
): PlatformDiagnostic[] {
	const ctx = runContextFromFileName(fileName);
	const clean = stripCommentsKeepStrings(source);
	const out: PlatformDiagnostic[] = [];
	const rules = policy.rules || {};

	const bannedImports =
		ctx === "Client"
			? rules.clientCannotImport || []
			: ctx === "Shared"
				? []
				: ctx === "Server"
					? rules.serverCannotImport || []
					: [];

	const checkToken = (token: string, index: number, code: string, message: string) => {
		const { line, column } = lineColAt(clean, index);
		out.push({ code, message, line, column, severity: "error", file: fileName });
	};

	for (const banned of bannedImports) {
		const re = new RegExp(`\\b${banned}\\b`);
		INCLUDE_RE.lastIndex = 0;
		let m: RegExpExecArray | null;
		while ((m = INCLUDE_RE.exec(clean))) {
			if (re.test(m[1])) {
				checkToken(m[1], m.index, "CLUAU_AUTH001", `Architecture: ${ctx} must not import/include path involving ${banned}`);
			}
		}
		IMPORT_RE.lastIndex = 0;
		while ((m = IMPORT_RE.exec(clean))) {
			if (re.test(m[1])) {
				checkToken(m[1], m.index, "CLUAU_AUTH001", `Architecture: ${ctx} must not import path involving ${banned}`);
			}
		}
		REQUIRE_RE.lastIndex = 0;
		while ((m = REQUIRE_RE.exec(clean))) {
			if (re.test(m[1])) {
				checkToken(m[1], m.index, "CLUAU_AUTH001", `Architecture: ${ctx} must not require ${banned}`);
			}
		}
		if (re.test(clean) && (clean.includes(`"${banned}`) || clean.includes(`'${banned}`) || clean.includes(`<${banned}`))) {
			/* covered above */
		}
	}

	if (ctx === "Shared" || ctx === "Client") {
		const forbiddenServices = rules.sharedCannotUse || [];
		GET_SERVICE.lastIndex = 0;
		let m: RegExpExecArray | null;
		while ((m = GET_SERVICE.exec(clean))) {
			const svc = m[1] || m[2];
			if (svc && forbiddenServices.includes(svc) && ctx === "Shared") {
				const { line, column } = lineColAt(clean, m.index);
				out.push({
					code: "CLUAU_AUTH002",
					message: `Architecture: Shared must not use ${svc}`,
					line,
					column,
					severity: "error",
					file: fileName,
				});
			}
		}
	}

	// Client writing Keep/DataStore style authority smells
	if (ctx === "Client") {
		const smells = [
			{ re: /\bDataStoreService\b/, msg: "Client must not touch DataStoreService" },
			{ re: /Keep\.Server\.(Set|SetPersisted|Trade)/, msg: "Client must not mutate Keep.Server persistence APIs" },
		];
		for (const smell of smells) {
			const m = smell.re.exec(clean);
			if (m) {
				const { line, column } = lineColAt(clean, m.index);
				out.push({
					code: "CLUAU_AUTH003",
					message: smell.msg,
					line,
					column,
					severity: "error",
					file: fileName,
				});
			}
		}
	}

	return out;
}

export function assertAuthoritySafe(source: string, fileName: string, policy?: PlatformPolicy): void {
	const errors = checkAuthority(source, fileName, policy).filter((d) => d.severity === "error");
	if (!errors.length) return;
	throw new Error(`Authority:\n${errors.map((e) => `  ${e.line}:${e.column} ${e.code} ${e.message}`).join("\n")}`);
}

export type { RunContext };
