import Parser from "tree-sitter";
import { createRequire } from "node:module";
import path from "node:path";
import { projectRoot } from "../package-info.js";

const nodeRequire = createRequire(path.join(projectRoot, "package.json"));

export type CppParser = Parser;

export function createCppParserSync(): CppParser | null {
	try {
		const Cpp = nodeRequire("tree-sitter-cpp");
		const parser = new Parser();
		parser.setLanguage(Cpp);
		parser.parse("int main() { return 0; }");
		return parser;
	} catch {
		return null;
	}
}

export function parseCpp(source: string, parser = createCppParserSync()): Parser.Tree | null {
	if (!parser) {
		return null;
	}
	return parser.parse(source);
}
