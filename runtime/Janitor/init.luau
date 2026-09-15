--!strict
-- Cluaupp Janitor — typed border. Engine: howmanysmall/Janitor (_impl).
-- Requires the sibling CluauppLibs.Promise module, never a nested stub.

--[=[
	@class Janitor
	Cleans up connections, instances, promises, and threads.
]=]

local PromiseMod = require(script.Parent.Promise)
type Promise<T...> = PromiseMod.Promise<T...>

local Impl = require(script._impl)

export type Janitor = {
	CurrentlyCleaning: boolean,
	SuppressInstanceReDestroy: boolean,
	UnsafeThreadCleanup: boolean,
	Add: <T>(self: Janitor, object: T, methodName: (boolean | string)?, index: string?) -> T,
	AddObject: <T, A...>(
		self: Janitor,
		constructor: { new: (A...) -> T },
		methodName: (boolean | string)?,
		index: string?,
		A...
	) -> T,
	AddPromise: <T...>(self: Janitor, promiseObject: Promise<T...>, index: string?) -> Promise<T...>,
	Remove: (self: Janitor, index: string) -> Janitor,
	RemoveNoClean: (self: Janitor, index: string) -> Janitor,
	RemoveList: (self: Janitor, ...string) -> Janitor,
	Get: <T>(self: Janitor, index: string) -> T?,
	GetAll: (self: Janitor) -> { [string]: unknown },
	Has: (self: Janitor, index: string) -> boolean,
	Cleanup: (self: Janitor) -> (),
	Destroy: (self: Janitor) -> (),
	LinkToInstance: (self: Janitor, object: Instance, allowMultiple: boolean?) -> RBXScriptConnection,
	LinkToInstances: (self: Janitor, ...Instance) -> Janitor,
}

type JanitorStatic = {
	new: () -> Janitor,
	Is: (value: unknown) -> boolean,
}

return Impl :: JanitorStatic
