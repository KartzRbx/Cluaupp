"use strict";

const assert = require("node:assert");
const path = require("node:path");
const smoke = require(path.join(__dirname, "..", "..", "generated", "api", "studio-smoke.js"));

const result = smoke.runStudioSmoke();
assert.ok(result.skipped || result.ok, result.output);
console.log("studio smoke:", result.skipped ? "skipped" : result.ok ? "ok" : "fail");
