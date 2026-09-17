import { useId, useState } from "react";
import { highlight } from "../lib/highlight";

type Props = {
	cpp: string;
	luau: string;
};

export function CodePair({ cpp, luau }: Props) {
	const id = useId().replace(/:/g, "");
	const [tab, setTab] = useState<"cpp" | "luau">("cpp");

	return (
		<div className="pair" data-tabs>
			<div className="pair-tabs">
				<button
					type="button"
					role="tab"
					aria-selected={tab === "cpp"}
					aria-controls={`${id}-cpp`}
					id={`${id}-tab-cpp`}
					onClick={() => setTab("cpp")}
				>
					C++
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={tab === "luau"}
					aria-controls={`${id}-luau`}
					id={`${id}-tab-luau`}
					tabIndex={tab === "luau" ? 0 : -1}
					onClick={() => setTab("luau")}
				>
					Luau
				</button>
			</div>
			<div
				className="pair-panel"
				role="tabpanel"
				id={`${id}-cpp`}
				aria-labelledby={`${id}-tab-cpp`}
				hidden={tab !== "cpp"}
				dangerouslySetInnerHTML={{ __html: `<pre data-lang="cpp" data-highlighted="1">${highlight(cpp, "cpp")}</pre>` }}
			/>
			<div
				className="pair-panel"
				role="tabpanel"
				id={`${id}-luau`}
				aria-labelledby={`${id}-tab-luau`}
				hidden={tab !== "luau"}
				dangerouslySetInnerHTML={{ __html: `<pre data-lang="luau" data-highlighted="1">${highlight(luau, "luau")}</pre>` }}
			/>
		</div>
	);
}
