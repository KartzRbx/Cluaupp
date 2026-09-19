"use strict";

const fs = require("fs");
const path = require("path");

const dest = path.join(__dirname, "..", "runtime", "Axiom", "init.luau");

const groups = {
	Scalar: [],
	Lerp: [],
	Vector: [],
	CFrame: [],
	Easing: [],
	Bezier: [],
	Geometry: [],
	Trig: [],
	Probability: [],
	Noise: [],
	Color: [],
};

function add(group, name, args, ret, body) {
	groups[group].push({ name, args, ret, body });
}

add("Scalar", "Clamp", "value: number, min: number, max: number", "number", "return math.clamp(value, min, max)");
add("Scalar", "Map", "value: number, inMin: number, inMax: number, outMin: number, outMax: number", "number", "if inMax == inMin then return outMin end\n\treturn outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin))");
add("Scalar", "Wrap", "value: number, min: number, max: number", "number", "local range = max - min\n\tif range == 0 then return min end\n\tlocal wrapped = (value - min) % range\n\tif wrapped < 0 then wrapped += range end\n\treturn min + wrapped");
add("Scalar", "Sign", "value: number", "number", "if value > 0 then return 1 elseif value < 0 then return -1 end\n\treturn 0");
add("Scalar", "Round", "value: number, places: number?", "number", "local factor = 10 ^ (places or 0)\n\treturn math.floor(value * factor + 0.5) / factor");
add("Scalar", "Snap", "value: number, step: number", "number", "if step == 0 then return value end\n\treturn math.floor(value / step + 0.5) * step");
add("Scalar", "PingPong", "t: number, length: number", "number", "local doubled = t / math.max(length, 1e-8)\n\treturn length - math.abs(doubled % 2 * length - length)");
add("Scalar", "Saturate", "value: number", "number", "return math.clamp(value, 0, 1)");
add("Scalar", "Fract", "value: number", "number", "return value - math.floor(value)");
add("Scalar", "InvLerp", "from: number, to: number, value: number", "number", "if from == to then return 0 end\n\treturn (value - from) / (to - from)");
add("Scalar", "Approach", "current: number, target: number, maxDelta: number", "number", "return current + math.clamp(target - current, -maxDelta, maxDelta)");
add("Scalar", "IsFinite", "value: number", "boolean", "return value == value and value ~= math.huge and value ~= -math.huge");
add("Scalar", "Abs", "value: number", "number", "return math.abs(value)");
add("Scalar", "Min", "a: number, b: number", "number", "return math.min(a, b)");
add("Scalar", "Max", "a: number, b: number", "number", "return math.max(a, b)");
add("Scalar", "Pow", "base: number, exp: number", "number", "return base ^ exp");
add("Scalar", "Sqrt", "value: number", "number", "return math.sqrt(value)");
add("Scalar", "Cbrt", "value: number", "number", "return if value < 0 then -((-value) ^ (1 / 3)) else value ^ (1 / 3)");
add("Scalar", "Hypot", "a: number, b: number", "number", "return math.sqrt(a * a + b * b)");
add("Scalar", "Log", "value: number", "number", "return math.log(value)");
add("Scalar", "Exp", "value: number", "number", "return math.exp(value)");
add("Scalar", "Smoothstep", "edge0: number, edge1: number, x: number", "number", "local t = math.clamp((x - edge0) / math.max(edge1 - edge0, 1e-8), 0, 1)\n\treturn t * t * (3 - 2 * t)");
add("Scalar", "Smootherstep", "edge0: number, edge1: number, x: number", "number", "local t = math.clamp((x - edge0) / math.max(edge1 - edge0, 1e-8), 0, 1)\n\treturn t * t * t * (t * (t * 6 - 15) + 10)");
add("Scalar", "Gcd", "a: number, b: number", "number", "a, b = math.abs(a), math.abs(b)\n\twhile b ~= 0 do a, b = b, a % b end\n\treturn a");
add("Scalar", "Lcm", "a: number, b: number", "number", "local g = Axiom.Gcd(a, b)\n\tif g == 0 then return 0 end\n\treturn math.abs(a * b) / g");
add("Scalar", "IsEven", "value: number", "boolean", "return value % 2 == 0");
add("Scalar", "IsOdd", "value: number", "boolean", "return value % 2 ~= 0");
add("Scalar", "Factorial", "n: number", "number", "local f = 1\n\tfor i = 2, math.floor(n) do f *= i end\n\treturn f");
add("Scalar", "Scale", "value: number, index: number", "number", "local n = math.floor(index)\n\tlocal k = (n % 50) + 1\n\treturn value * k / 50");

