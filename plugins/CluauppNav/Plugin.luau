-- Cluaupp Studio plugin: nav + debug panel + IDE bridge.
-- Install: copy plugins/CluauppNav into Roblox Plugins folder.
-- Bridge: run `cluaupp bridge` in the game root (http://127.0.0.1:3847).

local HttpService = game:GetService("HttpService")
local ScriptContext = game:GetService("ScriptContext")
local Selection = game:GetService("Selection")
local RunService = game:GetService("RunService")

local BRIDGE = "http://127.0.0.1:3847"

local toolbar = plugin:CreateToolbar("Cluaupp")
local btnSource = toolbar:CreateButton("Source", "Show CL++ path for selected Script", "")
local btnOpenIde = toolbar:CreateButton("Open IDE", "Ask IDE bridge to open CL++ source", "")
local btnPanel = toolbar:CreateButton("Debug", "Toggle Cluaupp debug panel", "")

local widgetInfo = DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Right, false, false, 320, 420, 260, 200)
local widget = plugin:CreateDockWidgetPluginGui("CluauppDebug", widgetInfo)
widget.Title = "Cluaupp Debug"

local root = Instance.new("Frame")
root.Size = UDim2.fromScale(1, 1)
root.BackgroundColor3 = Color3.fromRGB(30, 30, 34)
root.BorderSizePixel = 0
root.Parent = widget

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, -12, 0, 28)
title.Position = UDim2.fromOffset(6, 4)
title.BackgroundTransparency = 1
title.TextXAlignment = Enum.TextXAlignment.Left
title.Font = Enum.Font.GothamBold
title.TextSize = 14
title.TextColor3 = Color3.fromRGB(230, 230, 235)
title.Text = "Cluaupp Debug"
title.Parent = root

local pathLabel = Instance.new("TextLabel")
pathLabel.Size = UDim2.new(1, -12, 0, 48)
pathLabel.Position = UDim2.fromOffset(6, 36)
pathLabel.BackgroundTransparency = 1
pathLabel.TextXAlignment = Enum.TextXAlignment.Left
pathLabel.TextYAlignment = Enum.TextYAlignment.Top
pathLabel.TextWrapped = true
pathLabel.Font = Enum.Font.Code
pathLabel.TextSize = 12
pathLabel.TextColor3 = Color3.fromRGB(180, 220, 180)
pathLabel.Text = "(select a Script)"
pathLabel.Parent = root

local logBox = Instance.new("ScrollingFrame")
logBox.Size = UDim2.new(1, -12, 1, -100)
logBox.Position = UDim2.fromOffset(6, 92)
logBox.BackgroundColor3 = Color3.fromRGB(22, 22, 26)
logBox.BorderSizePixel = 0
logBox.ScrollBarThickness = 6
logBox.CanvasSize = UDim2.new(0, 0, 0, 0)
logBox.AutomaticCanvasSize = Enum.AutomaticSize.Y
logBox.Parent = root

local logLayout = Instance.new("UIListLayout")
logLayout.Parent = logBox
logLayout.SortOrder = Enum.SortOrder.LayoutOrder
logLayout.Padding = UDim.new(0, 4)

local function appendLog(text: string, color: Color3?)
	local row = Instance.new("TextLabel")
	row.Size = UDim2.new(1, -8, 0, 0)
	row.AutomaticSize = Enum.AutomaticSize.Y
	row.BackgroundTransparency = 1
	row.TextXAlignment = Enum.TextXAlignment.Left
	row.TextYAlignment = Enum.TextYAlignment.Top
	row.TextWrapped = true
	row.Font = Enum.Font.Code
	row.TextSize = 11
	row.TextColor3 = color or Color3.fromRGB(200, 200, 210)
	row.Text = text
	row.Parent = logBox
end

local function findSourceComment(source: string): string?
	for line in string.gmatch(source, "[^\r\n]+") do
		local p = string.match(line, "^%-%-%s*cluaupp%-source:%s*(.+)%s*$")
		if p then
			return p
		end
		if not string.match(line, "^%-%-") then
			break
		end
	end
	return nil
end

local function currentClppPath(): (string?, LuaSourceContainer?)
	local sel = Selection:Get()
	local scriptInst = sel[1]
	if not scriptInst or not scriptInst:IsA("LuaSourceContainer") then
		return nil, nil
	end
	local ok, source = pcall(function()
		return (scriptInst :: LuaSourceContainer).Source
	end)
	if not ok or typeof(source) ~= "string" then
		return nil, scriptInst :: LuaSourceContainer
	end
	local p = findSourceComment(source)
	if p then
		(scriptInst :: Instance):SetAttribute("CluauppSource", p)
	end
	return p, scriptInst :: LuaSourceContainer
end

local function postBridge(payload: { [string]: any })
	task.spawn(function()
		local ok, err = pcall(function()
			HttpService:RequestAsync({
				Url = BRIDGE .. "/open",
				Method = "POST",
				Headers = { ["Content-Type"] = "application/json" },
				Body = HttpService:JSONEncode(payload),
			})
		end)
		if not ok then
			appendLog("bridge offline — run `cluaupp bridge`\n" .. tostring(err), Color3.fromRGB(255, 160, 120))
		else
			appendLog("→ IDE " .. tostring(payload.path or payload.message), Color3.fromRGB(140, 200, 255))
		end
	end)
end

local function refreshSelection()
	local p, inst = currentClppPath()
	if p then
		pathLabel.Text = p
		if inst then
			pathLabel.Text ..= "\n(" .. inst:GetFullName() .. ")"
		end
	else
		pathLabel.Text = "(no cluaupp-source stamp — rebuild)"
	end
end

btnSource.Click:Connect(function()
	refreshSelection()
	local p = select(1, currentClppPath())
	if p then
		print("[Cluaupp] CL++ source:", p)
		appendLog("source " .. p)
	else
		warn("[Cluaupp] Select a Script with -- cluaupp-source:")
	end
end)

btnOpenIde.Click:Connect(function()
	refreshSelection()
	local p, inst = currentClppPath()
	if not p then
		warn("[Cluaupp] No CL++ path on selection")
		return
	end
	postBridge({
		type = "open",
		path = p,
		instancePath = inst and inst:GetFullName() or nil,
	})
end)

btnPanel.Click:Connect(function()
	widget.Enabled = not widget.Enabled
	if widget.Enabled then
		refreshSelection()
	end
end)

Selection.SelectionChanged:Connect(function()
	if widget.Enabled then
		refreshSelection()
	end
end)

-- Error → CL++ remap (Studio debugger helper)
ScriptContext.Error:Connect(function(message, stack, scriptInst)
	if not scriptInst or not scriptInst:IsA("LuaSourceContainer") then
		return
	end
	local ok, source = pcall(function()
		return (scriptInst :: LuaSourceContainer).Source
	end)
	local clpp = ok and typeof(source) == "string" and findSourceComment(source) or nil
	local line = tonumber(string.match(stack or "", ":(%d+)")) or 1
	local text = string.format("[error] %s\n  luau: %s\n  clpp: %s:%d", tostring(message), scriptInst:GetFullName(), tostring(clpp or "?"), line)
	appendLog(text, Color3.fromRGB(255, 120, 120))
	if clpp then
		postBridge({
			type = "error",
			path = clpp,
			line = line,
			message = tostring(message),
			instancePath = scriptInst:GetFullName(),
		})
	end
end)

appendLog("Ready. Enable HttpService + run cluaupp bridge for IDE sync.")
if not RunService:IsEdit() then
	appendLog("Play mode: errors remap to CL++ paths.")
end
