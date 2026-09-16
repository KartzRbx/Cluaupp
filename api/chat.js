"use strict";

const SYSTEM = `You are the Cluaupp docs assistant. Cluaupp is a C++ subset → Luau transpiler for Roblox (not WASM, not a full C++ compiler).

Facts:
- Tags: .server.cpp Script, .client.cpp LocalScript, untagged ModuleScript, .legacy.* skips the service split.
- void init() is called at the end of Scripts/LocalScripts.
- #include <cluaupp/...> is IntelliSense only. Quoted includes are inlined.
- Player* means a Roblox Instance. -> is . for properties and : for methods.
- nullptr is nil. Range-for only. No switch, no std::, no pointer arithmetic.
- Output is PascalCase services (Main, Managers, Controllers, Types) unless architecture is false.
- Libraries live in ReplicatedStorage.CluauppLibs after cluaupp build.
- Never invent ISO C++ features Cluaupp does not compile.
- Show short C++ and the Luau it should emit when helpful.
- Keep answers concise.`;

module.exports = async function handler(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	if (req.method === "OPTIONS") {
		res.status(204).end();
		return;
	}

	if (req.method !== "POST") {
		res.status(405).json({ error: "POST only" });
		return;
	}

	const key = process.env.AI_GATEWAY_API_KEY;
	if (!key) {
		res.status(500).json({ error: "AI Gateway is not configured" });
		return;
	}

	const incoming = Array.isArray(req.body && req.body.messages) ? req.body.messages : [];
	const messages = incoming
		.filter((msg) => msg && (msg.role === "user" || msg.role === "assistant") && typeof msg.content === "string")
		.slice(-16)
		.map((msg) => ({ role: msg.role, content: msg.content.slice(0, 4000) }));

	if (messages.length === 0) {
		res.status(400).json({ error: "messages required" });
		return;
	}

	try {
		const upstream = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${key}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: process.env.AI_GATEWAY_MODEL || "openai/gpt-5.6-sol",
				messages: [{ role: "system", content: SYSTEM }, ...messages],
				temperature: 0.4,
			}),
		});

		const data = await upstream.json();
		if (!upstream.ok) {
			res.status(upstream.status).json({
				error: (data && (data.error && data.error.message)) || "AI Gateway error",
			});
			return;
		}

		const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
		res.status(200).json({ text: text || "" });
	} catch (err) {
		res.status(502).json({ error: "Could not reach AI Gateway" });
	}
};
