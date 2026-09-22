import type { LoadedSource } from "../loader.js";
import { loadJsonFile } from "../loader.js";

/** Studio --api JSON (same shape family as Mini dump when exported). */
export function loadStudioApi(filePath: string): LoadedSource<unknown> {
	return loadJsonFile("studio-api", filePath);
}
