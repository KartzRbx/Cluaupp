const RunService = game:GetService("RunService")

const Path = require(script.Path)

local function createUnavailableContext(contextName: string)
	local rootPaths = Path.rootToken()

	return {
		Init = function()
			error(`DataService.{contextName}:Init is not available in this runtime context`, 2)
		end,
		WaitFor = function()
			error(`DataService.{contextName}:WaitFor is not available in this runtime context`, 2)
		end,
		WaitForData = function()
			error(`DataService.{contextName}:WaitForData is not available in this runtime context`, 2)
		end,
		Get = function()
			error(`DataService.{contextName}:Get is not available in this runtime context`, 2)
		end,
		GetBufferStats = function()
			return nil
		end,
		Destroy = function() end,
		Paths = rootPaths,
	}
end

const DataService = {
	Paths = Path.rootToken(),
	Enum = require(script.Enum),
}

if RunService:IsServer() then
	const Server = require(script.Server)
	DataService.Server = Server
	DataService.Client = createUnavailableContext("Client")
	DataService.Paths = Server.Paths
else
	const Client = require(script.Client)
	DataService.Client = Client
	DataService.Server = createUnavailableContext("Server")
	DataService.Paths = Client.Paths
end


local function sessionOf(player: Player?)
	if RunService:IsServer() then
		if player == nil then
			return nil
		end
		return DataService.Server:Get(player)
	end
	return DataService.Client:Get()
end

-- Cluaupp C++ surface: DataService::Get(player, path)
function DataService.Get(player: Player, path: any): any
	local data = sessionOf(player)
	if data == nil then
		return nil
	end
	return data:Get(path)
end

function DataService.GetPersisted(player: Player, path: any): any
	local data = sessionOf(player)
	if data == nil then
		return nil
	end
	return data:GetPersisted(path)
end

function DataService.Set(player: Player, path: any, value: any)
	local data = sessionOf(player)
	if data then
		data:Set(path, value)
	end
end

function DataService.SetTransient(player: Player, path: any, value: any)
	local data = sessionOf(player)
	if data then
		data:SetTransient(path, value)
	end
end

function DataService.UpdateTransient(player: Player, path: any, value: any)
	local data = sessionOf(player)
	if data then
		data:UpdateTransient(path, function()
			return value
		end)
	end
end

function DataService.ClearTransient(player: Player, path: any)
	local data = sessionOf(player)
	if data then
		data:ClearTransient(path)
	end
end

function DataService.GetOrderedList(player: Player, path: any): any
	local data = sessionOf(player)
	if data == nil then
		return nil
	end
	return data:GetOrderedList(path, {})
end

function DataService.GetOrderedListWithPriority(player: Player, path: any): any
	local data = sessionOf(player)
	if data == nil then
		return nil
	end
	return data:GetOrderedListWithPriority(path, "Priority")
end

function DataService.WaitFor(player: Player): any
	if RunService:IsServer() then
		return DataService.Server:WaitFor(player)
	end
	return DataService.Client:WaitForData()
end

function DataService.Observe(player: Player, path: any, callback: (...any) -> ()): RBXScriptConnection
	local data = DataService.WaitFor(player)
	return data:GetChangedSignal(path):Connect(callback)
end

return DataService
