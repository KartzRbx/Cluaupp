import type { LoadedSource } from "../loader.js";
import { loadJsonFile } from "../loader.js";

/**
 * Optional Client Tracker adapter (non-authoritative early-diff source).
 * Pass a local API-Dump.json / Full-API-Dump.json checkout path.
 */
export function loadClientTrackerDump(filePath: string): LoadedSource<unknown> {
	return loadJsonFile("client-tracker", filePath);
}
