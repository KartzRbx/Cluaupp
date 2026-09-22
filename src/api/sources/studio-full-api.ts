import type { LoadedSource } from "../loader.js";
import { loadJsonFile } from "../loader.js";

/** Studio --fullApi JSON export. */
export function loadStudioFullApi(filePath: string): LoadedSource<unknown> {
	return loadJsonFile("studio-full-api", filePath);
}
