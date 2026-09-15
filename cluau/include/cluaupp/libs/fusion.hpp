#pragma once

// dphfox/Fusion 0.4 — vendored into CluauppLibs.Fusion
namespace Fusion {
	auto scoped();
	auto New(string className);
	auto Value(auto initial);
	auto Computed(void (*callback)());
	auto Observer(auto value);
	auto peek(auto value);
	auto Hydrate(Instance* instance);
	auto Children();
	auto Child();
	auto OnEvent(string eventName);
	auto OnChange(string propertyName);
	auto Out(string propertyName);
	auto Attribute(string name);
	auto AttributeChange(string name);
	auto AttributeOut(string name);
	auto Tag(string name);
	auto Tween(auto value, auto tweenInfo);
	auto Spring(auto value, double speed, double damping);
	auto ForKeys(auto input, void (*processor)());
	auto ForValues(auto input, void (*processor)());
	auto ForPairs(auto input, void (*processor)());
	auto doCleanup(auto task);
	auto deriveScope(auto scope);
	auto innerScope(auto scope);
	auto insert(auto scope, auto task);
	auto Contextual(auto defaultValue);
	auto Safe(void (*callback)());
}
