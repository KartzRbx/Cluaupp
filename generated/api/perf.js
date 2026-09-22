"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeCall = timeCall;
exports.formatPerf = formatPerf;
function timeCall(label, fn) {
    const started = Date.now();
    const value = fn();
    return { value, sample: { label, ms: Date.now() - started } };
}
function formatPerf(samples) {
    return samples.map((s) => `${s.label}=${s.ms}ms`).join(" ");
}
