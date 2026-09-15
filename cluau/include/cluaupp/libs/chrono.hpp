#pragma once

// Parihsz/Chrono — custom character replication, vendored into CluauppLibs.Chrono
namespace Chrono {
	void Start();
	void Start(ModuleScript* config);
	auto Holder();
	auto Entity();
	auto Stats();
	auto Config();
	auto ReplicationRules();
	auto Events();
	auto Snapshots();
	auto ServerClock();
	auto Player();
}
