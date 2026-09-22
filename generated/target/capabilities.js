"use strict";
/**
 * Context Safety — capability profile for CL++ compile (Cluaupp target).
 * CLPP may consume this JSON later; Cluaupp enforces rules today.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAPABILITY_PROFILE_SCHEMA_VERSION = void 0;
exports.builtinCapabilityProfile = builtinCapabilityProfile;
exports.capabilitiesForContext = capabilitiesForContext;
exports.CAPABILITY_PROFILE_SCHEMA_VERSION = 1;
/** Builtin Roblox platform capability rules (v1). */
function builtinCapabilityProfile() {
    return {
        schemaVersion: exports.CAPABILITY_PROFILE_SCHEMA_VERSION,
        target: "roblox",
        rules: [
            {
                id: "CLUAUPP_CTX_LOCALPLAYER",
                message: "`LocalPlayer` is client-only — illegal in Server scripts",
                pattern: String.raw `\bLocalPlayer\b`,
                forbiddenIn: ["Server"],
                severity: "error",
                capability: "client_player",
            },
            {
                id: "CLUAUPP_CTX_LOCALPLAYER_SHARED",
                message: "`LocalPlayer` in Shared modules is unsafe if required from the server — prefer Client scripts",
                pattern: String.raw `\bLocalPlayer\b`,
                forbiddenIn: ["Shared"],
                severity: "warning",
                capability: "client_player",
            },
            {
                id: "CLUAUPP_CTX_DATASTORE",
                message: "`DataStoreService` is server-only — illegal in Client scripts",
                pattern: String.raw `\bDataStoreService\b|GetService\s*<\s*DataStoreService\s*>|GetService\s*\(\s*["']DataStoreService["']\s*\)`,
                forbiddenIn: ["Client"],
                severity: "error",
                capability: "data_stores",
            },
            {
                id: "CLUAUPP_CTX_MESSAGING",
                message: "`MessagingService` is server-only — illegal in Client scripts",
                pattern: String.raw `\bMessagingService\b|GetService\s*<\s*MessagingService\s*>`,
                forbiddenIn: ["Client"],
                severity: "error",
                capability: "messaging",
            },
            {
                id: "CLUAUPP_CTX_SERVERSTORAGE",
                message: "`ServerStorage` is server-only — illegal in Client scripts",
                pattern: String.raw `\bServerStorage\b|GetService\s*<\s*ServerStorage\s*>`,
                forbiddenIn: ["Client"],
                severity: "error",
                capability: "server_storage",
            },
            {
                id: "CLUAUPP_CTX_FIRE_SERVER",
                message: "`FireServer` is client→server — illegal in Server scripts",
                pattern: String.raw `\bFireServer\b`,
                forbiddenIn: ["Server"],
                severity: "error",
                capability: "fire_server",
            },
            {
                id: "CLUAUPP_CTX_FIRE_CLIENT",
                message: "`FireClient` / `FireAllClients` are server→client — illegal in Client scripts",
                pattern: String.raw `\bFireAllClients\b|\bFireClient\b`,
                forbiddenIn: ["Client"],
                severity: "error",
                capability: "fire_client",
            },
        ],
    };
}
function capabilitiesForContext(context) {
    switch (context) {
        case "Client":
            return ["client_player", "fire_server"];
        case "Server":
            return ["server_storage", "data_stores", "messaging", "fire_client"];
        case "Plugin":
            return ["client_player", "server_storage", "data_stores", "messaging", "fire_server", "fire_client"];
        case "Shared":
            return [];
        default:
            return [];
    }
}
