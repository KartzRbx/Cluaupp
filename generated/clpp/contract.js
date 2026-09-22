"use strict";
/** Stable CL++ ↔ Cluaupp contract (CL++ 0.8.x). Cluaupp invokes the `clpp` binary. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLPP_INSTALL_HINT = exports.MIN_CLPP_VERSION = void 0;
exports.MIN_CLPP_VERSION = "0.8.0";
exports.CLPP_INSTALL_HINT = "Install CL++ 0.8.0+ (`clpp` from https://github.com/KartzRbx/CLPP/releases). Put it on PATH. Prefer `import { Name } from \"./x.clh\"` for language modules; angle `#include <clpp/…>` stays for host prelude. Override with CLPP or CLPP_PATH.";
