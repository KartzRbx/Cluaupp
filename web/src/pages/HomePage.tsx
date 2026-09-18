import { Link } from "react-router-dom";
import { CodePair } from "../components/CodePair";

const HOME_CLPP = `#include <clpp/roblox.clh>
#include <clpp/libs/janitor.clh>

void init() {
	Players* players = GetService<Players>();
	players.PlayerAdded::Connect(func [](Player* player) {
		guard (player != null) else {
			return;
		}
		post("hello, " .: player.Name);
	});
}`;

const HOME_LUAU = `const Players = game:GetService("Players")
const Janitor = require(ReplicatedStorage.CluauppLibs.Janitor)

const function init()
	local players: Players = game:GetService("Players")
	players.PlayerAdded:Connect(function(player: Player)
		if not player then
			return
		end
		print("hello, " .. player.Name)
	end)
end

init()`;

export function HomePage() {
	const logo = `${import.meta.env.BASE_URL}assets/logo.png`;
	return (
		<>
			<section className="hero">
				<div className="hero-copy reveal">
					<p className="eyebrow">CL++ × Luau</p>
					<h1>
						The Roblox toolchain
						<br />
						for people who write CL++.
					</h1>
					<p className="lede">
						You write{" "}
						<a href="https://kartzrbx.github.io/CLPP/">CL++</a> (<code>.clpp</code> / <code>.clp</code> /{" "}
						<code>.clh</code>). Cluaupp calls <code>clpp</code>, maps libraries into{" "}
						<code>ReplicatedStorage.CluauppLibs</code>, and syncs with Rojo. Filename tags pick Script /
						LocalScript / ModuleScript. Entry is <code>void init()</code>.
					</p>
					<div className="hero-actions">
						<Link className="btn btn-primary" to="/docs/setup">
							Get started
						</Link>
						<Link className="btn btn-ghost" to="/docs">
							Docs
						</Link>
						<a className="btn btn-ghost" href="https://kartzrbx.github.io/CLPP/">
							CL++ language
						</a>
					</div>
				</div>
				<img className="hero-logo" src={logo} alt="Cluaupp mark" />
			</section>
			<section className="section" data-reveal>
				<CodePair cpp={HOME_CLPP} luau={HOME_LUAU} />
			</section>
			<section className="section" data-reveal>
				<div className="grid">
					<Link className="card" to="/docs/syntax">
						<strong>CL++ syntax</strong>
						<span className="muted">
							<code>guard</code>, <code>match</code>, <code>signal</code>, <code>.:</code>, <code>::</code> — taught here, specified on the CL++ site.
						</span>
					</Link>
					<Link className="card" to="/docs/structs">
						<strong>Structs you own</strong>
						<span className="muted">
							A struct in the <code>.clh</code>, <code>Class::</code> methods in the <code>.clpp</code>,{" "}
							<code>void init()</code> to boot.
						</span>
					</Link>
					<Link className="card" to="/docs/cli">
						<strong>clpp + Rojo</strong>
						<span className="muted">
							<code>init</code>, <code>build</code>, <code>watch</code>. IntelliSense is{" "}
							<code>clpp install</code>. First-party libs require themselves.
						</span>
					</Link>
				</div>
			</section>
		</>
	);
}
