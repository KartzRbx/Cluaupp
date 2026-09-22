-- Studio / playtest PGO logger stub.
-- Paste into a Script during profiling sessions, or require from ReplicatedStorage.
-- Dump Output lines starting with CLUAUPP_PGO into a .jsonl file, then:
--   cluaupp profile ingest ./playtest.jsonl

local Profile = {}

local counts: { [string]: number } = {}

function Profile.Hit(symbol: string, n: number?)
	local add = n or 1
	counts[symbol] = (counts[symbol] or 0) + add
	print(string.format('CLUAUPP_PGO {"symbol":%q,"count":%d}', symbol, add))
end

function Profile.Dump()
	local lines = {}
	for symbol, count in counts do
		table.insert(lines, string.format('{"symbol":%q,"count":%d}', symbol, count))
	end
	print("CLUAUPP_PGO_DUMP_BEGIN")
	print(table.concat(lines, "\n"))
	print("CLUAUPP_PGO_DUMP_END")
	return counts
end

return Profile