add("Lerp", "Lerp", "from: number, to: number, alpha: number", "number", "return from + (to - from) * alpha");
add("Lerp", "LerpClamped", "from: number, to: number, alpha: number", "number", "return from + (to - from) * math.clamp(alpha, 0, 1)");
add("Lerp", "LerpVector2", "from: Vector2, to: Vector2, alpha: number", "Vector2", "return from:Lerp(to, alpha)");
add("Lerp", "LerpVector3", "from: Vector3, to: Vector3, alpha: number", "Vector3", "return from:Lerp(to, alpha)");
add("Lerp", "LerpColor3", "from: Color3, to: Color3, alpha: number", "Color3", "return from:Lerp(to, alpha)");
add("Lerp", "LerpCFrame", "from: CFrame, to: CFrame, alpha: number", "CFrame", "return from:Lerp(to, alpha)");
add("Lerp", "LerpUDim2", "from: UDim2, to: UDim2, alpha: number", "UDim2", "return from:Lerp(to, alpha)");
add("Lerp", "LerpAngle", "from: number, to: number, alpha: number", "number", "return from + Axiom.DeltaAngle(from, to) * alpha");
add("Lerp", "Inverse", "from: number, to: number, value: number", "number", "return Axiom.InvLerp(from, to, value)");

add("Vector", "Project", "a: Vector3, b: Vector3", "Vector3", "local d = b.Magnitude\n\tif d < 1e-8 then return Vector3.zero end\n\treturn b.Unit * a:Dot(b.Unit)");
add("Vector", "Reject", "a: Vector3, b: Vector3", "Vector3", "return a - Axiom.Project(a, b)");
add("Vector", "Reflect", "incident: Vector3, normal: Vector3", "Vector3", "return incident - 2 * incident:Dot(normal) * normal");
add("Vector", "Angle", "a: Vector3, b: Vector3", "number", "return math.acos(math.clamp(a.Unit:Dot(b.Unit), -1, 1))");
add("Vector", "Distance", "a: Vector3, b: Vector3", "number", "return (b - a).Magnitude");
add("Vector", "Distance2", "a: Vector2, b: Vector2", "number", "return (b - a).Magnitude");
add("Vector", "Orthonormal", "forward: Vector3, up: Vector3?", "CFrame", "local u = up or Vector3.yAxis\n\tlocal f = forward.Unit\n\tlocal r = f:Cross(u)\n\tif r.Magnitude < 1e-8 then r = f:Cross(Vector3.xAxis) end\n\tr = r.Unit\n\treturn CFrame.fromMatrix(Vector3.zero, r, r:Cross(f), -f)");
add("Vector", "Slerp", "a: Vector3, b: Vector3, t: number", "Vector3", "local dot = math.clamp(a.Unit:Dot(b.Unit), -1, 1)\n\tlocal theta = math.acos(dot) * t\n\tlocal rel = (b.Unit - a.Unit * dot)\n\tif rel.Magnitude < 1e-8 then return a:Lerp(b, t) end\n\treturn (a.Unit * math.cos(theta) + rel.Unit * math.sin(theta)) * ((1 - t) * a.Magnitude + t * b.Magnitude)");
add("Vector", "LookAt", "from: Vector3, look: Vector3", "CFrame", "return CFrame.lookAt(from, look)");

add("CFrame", "SlerpCFrame", "a: CFrame, b: CFrame, t: number", "CFrame", "return a:Lerp(b, t)");
add("CFrame", "Flat", "cf: CFrame", "CFrame", "local look = cf.LookVector * Vector3.new(1, 0, 1)\n\tif look.Magnitude < 1e-8 then look = Vector3.zAxis end\n\treturn CFrame.lookAt(cf.Position, cf.Position + look.Unit)");

const easings = ["Sine", "Quad", "Cubic", "Quart", "Quint", "Expo", "Circ", "Back", "Elastic", "Bounce"];
const modes = ["In", "Out", "InOut"];
for (const ease of easings) {
	for (const mode of modes) {
		add("Easing", `${mode}${ease}`, "t: number", "number", `return Axiom._ease("${ease}", "${mode}", math.clamp(t, 0, 1))`);
	}
}
add("Easing", "Linear", "t: number", "number", "return math.clamp(t, 0, 1)");

