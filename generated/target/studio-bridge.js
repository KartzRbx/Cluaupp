"use strict";
/**
 * Local HTTP bridge: Studio plugin ↔ IDE (VS Code / Cursor).
 * Default port 3847. Studio POSTs open requests; IDE polls /events.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRIDGE_DEFAULT_PORT = void 0;
exports.startStudioBridge = startStudioBridge;
const node_http_1 = __importDefault(require("node:http"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_events_1 = require("node:events");
exports.BRIDGE_DEFAULT_PORT = 3847;
function startStudioBridge(opts = {}) {
    const port = opts.port ?? exports.BRIDGE_DEFAULT_PORT;
    const bus = new node_events_1.EventEmitter();
    const events = [];
    let nextId = 1;
    const push = (partial) => {
        const ev = {
            id: nextId++,
            at: new Date().toISOString(),
            ...partial,
        };
        events.push(ev);
        if (events.length > 200)
            events.shift();
        bus.emit("event", ev);
        opts.onEvent?.(ev);
        return ev;
    };
    const server = node_http_1.default.createServer((req, res) => {
        const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }
        if (req.method === "GET" && url.pathname === "/health") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, service: "cluaupp-bridge", port }));
            return;
        }
        if (req.method === "GET" && url.pathname === "/events") {
            const since = Number(url.searchParams.get("since") || "0");
            const batch = events.filter((e) => e.id > since);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ events: batch }));
            return;
        }
        if (req.method === "POST" && url.pathname === "/open") {
            let body = "";
            req.on("data", (c) => {
                body += c;
                if (body.length > 1_000_000)
                    req.destroy();
            });
            req.on("end", () => {
                try {
                    const data = JSON.parse(body || "{}");
                    const rel = (data.path || "").replace(/\\/g, "/");
                    if (opts.projectRoot && rel && !rel.includes("..")) {
                        const abs = node_path_1.default.resolve(opts.projectRoot, rel);
                        if (!abs.startsWith(node_path_1.default.resolve(opts.projectRoot))) {
                            res.writeHead(400);
                            res.end("bad path");
                            return;
                        }
                        if (!node_fs_1.default.existsSync(abs) && !rel.endsWith(".clpp") && !rel.endsWith(".clh")) {
                            /* still emit — file may be unsaved emit path */
                        }
                    }
                    const ev = push({
                        type: data.type || "open",
                        path: rel || undefined,
                        line: data.line,
                        instancePath: data.instancePath,
                        message: data.message,
                    });
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ ok: true, id: ev.id }));
                }
                catch (err) {
                    res.writeHead(400);
                    res.end(String(err instanceof Error ? err.message : err));
                }
            });
            return;
        }
        res.writeHead(404);
        res.end("not found");
    });
    server.listen(port, "127.0.0.1");
    return {
        port,
        close: () => {
            server.close();
            bus.removeAllListeners();
        },
        onEvent: (fn) => {
            bus.on("event", fn);
            return () => bus.off("event", fn);
        },
        getEventsSince: (id) => events.filter((e) => e.id > id),
    };
}
