import path from "node:path";
import type Parser from "tree-sitter";
import type { CollectorContext, TranspilerState } from "../types.js";
import type { RojoMapper } from "../utils/rojo-mapper.js";
import { siblingHeader } from "../preprocess.js";
import {
	translateAlias,
	translateConstant,
	translateCppType,
	translateGetService,
	translateStruct,
} from "../emitter/translators.js";

type SyntaxNode = Parser.SyntaxNode;

function emptyState(strict = false): TranspilerState {
	return {
		robloxServices: new Set<string>(),
		moduleRequires: new Map<string, string>(),
		customTypes: [],
		constants: [],
		functions: [],
		headerLines: [],
		strict,
	};
}

export class ASTCollector {
	private state: TranspilerState;

	constructor(
		private mapper: RojoMapper,
		private context: CollectorContext = { fileName: "input.cpp" },
	) {
		this.state = emptyState(context.strict === true);
	}

	public collect(rootNode: SyntaxNode): TranspilerState {
		this.visit(rootNode, false);
		return this.state;
	}

	private visit(node: SyntaxNode, inFunction: boolean): void {
		if (node.type === "preproc_include") {
			this.collectInclude(node);
		} else if (node.type === "call_expression") {
			this.collectGetService(node);
		} else if (!inFunction && node.type === "function_definition") {
			this.visitChildren(node, true);
			return;
		} else if (!inFunction && node.type === "declaration") {
			this.collectDeclaration(node);
		} else if (!inFunction && (node.type === "type_definition" || node.type === "alias_declaration")) {
			this.collectAlias(node);
		} else if (!inFunction && (node.type === "struct_specifier" || node.type === "class_specifier")) {
			this.collectStruct(node);
		} else if (!inFunction && node.type === "preproc_call" && /pragma\s+strict/.test(node.text)) {
			this.state.strict = true;
		}

		this.visitChildren(node, inFunction);
	}

	private visitChildren(node: SyntaxNode, inFunction: boolean): void {
		for (let i = 0; i < node.childCount; i += 1) {
			const child = node.child(i);
			if (child) {
				this.visit(child, inFunction);
			}
		}
	}

	private includeTarget(raw: string): string | null {
		const from = this.context.sourcePath;
		if (!from) {
			return null;
		}
		const cleaned = raw.replace(/[<>'"]/g, "").trim();
		if (!cleaned || raw.includes("<")) {
			return null;
		}
		return path.resolve(path.dirname(from), cleaned);
	}

	private isOwnHeader(raw: string): boolean {
		const from = this.context.sourcePath;
		if (!from) {
			return false;
		}
		const target = this.includeTarget(raw);
		if (!target) {
			return false;
		}
		if (path.resolve(from) === target) {
			return true;
		}
		const header = siblingHeader(from);
		return Boolean(header && path.resolve(header) === target);
	}

	private collectInclude(node: SyntaxNode): void {
		const pathNode = node.childForFieldName("path") || node.namedChildren[0] || node.child(1);
		if (!pathNode) {
			return;
		}
		if (this.isOwnHeader(pathNode.text)) {
			return;
		}
		const resolved = this.mapper.resolveIncludeToRequire(pathNode.text, this.context.sourcePath);
		if (resolved) {
			this.state.moduleRequires.set(resolved.alias, resolved.path);
		}
	}

	private collectGetService(node: SyntaxNode): void {
		const service = translateGetService(node);
		if (service) {
			this.state.robloxServices.add(service);
		}
	}

	private collectDeclaration(node: SyntaxNode): void {
		const text = node.text.trimStart();
		if (!(text.startsWith("const") || text.startsWith("constexpr"))) {
			return;
		}
		const translated = translateConstant(node);
		if (translated) {
			this.state.constants.push(translated);
		}
	}

	private collectAlias(node: SyntaxNode): void {
		const translated = translateAlias(node, translateCppType);
		if (translated) {
			this.state.customTypes.push(translated);
		}
	}

	private collectStruct(node: SyntaxNode): void {
		const translated = translateStruct(node, translateCppType);
		if (translated) {
			this.state.customTypes.push(translated);
		}
	}
}

export { emptyState };