add("Bezier", "CubicBezier", "t: number, p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3", "Vector3", "local u = 1 - t\n\treturn u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3");
add("Bezier", "QuadraticBezier", "t: number, p0: Vector3, p1: Vector3, p2: Vector3", "Vector3", "local u = 1 - t\n\treturn u*u*p0 + 2*u*t*p1 + t*t*p2");
add("Bezier", "Hover", "elapsed: number, anchor: Vector3, look: Vector3", "CFrame", "local bob = math.sin(elapsed * 1.6) * 0.22\n\treturn CFrame.lookAt(anchor + Vector3.new(0, bob, 0), look)");
add("Bezier", "Float", "elapsed: number, anchor: Vector3, look: Vector3", "CFrame", "local bob = math.sin(elapsed * 1.1) * 0.18\n\treturn CFrame.lookAt(anchor + Vector3.new(0, bob, 0), look)");
add("Bezier", "FloatSpin", "elapsed: number, anchor: CFrame", "CFrame", "local pos = anchor.Position\n\tlocal bob = math.sin(elapsed * 1.1) * 0.18\n\treturn CFrame.new(pos + Vector3.new(0, bob, 0)) * CFrame.Angles(0, math.rad((elapsed * 50) % 360), 0)");

add("Geometry", "AabbContains", "point: Vector3, min: Vector3, max: Vector3", "boolean", "return point.X >= min.X and point.X <= max.X and point.Y >= min.Y and point.Y <= max.Y and point.Z >= min.Z and point.Z <= max.Z");
add("Geometry", "SphereContains", "point: Vector3, center: Vector3, radius: number", "boolean", "return (point - center).Magnitude <= radius");
add("Geometry", "RayPlane", "origin: Vector3, dir: Vector3, point: Vector3, normal: Vector3", "Vector3", "local denom = dir:Dot(normal)\n\tif math.abs(denom) < 1e-8 then return Vector3.zero end\n\tlocal t = (point - origin):Dot(normal) / denom\n\tif t < 0 then return Vector3.zero end\n\treturn origin + dir * t");
add("Geometry", "Barycentric", "p: Vector3, a: Vector3, b: Vector3, c: Vector3", "Vector3", "local v0, v1, v2 = b - a, c - a, p - a\n\tlocal d00, d01, d11, d20, d21 = v0:Dot(v0), v0:Dot(v1), v1:Dot(v1), v2:Dot(v0), v2:Dot(v1)\n\tlocal denom = d00 * d11 - d01 * d01\n\tif math.abs(denom) < 1e-8 then return Vector3.new(1, 0, 0) end\n\tlocal v = (d11 * d20 - d01 * d21) / denom\n\tlocal w = (d00 * d21 - d01 * d20) / denom\n\treturn Vector3.new(1 - v - w, v, w)");
add("Geometry", "ClosestPointOnSegment", "p: Vector3, a: Vector3, b: Vector3", "Vector3", "local ab = b - a\n\tlocal t = math.clamp((p - a):Dot(ab) / math.max(ab:Dot(ab), 1e-8), 0, 1)\n\treturn a + ab * t");

add("Trig", "Deg", "rad: number", "number", "return math.deg(rad)");
add("Trig", "Rad", "deg: number", "number", "return math.rad(deg)");
add("Trig", "DeltaAngle", "from: number, to: number", "number", "local delta = (to - from + math.pi) % (math.pi * 2) - math.pi\n\treturn delta");
add("Trig", "DeltaAngleDegrees", "from: number, to: number", "number", "local delta = (to - from) % 360\n\tif delta > 180 then delta -= 360 end\n\treturn delta");
add("Trig", "NormalizeAngle", "angle: number", "number", "return Axiom.Wrap(angle, -math.pi, math.pi)");
add("Trig", "Sin", "x: number", "number", "return math.sin(x)");
add("Trig", "Cos", "x: number", "number", "return math.cos(x)");
add("Trig", "Tan", "x: number", "number", "return math.tan(x)");
add("Trig", "Asin", "x: number", "number", "return math.asin(x)");
add("Trig", "Acos", "x: number", "number", "return math.acos(x)");
add("Trig", "Atan2", "y: number, x: number", "number", "return math.atan2(y, x)");

