import type { LoadedSource } from "../loader.js";
import { loadJsonFile } from "../loader.js";

/**
 * Studio --apiV2 JSON export — preferred canonical schema when available.
 * Until a fixture is checked in, callers may pass a local Studio dump path.
 */
export function loadStudioApiV2(filePath: string): LoadedSource<unknown> {
	return loadJsonFile("studio-api-v2", filePath);
}
