"use strict";
/** Stable CL++ ↔ Cluaupp contract. Cluaupp invokes the `clpp` binary. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLPP_INSTALL_HINT = exports.MIN_CLPP_VERSION = void 0;
exports.MIN_CLPP_VERSION = "0.2.6";
exports.CLPP_INSTALL_HINT = "Install CL++ 0.2.6+ and put `clpp` on PATH: https://github.com/KartzRbx/CLPP/releases (`clpp-setup.exe`, then `clpp install`). A stale cargo 0.1.0 on PATH will break for-in / GetService. Override with CLPP_PATH.";
