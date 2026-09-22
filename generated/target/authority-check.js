"use strict";
/**
 * Authority / architecture rules — import boundaries (CLUAU-AUTH*).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPlatformPolicy = loadPlatformPolicy;
exports.checkAuthority = checkAuthority;
exports.assertAuthoritySafe = assertAuthoritySafe;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const roblox_js_1 = require("./roblox.js");
const diagnostics_js_1 = require("./diagnostics.js");
function loadPlatformPolicy(projectRoot) {
    const file = node_path_1.default.join(projectRoot, "cluaupp.config.json");
    if (!node_fs_1.default.existsSync(file)) {
        return defaultPolicy();
    }
    try {
        const raw = JSON.parse(node_fs_1.default.readFileSync(file, "utf8"));
        const rules = raw.rules || {};
        const components = Array.isArray(raw.components) ? raw.components : [];
        return {
            rules: { ...defaultPolicy().rules, ...rules },
            components: components.length ? components : defaultPolicy().components,
        };
    }
    catch {
        return defaultPolicy();
    }
}
function defaultPolicy() {
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
function checkAuthority(source, fileName, policy = defaultPolicy()) {
    const ctx = (0, roblox_js_1.runContextFromFileName)(fileName);
    const clean = (0, diagnostics_js_1.stripCommentsKeepStrings)(source);
    const out = [];
    const rules = policy.rules || {};
    const bannedImports = ctx === "Client"
        ? rules.clientCannotImport || []
        : ctx === "Shared"
            ? []
            : ctx === "Server"
                ? rules.serverCannotImport || []
                : [];
    const checkToken = (token, index, code, message) => {
        const { line, column } = (0, diagnostics_js_1.lineColAt)(clean, index);
        out.push({ code, message, line, column, severity: "error", file: fileName });
    };
    for (const banned of bannedImports) {
        const re = new RegExp(`\\b${banned}\\b`);
        INCLUDE_RE.lastIndex = 0;
        let m;
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
        let m;
        while ((m = GET_SERVICE.exec(clean))) {
            const svc = m[1] || m[2];
            if (svc && forbiddenServices.includes(svc) && ctx === "Shared") {
                const { line, column } = (0, diagnostics_js_1.lineColAt)(clean, m.index);
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
                const { line, column } = (0, diagnostics_js_1.lineColAt)(clean, m.index);
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
function assertAuthoritySafe(source, fileName, policy) {
    const errors = checkAuthority(source, fileName, policy).filter((d) => d.severity === "error");
    if (!errors.length)
        return;
    throw new Error(`Authority:\n${errors.map((e) => `  ${e.line}:${e.column} ${e.code} ${e.message}`).join("\n")}`);
}
