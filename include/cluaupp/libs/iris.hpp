#pragma once

// SirMallard/Iris — vendored into CluauppLibs.Iris
namespace Iris {
	void Init();
	void Init(Instance* parent);
	void Shutdown();
	void Connect(void (*callback)());
	bool Window(string title);
	void End();
	void Text(string text);
	bool Button(string label);
	bool SmallButton(string label);
	bool Checkbox(string label);
	bool Checkbox(string label, bool* value);
	auto InputNum(string label);
	auto InputText(string label);
	auto SliderNum(string label);
	auto DragNum(string label);
	bool Tree(string label);
	bool CollapsingHeader(string label);
	bool Combo(string label);
	bool RadioButton(string label, auto value);
	bool TabBar();
	bool Tab(string label);
	bool Table(int columns);
	void SameLine();
	void Separator();
	void Indent();
	void Unindent();
	auto State(auto initial);
	void PushConfig(auto style);
	void PopConfig();
	void ForceRefresh();
	void Append(GuiObject* instance);
}
