#pragma once

// Prooheckcp/RobloxStateMachine — vendored into CluauppLibs.StateMachine
class StateMachine {
public:
	static StateMachine* new_(string initial);
	static auto LoadDirectory(Instance* directory);
	void ChangeState(string name);
	string GetState();
	string GetCurrentState();
	string GetPreviousState();
	auto GetData();
	void ChangeData(string index, auto value);
	void Destroy();
};
