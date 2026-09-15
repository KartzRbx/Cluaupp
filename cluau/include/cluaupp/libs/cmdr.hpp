#pragma once

// evaera/Cmdr — vendored into CluauppLibs.Cmdr (server). Client: Cmdr.CmdrClient
namespace Cmdr {
	void RegisterDefaultCommands();
	void RegisterHook(string name, void (*callback)());
	void RegisterType(string name, auto typeDefinition);
	void RegisterCommand(auto commandDefinition);
	auto Registry();
	auto Dispatcher();
}
