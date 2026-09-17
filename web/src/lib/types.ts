export type DocsPage = {
	id: string;
	file: string;
	title: string;
	group: string;
	inner: string;
};

export type Heading = {
	level: number;
	id: string;
	text: string;
};

export type PageHelpers = {
	codePair: (cpp: string, luau: string) => string;
	preCode: (source: string, lang?: string) => string;
	escapeHtml: (text: string) => string;
	mappingTable: () => string;
};

export type DocsGroup = {
	name: string;
	items: DocsPage[];
};
