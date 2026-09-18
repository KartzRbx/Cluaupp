# CL++ syntax (Cluaupp)

Cluaupp does **not** define the language. Write CL++ (`.clpp` / `.clp` / `.clh`); `clpp` emits Luau. Full course and reference: **[kartzrbx.github.io/CLPP](https://kartzrbx.github.io/CLPP/)**.

## Files

| Source | Rojo |
| --- | --- |
| `*.server.clpp` | Script |
| `*.client.clpp` | LocalScript |
| `*.plugin.clpp` | Plugin Script |
| `*.clp` / untagged `.clpp` | ModuleScript |
| `*.clh` | ModuleScript (types / structs) |

`void init()` is the script entry. There is no `int main()`.

## Accessors

CL++ does **not** use `->`.

| Write | Meaning | Luau |
| --- | --- | --- |
| `player.Name` | property | `.` |
| `player::FindFirstChild("x")` | method | `:` |
| `players.PlayerAdded::Connect(fn)` | property then method | `.` then `:` |
| `DataService:Server` | table key | `.` |
| `"hi " .: name` | concat | `..` |

`post` / `warn` / `report` → `print` / `warn` / `error`. `null` is `nil`.

## Exclusive CL++ (compiled by `clpp`)

```clpp
guard (player != null) else {
	warn("Invalid player");
	return;
}

match (child) {
	BasePart* p => BindPart(p),
	Model* m => post("model spawned " .: m.Name),
	_ => warn("ignored instance")
};

observable int wallet = 100;
wallet.OnChange(func (int newValue) {
	post("Coins changed to: " .: newValue);
});

signal<Player*, int> OnHit;
OnHit::Connect(func (Player* player, int amount) {
	post(player.Name .: " dmg " .: amount);
});
OnHit::Fire(player, 10);

array<string> names = {"Kartz", "Player1"};
dictionary<string, int> stats = { {"Coins", 100}, {"Gems", 50} };

spawn { task::wait(1); post("ready"); };
parallel { post("desync"); };

async Data* FetchData(Player* player) {
	return await DataService:Server::WaitFor(player);
}

[[server]]
void SaveData(Player* player) { post(player.Name); }

[[client]]
void UpdateUI() { post("ui"); }
```

Fusion HUD uses `Fusion:scoped`, `Fusion:Value`, `Fusion:Computed`, `Fusion:New`. See [`examples/game`](../examples/game) (`combat.server.clpp`, `hud.client.clpp`, `features.clp`, `PlayerData.clh`).

## What Cluaupp adds after `clpp`

- `require(ClppLibs.X)` → `require(ReplicatedStorage.CluauppLibs.X)`
- `--!strict` from `cluaupp.config.json` / `#pragma strict`
- `out/` layout for Rojo (`init`, `build`, `watch`)
