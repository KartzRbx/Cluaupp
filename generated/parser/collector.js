"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTCollector = void 0;
exports.emptyState = emptyState;
const translators_js_1 = require("../emitter/translators.js");
function emptyState(strict = false) {
    return {
        robloxServices: new Set(),
        moduleRequires: new Map(),
        customTypes: [],
        constants: [],
        functions: [],
        headerLines: [],
        strict,
    };
}
class ASTCollector {
    mapper;
    state;
    constructor(mapper, context = { fileName: "input.cpp" }) {
        this.mapper = mapper;
        this.state = emptyState(context.strict === true);
    }
    collect(rootNode) {
        this.visit(rootNode, false);
        return this.state;
    }
    visit(node, inFunction) {
        if (node.type === "preproc_include") {
            this.collectInclude(node);
        }
        else if (node.type === "call_expression") {
            this.collectGetService(node);
        }
        else if (!inFunction && node.type === "function_definition") {
            this.visitChildren(node, true);
            return;
        }
        else if (!inFunction && node.type === "declaration") {
            this.collectDeclaration(node);
        }
        else if (!inFunction && (node.type === "type_definition" || node.type === "alias_declaration")) {
            this.collectAlias(node);
        }
        else if (!inFunction && (node.type === "struct_specifier" || node.type === "class_specifier")) {
            this.collectStruct(node);
        }
        else if (!inFunction && node.type === "preproc_call" && /pragma\s+strict/.test(node.text)) {
            this.state.strict = true;
        }
        this.visitChildren(node, inFunction);
    }
    visitChildren(node, inFunction) {
        for (let i = 0; i < node.childCount; i += 1) {
            const child = node.child(i);
            if (child) {
                this.visit(child, inFunction);
            }
        }
    }
    collectInclude(node) {
        const pathNode = node.childForFieldName("path") || node.namedChildren[0] || node.child(1);
        if (!pathNode) {
            return;
        }
        const resolved = this.mapper.resolveIncludeToRequire(pathNode.text);
        if (resolved) {
            this.state.moduleRequires.set(resolved.alias, resolved.path);
        }
    }
    collectGetService(node) {
        const service = (0, translators_js_1.translateGetService)(node);
        if (service) {
            this.state.robloxServices.add(service);
        }
    }
    collectDeclaration(node) {
        const text = node.text.trimStart();
        if (!(text.startsWith("const") || text.startsWith("constexpr"))) {
            return;
        }
        const translated = (0, translators_js_1.translateConstant)(node);
        if (translated) {
            this.state.constants.push(translated);
        }
    }
    collectAlias(node) {
        const translated = (0, translators_js_1.translateAlias)(node, translators_js_1.translateCppType);
        if (translated) {
            this.state.customTypes.push(translated);
        }
    }
    collectStruct(node) {
        const translated = (0, translators_js_1.translateStruct)(node, translators_js_1.translateCppType);
        if (translated) {
            this.state.customTypes.push(translated);
        }
    }
}
exports.ASTCollector = ASTCollector;
