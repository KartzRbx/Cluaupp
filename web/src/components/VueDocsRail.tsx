import { createApp, h, reactive, type App as VueApp } from "vue";
import { useEffect, useRef } from "react";
import DocsRail from "../vue/DocsRail.vue";
import type { Heading } from "../lib/types";

type RailGroup = {
	name: string;
	items: { id: string; title: string; href: string }[];
};

type RailState = {
	headings: Heading[];
	groups: RailGroup[];
	currentId: string;
	activeHeading: string;
};

export function VueDocsRail(props: RailState) {
	const host = useRef<HTMLDivElement>(null);
	const app = useRef<VueApp | null>(null);
	const state = useRef<RailState | null>(null);

	useEffect(() => {
		if (!host.current) {
			return;
		}
		const next = reactive({ ...props }) as RailState;
		state.current = next;
		const vueApp = createApp({
			setup() {
				return () => h(DocsRail, next);
			},
		});
		vueApp.mount(host.current);
		app.current = vueApp;
		return () => {
			vueApp.unmount();
			app.current = null;
			state.current = null;
		};
		// Mount once; props stream in via the reactive object below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!state.current) {
			return;
		}
		state.current.headings = props.headings;
		state.current.groups = props.groups;
		state.current.currentId = props.currentId;
		state.current.activeHeading = props.activeHeading;
	}, [props.headings, props.groups, props.currentId, props.activeHeading]);

	return <div className="vue-rail" ref={host} />;
}
