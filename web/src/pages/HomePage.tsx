import { Link } from "react-router-dom";
import { CodePair } from "../components/CodePair";

const HOME_CPP = `#include <cluaupp/roblox.hpp>
#include <cluaupp/libs/janitor.hpp>
#include "LeaderstatsServer.h"

void init() {
	Players* players = GetService<Players>();
	LeaderstatsServer leaderstatsServer;
	leaderstatsServer.janitor = new Janitor();
	for (Player* player : players->GetPlayers()) {
		leaderstatsServer.PlayerEntered(player);
	}
	players->PlayerAdded.Connect([&](Player* playerEntered) {
		leaderstatsServer.PlayerEntered(playerEntered);
	});
}`;

const HOME_LUAU = `local Janitor = require(ReplicatedStorage.CluauppLibs.Janitor)
local LeaderstatsServer = {}

const function init()
	local players: Players = game:GetService("Players")
	local leaderstatsServer: LeaderstatsServer = LeaderstatsServer
	leaderstatsServer.janitor = Janitor.new()
	for _, player in players:GetPlayers() do
		leaderstatsServer:PlayerEntered(player)
	end
	players.PlayerAdded:Connect(function(playerEntered: Player)
		leaderstatsServer:PlayerEntered(playerEntered)
	end)
end

init()`;

export function HomePage() {
	const logo = `${import.meta.env.BASE_URL}assets/logo.png`;
	return (
		<>
			<section className="hero">
				<div className="hero-copy reveal">
					<p className="eyebrow">C++ × Luau</p>
					<h1>
						A TypeScript-to-Luau compiler
						<br />
						for people who write C++.
					</h1>
					<p className="lede">
						Cluaupp is a C++ subset that compiles to readable Roblox Luau. clangd completes. Filename tags pick Script /
						LocalScript / ModuleScript. You write structs, methods, and <code>init()</code> — not an API dump. The docs
						are the language: every construct the CLI accepts.
					</p>
					<div className="hero-actions">
						<Link className="btn btn-primary" to="/docs/setup">
							Get started
						</Link>
						<Link className="btn btn-ghost" to="/docs">
							Docs
						</Link>
					</div>
				</div>
				<img className="hero-logo" src={logo} alt="Cluaupp mark" />
			</section>
			<section className="section" data-reveal>
				<CodePair cpp={HOME_CPP} luau={HOME_LUAU} />
			</section>
			<section className="section" data-reveal>
				<div className="grid">
					<Link className="card" to="/docs/syntax">
						<strong>A C++ class</strong>
						<span className="muted">
							Syntax, output, variables, types, functions, lambdas — taught like W3Schools, emitted as Luau.
						</span>
					</Link>
					<Link className="card" to="/docs/structs">
						<strong>Types you own</strong>
						<span className="muted">
							A struct in the header, Class:: methods in the .cpp, void init() to boot. Same pattern for Template data
							and services.
						</span>
					</Link>
					<Link className="card" to="/docs/cli">
						<strong>clangd + Rojo</strong>
						<span className="muted">
							init, build, watch, lsp, intellisense. Filename tags pick Script / LocalScript / ModuleScript. First-party
							libs require themselves.
						</span>
					</Link>
				</div>
			</section>
		</>
	);
}