add("Probability", "RandomRange", "min: number, max: number", "number", "return min + (max - min) * math.random()");
add("Probability", "Weighted", "weights: { number }", "number", "if #weights == 0 then return 0 end\n\tlocal total = 0\n\tfor _, w in weights do total += w end\n\tif total <= 0 then return 1 end\n\tlocal pick = math.random() * total\n\tlocal acc = 0\n\tfor i, w in weights do acc += w\n\t\tif pick <= acc then return i end\n\tend\n\treturn #weights");
add("Probability", "Gaussian", "mean: number?, std: number?", "number", "local u, v = math.random(), math.random()\n\tlocal mag = math.sqrt(-2 * math.log(math.max(u, 1e-8))) * math.cos(2 * math.pi * v)\n\treturn (mean or 0) + mag * (std or 1)");
add("Probability", "Average", "values: { number }", "number", "if #values == 0 then return 0 end\n\tlocal sum = 0\n\tfor _, v in values do sum += v end\n\treturn sum / #values");
add("Probability", "Sum", "values: { number }", "number", "local total = 0\n\tfor _, v in values do total += v end\n\treturn total");

add("Noise", "HashU32", "n: number", "number", "local x = bit32.bxor(math.floor(n) * 374761393, bit32.rshift(math.floor(n), 13))\n\treturn bit32.band(x * 1274126177, 0xffffffff)");
add("Noise", "Value1", "x: number", "number", "return Axiom.HashU32(x) / 4294967295");
add("Noise", "Value2", "x: number, y: number", "number", "return Axiom.HashU32(x * 374761 + y * 668265) / 4294967295");
add("Noise", "Value3", "x: number, y: number, z: number", "number", "return Axiom.HashU32(x * 374761 + y * 668265 + z * 1274126) / 4294967295");

add("Color", "FromHSV", "h: number, s: number, v: number", "Color3", "return Color3.fromHSV(h, s, v)");
add("Color", "Contrast", "color: Color3, amount: number", "Color3", "return Color3.new(math.clamp((color.R - 0.5) * amount + 0.5, 0, 1), math.clamp((color.G - 0.5) * amount + 0.5, 0, 1), math.clamp((color.B - 0.5) * amount + 0.5, 0, 1))");
add("Color", "LerpHSV", "a: Color3, b: Color3, t: number", "Color3", "local ah, as, av = a:ToHSV()\n\tlocal bh, bs, bv = b:ToHSV()\n\treturn Color3.fromHSV((ah + Axiom.DeltaAngle(ah * math.pi * 2, bh * math.pi * 2) / (math.pi * 2) * t) % 1, as + (bs - as) * t, av + (bv - av) * t)");

let total = 0;
for (const list of Object.values(groups)) total += list.length;

