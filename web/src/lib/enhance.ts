import type { Heading } from "./types";

function movePill(container: Element, target: Element, pill: HTMLElement, vertical: boolean) {
	const c = container.getBoundingClientRect();
	const t = target.getBoundingClientRect();
	if (vertical) {
		pill.style.height = `${t.height}px`;
		pill.style.width = `${t.width}px`;
		pill.style.transform = `translate(${t.left - c.left}px, ${t.top - c.top}px)`;
	} else if (pill.classList.contains("tab-ink")) {
		pill.style.width = `${t.width}px`;
		pill.style.transform = `translateX(${t.left - c.left}px)`;
	} else {
		pill.style.width = `${t.width}px`;
		pill.style.height = `${t.height}px`;
		pill.style.transform = `translateX(${t.left - c.left}px)`;
	}
}

function bindPills(root: ParentNode, containerSelector: string, itemSelector: string, pillSelector: string, vertical: boolean) {
	root.querySelectorAll(containerSelector).forEach((container) => {
		const pill = container.querySelector(pillSelector);
		const items = [...container.querySelectorAll(itemSelector)];
		if (!(pill instanceof HTMLElement) || items.length === 0) {
			return;
		}
		const current =
			items.find((item) => item.getAttribute("aria-current") === "page" || item.getAttribute("aria-selected") === "true") ||
			items[0];
		movePill(container, current, pill, vertical);
		items.forEach((item) => {
			item.addEventListener("mouseenter", () => movePill(container, item, pill, vertical));
			item.addEventListener("focus", () => movePill(container, item, pill, vertical));
		});
		container.addEventListener("mouseleave", () => {
			const selected =
				items.find((item) => item.getAttribute("aria-current") === "page" || item.getAttribute("aria-selected") === "true") ||
				current;
			movePill(container, selected, pill, vertical);
		});
	});
}

export function bindPageEnhancements(root: HTMLElement, headings: Heading[], onActive: (id: string) => void) {
	bindPills(root, "[data-tabs]", '[role="tab"]', ".tab-ink", false);

	root.querySelectorAll("[data-tabs]").forEach((rootTabs) => {
		const tablist = rootTabs.querySelector(":scope > .pair-tabs") || rootTabs;
		const tabs = [...tablist.querySelectorAll(':scope > [role="tab"]')];
		const panels = [...rootTabs.querySelectorAll(':scope > [role="tabpanel"]')];
		const ink = tablist.querySelector(".tab-ink");

		function show(id: string | null) {
			if (!id) {
				return;
			}
			tabs.forEach((tab) => {
				const on = tab.getAttribute("aria-controls") === id;
				tab.setAttribute("aria-selected", on ? "true" : "false");
				(tab as HTMLElement).tabIndex = on ? 0 : -1;
				if (on && ink instanceof HTMLElement) {
					movePill(tablist, tab, ink, false);
				}
			});
			panels.forEach((panel) => {
				(panel as HTMLElement).hidden = panel.id !== id;
			});
		}

		tabs.forEach((tab) => {
			tab.addEventListener("click", () => show(tab.getAttribute("aria-controls")));
		});
		const selected = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
		if (selected) {
			show(selected.getAttribute("aria-controls"));
		}
	});

	root.querySelectorAll(".card").forEach((card) => {
		card.addEventListener("pointermove", (event) => {
			if (!(event instanceof PointerEvent) || !(card instanceof HTMLElement)) {
				return;
			}
			const r = card.getBoundingClientRect();
			const x = event.clientX - r.left;
			const y = event.clientY - r.top;
			card.style.setProperty("--rx", `${((y / r.height) - 0.5) * -8}deg`);
			card.style.setProperty("--ry", `${((x / r.width) - 0.5) * 10}deg`);
		});
		card.addEventListener("pointerleave", () => {
			if (card instanceof HTMLElement) {
				card.style.setProperty("--rx", "0deg");
				card.style.setProperty("--ry", "0deg");
			}
		});
	});

	root.querySelectorAll(".explorer").forEach((explorer) => {
		explorer.addEventListener("click", (event) => {
			const row = event.target instanceof Element ? event.target.closest(".ex-row") : null;
			if (!row || !explorer.contains(row)) {
				return;
			}
			explorer.querySelectorAll(".ex-row.is-on").forEach((item) => item.classList.remove("is-on"));
			row.classList.add("is-on");
		});
	});

	const headingEls = headings
		.map((item) => document.getElementById(item.id))
		.filter((el): el is HTMLElement => Boolean(el));

	const syncToc = () => {
		let current = headingEls[0];
		for (const heading of headingEls) {
			if (heading.getBoundingClientRect().top <= 100) {
				current = heading;
			}
		}
		if (current) {
			onActive(current.id);
		}
	};
	window.addEventListener("scroll", syncToc, { passive: true });
	syncToc();

	return () => {
		window.removeEventListener("scroll", syncToc);
	};
}

export function bindHeaderPills() {
	bindPills(document, ".nav-links", "a", ".nav-pill", false);
}
