/**
 * Local HTTP bridge: Studio plugin ↔ IDE (VS Code / Cursor).
 * Default port 3847. Studio POSTs open requests; IDE polls /events.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";

export const BRIDGE_DEFAULT_PORT = 3847;

export interface BridgeEvent {
	id: number;
	at: string;
	type: "open" | "select" | "error" | "ping";
	path?: string;
	line?: number;
	message?: string;
	instancePath?: string;
}

export interface BridgeServer {
	port: number;
	close: () => void;
	onEvent: (fn: (ev: BridgeEvent) => void) => () => void;
	getEventsSince: (id: number) => BridgeEvent[];
}

export function startStudioBridge(opts: {
	port?: number;
	projectRoot?: string;
	onEvent?: (ev: BridgeEvent) => void;
} = {}): BridgeServer {
	const port = opts.port ?? BRIDGE_DEFAULT_PORT;
	const bus = new EventEmitter();
	const events: BridgeEvent[] = [];
	let nextId = 1;

	const push = (partial: Omit<BridgeEvent, "id" | "at">) => {
		const ev: BridgeEvent = {
			id: nextId++,
			at: new Date().toISOString(),
			...partial,
		};
		events.push(ev);
		if (events.length > 200) events.shift();
		bus.emit("event", ev);
		opts.onEvent?.(ev);
		return ev;
	};

	const server = http.createServer((req, res) => {
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
				if (body.length > 1_000_000) req.destroy();
			});
			req.on("end", () => {
				try {
					const data = JSON.parse(body || "{}") as {
						path?: string;
						line?: number;
						instancePath?: string;
						type?: BridgeEvent["type"];
						message?: string;
					};
					const rel = (data.path || "").replace(/\\/g, "/");
					if (opts.projectRoot && rel && !rel.includes("..")) {
						const abs = path.resolve(opts.projectRoot, rel);
						if (!abs.startsWith(path.resolve(opts.projectRoot))) {
							res.writeHead(400);
							res.end("bad path");
							return;
						}
						if (!fs.existsSync(abs) && !rel.endsWith(".clpp") && !rel.endsWith(".clh")) {
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
				} catch (err) {
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
