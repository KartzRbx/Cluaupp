#pragma once

// evaera/roblox-lua-promise — vendored into CluauppLibs.Promise
// C++ Then/Catch/Await/Cancel map onto andThen/catch/await/cancel.
class Promise {
public:
	Promise(void (*executor)());
	static Promise* resolve(auto value);
	static Promise* reject(auto err);
	static Promise* delay(double seconds);
	static Promise* try_(void (*callback)());
	static Promise* all(auto list);
	static Promise* race(auto list);
	static Promise* retry(void (*callback)(), int times);
	Promise* Then(void (*ok)());
	Promise* Catch(void (*fail)());
	Promise* Finally(void (*callback)());
	Promise* andThen(void (*ok)());
	Promise* catch_(void (*fail)());
	Promise* finally(void (*callback)());
	auto Await();
	auto await();
	void Cancel();
	void cancel();
	string GetStatus();
	string getStatus();
};