const fns = [];
fns.push(`--!native
--!optimize 2
--!strict
-- Axiom — Cluaupp math. ${total} formulas grouped; .axiom tree-shakes unused groups.
-- Every public function returns a concrete type. No any. No nil on the math path.

local Axiom = {}

function Axiom._ease(kind: string, mode: string, t: number): number
	local x = t
	if kind == "Sine" then
		x = if mode == "In" then 1 - math.cos((t * math.pi) / 2) elseif mode == "Out" then math.sin((t * math.pi) / 2) else -(math.cos(math.pi * t) - 1) / 2
	elseif kind == "Quad" then
		x = if mode == "In" then t * t elseif mode == "Out" then 1 - (1 - t) * (1 - t) else (if t < 0.5 then 2 * t * t else 1 - (-2 * t + 2) ^ 2 / 2)
	elseif kind == "Cubic" then
		x = if mode == "In" then t ^ 3 elseif mode == "Out" then 1 - (1 - t) ^ 3 else (if t < 0.5 then 4 * t ^ 3 else 1 - (-2 * t + 2) ^ 3 / 2)
	elseif kind == "Quart" then
		x = if mode == "In" then t ^ 4 elseif mode == "Out" then 1 - (1 - t) ^ 4 else (if t < 0.5 then 8 * t ^ 4 else 1 - (-2 * t + 2) ^ 4 / 2)
	elseif kind == "Quint" then
		x = if mode == "In" then t ^ 5 elseif mode == "Out" then 1 - (1 - t) ^ 5 else (if t < 0.5 then 16 * t ^ 5 else 1 - (-2 * t + 2) ^ 5 / 2)
	elseif kind == "Expo" then
		x = if t == 0 then 0 elseif t == 1 then 1 elseif mode == "In" then 2 ^ (10 * t - 10) elseif mode == "Out" then 1 - 2 ^ (-10 * t) else (if t < 0.5 then 2 ^ (20 * t - 10) / 2 else (2 - 2 ^ (-20 * t + 10)) / 2)
	elseif kind == "Circ" then
		x = if mode == "In" then 1 - math.sqrt(1 - t ^ 2) elseif mode == "Out" then math.sqrt(1 - (t - 1) ^ 2) else (if t < 0.5 then (1 - math.sqrt(1 - (2 * t) ^ 2)) / 2 else (math.sqrt(1 - (-2 * t + 2) ^ 2) + 1) / 2)
	elseif kind == "Back" then
		local c1, c3 = 1.70158, 2.70158
		x = if mode == "In" then c3 * t ^ 3 - c1 * t ^ 2 elseif mode == "Out" then 1 + c3 * (t - 1) ^ 3 + c1 * (t - 1) ^ 2 else (if t < 0.5 then ((2 * t) ^ 2 * ((c1 * 1.525 + 1) * 2 * t - c1 * 1.525)) / 2 else ((2 * t - 2) ^ 2 * ((c1 * 1.525 + 1) * (t * 2 - 2) + c1 * 1.525) + 2) / 2)
	elseif kind == "Elastic" then
		x = if t == 0 then 0 elseif t == 1 then 1 elseif mode == "In" then -2 ^ (10 * t - 10) * math.sin((t * 10 - 10.75) * ((2 * math.pi) / 3)) elseif mode == "Out" then 2 ^ (-10 * t) * math.sin((t * 10 - 0.75) * ((2 * math.pi) / 3)) + 1 else (if t < 0.5 then -(2 ^ (20 * t - 10) * math.sin((20 * t - 11.125) * ((2 * math.pi) / 4.5))) / 2 else (2 ^ (-20 * t + 10) * math.sin((20 * t - 11.125) * ((2 * math.pi) / 4.5))) / 2 + 1)
	elseif kind == "Bounce" then
		local function out(v: number): number
			local n1, d1 = 7.5625, 2.75
			if v < 1 / d1 then return n1 * v * v elseif v < 2 / d1 then v -= 1.5 / d1 return n1 * v * v + 0.75 elseif v < 2.5 / d1 then v -= 2.25 / d1 return n1 * v * v + 0.9375 else v -= 2.625 / d1 return n1 * v * v + 0.984375 end
		end
		x = if mode == "In" then 1 - out(1 - t) elseif mode == "Out" then out(t) else (if t < 0.5 then (1 - out(1 - 2 * t)) / 2 else (1 + out(2 * t - 1)) / 2)
	end
	return x
end
`);

const byGroup = [];
for (const [group, list] of Object.entries(groups)) {
	const names = [];
	for (const item of list) {
		fns.push(`function Axiom.${item.name}(${item.args}): ${item.ret}\n\t${item.body}\nend\n`);
		names.push(`"${item.name}"`);
	}
	byGroup.push(`\t${group} = { ${names.join(", ")} },`);
}

fns.push(`Axiom.Groups = {\n${byGroup.join("\n")}\n} :: { [string]: { string } }\n`);
fns.push(`function Axiom.Select(groupNames: { string }): typeof(Axiom)
	local selected: { [string]: unknown } = {}
	for _, group in groupNames do
		local names = Axiom.Groups[group]
		if not names then
			error(\`[Axiom.Select] unknown group "{group}"\`)
		end
		for _, name in names do
			selected[name] = Axiom[name]
		end
	end
	if selected.LerpVector3 ~= nil then
		selected.LerpVector = selected.LerpVector3
	end
	if selected.RandomRange ~= nil then
		selected.Random = selected.RandomRange
	end
	if selected.DeltaAngle ~= nil then
		selected.AngleDiff = selected.DeltaAngle
	end
	return selected :: typeof(Axiom)
end
`);
fns.push(`Axiom.LerpVector = Axiom.LerpVector3
Axiom.Random = Axiom.RandomRange
Axiom.AngleDiff = Axiom.DeltaAngle
return Axiom
`);

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, fns.join("\n"), "utf8");
console.log("wrote", dest, "functions", total);
