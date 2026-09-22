import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "../package-info.js";
import { builtinCapabilityProfile, type CapabilityProfile } from "./capabilities.js";

export function capabilityProfilePath(): string {
	return path.join(projectRoot, "api", "generated", "capability-profile.json");
}

export function writeCapabilityProfile(profile: CapabilityProfile = builtinCapabilityProfile()): string {
	const out = capabilityProfilePath();
	fs.mkdirSync(path.dirname(out), { recursive: true });
	const tmp = `${out}.${process.pid}.tmp`;
	fs.writeFileSync(tmp, `${JSON.stringify(profile, null, "\t")}\n`, "utf8");
	fs.renameSync(tmp, out);
	return out;
}

export function loadCapabilityProfile(): CapabilityProfile {
	const file = capabilityProfilePath();
	if (!fs.existsSync(file)) {
		return builtinCapabilityProfile();
	}
	return JSON.parse(fs.readFileSync(file, "utf8")) as CapabilityProfile;
}
