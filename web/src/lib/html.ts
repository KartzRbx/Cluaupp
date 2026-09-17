import { escapeHtml, preCode } from "./highlight";

let pairSeq = 0;

export { escapeHtml, preCode };

export function codePair(cpp: string, luau: string) {
	pairSeq += 1;
	const id = `pair-${pairSeq}`;
	return `<div class="pair" data-tabs>
	<div class="pair-tabs">
		<span class="tab-ink" aria-hidden="true"></span>
		<button type="button" role="tab" aria-selected="true" aria-controls="${id}-cpp" id="${id}-tab-cpp">CL++</button>
		<button type="button" role="tab" aria-selected="false" aria-controls="${id}-luau" id="${id}-tab-luau" tabindex="-1">Luau</button>
	</div>
	<div class="pair-panel" role="tabpanel" id="${id}-cpp" aria-labelledby="${id}-tab-cpp">${preCode(cpp, "cpp")}</div>
	<div class="pair-panel" role="tabpanel" id="${id}-luau" aria-labelledby="${id}-tab-luau" hidden>${preCode(luau, "luau")}</div>
</div>`;
}

export function mappingTable() {
	return `<table>
<tr><th>CL++</th><th>Luau</th></tr>
<tr><td><code>int</code> / <code>float</code> / <code>double</code></td><td><code>number</code></td></tr>
<tr><td><code>bool</code></td><td><code>boolean</code></td></tr>
<tr><td><code>string</code></td><td><code>string</code></td></tr>
<tr><td><code>const int N = 1</code></td><td><code>const N: number = 1</code></td></tr>
<tr><td><code>Part*</code> / <code>auto*</code></td><td><code>Part</code> (Instance handle)</td></tr>
<tr><td><code>Vector3(0, 10, 0)</code></td><td><code>Vector3.new(0, 10, 0)</code></td></tr>
<tr><td><code>CFrame.lookAt(from, look)</code> / <code>CFrame::lookAt</code></td><td><code>CFrame.lookAt(from, look)</code></td></tr>
<tr><td><code>UDim2.fromScale(1, 1)</code></td><td><code>UDim2.fromScale(1, 1)</code></td></tr>
<tr><td><code>Color3.fromRGB(255, 0, 0)</code></td><td><code>Color3.fromRGB(255, 0, 0)</code></td></tr>
<tr><td><code>Enum::Material::Plastic</code></td><td><code>Enum.Material.Plastic</code></td></tr>
<tr><td><code>new Part(workspace)</code></td><td><code>Instance.new("Part")</code> + <code>.Parent</code></td></tr>
<tr><td><code>part.Name</code></td><td><code>part.Name</code></td></tr>
<tr><td><code>player::FindFirstChild("x")</code></td><td><code>player:FindFirstChild("x")</code></td></tr>
<tr><td><code>GetService&lt;Players&gt;()</code></td><td><code>game:GetService("Players")</code></td></tr>
<tr><td><code>new Janitor()</code></td><td><code>Janitor.new()</code></td></tr>
<tr><td><code>DataService:Server</code></td><td><code>DataService.Server</code></td></tr>
<tr><td><code>"hi " .: name</code></td><td><code>"hi " .. name</code></td></tr>
<tr><td><code>signal~&gt;Connect(fn)</code></td><td>Janitor <code>Add</code> + <code>Connect</code></td></tr>
<tr><td><code>post</code> / <code>report</code></td><td><code>print</code> / <code>error</code></td></tr>
<tr><td><code>null</code></td><td><code>nil</code></td></tr>
</table>`;
}
