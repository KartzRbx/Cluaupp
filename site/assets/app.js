(() => {
	const root = document.documentElement;
	const THEME_KEY = "cluaupp-theme";
	const THEMES = ["dark", "tokyo", "dracula", "nord", "carbon", "light"];

	function themeFromStore() {
		try {
			const stored = localStorage.getItem(THEME_KEY);
			if (stored && THEMES.includes(stored)) {
				return stored;
			}
		} catch {
			/* ignore */
		}
		return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
	}

	function applyTheme(theme) {
		const next = THEMES.includes(theme) ? theme : "dark";
		root.setAttribute("data-theme", next);
		try {
			localStorage.setItem(THEME_KEY, next);
		} catch {
			/* ignore */
		}
		document.querySelectorAll("[data-theme-select]").forEach((el) => {
			el.value = next;
		});
	}

	if (!root.getAttribute("data-theme")) {
		applyTheme(themeFromStore());
	}

	document.querySelectorAll("[data-theme-select]").forEach((el) => {
		el.value = root.getAttribute("data-theme") || themeFromStore();
		el.addEventListener("change", () => applyTheme(el.value));
	});

	function movePill(container, target, pill, vertical) {
		if (!container || !target || !pill) {
			return;
		}
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

	function bindPills(containerSelector, itemSelector, pillSelector, vertical) {
		document.querySelectorAll(containerSelector).forEach((container) => {
			const pill = container.querySelector(pillSelector);
			const items = [...container.querySelectorAll(itemSelector)];
			if (!pill || items.length === 0) {
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
			window.addEventListener("resize", () => {
				const selected =
					items.find((item) => item.getAttribute("aria-current") === "page" || item.getAttribute("aria-selected") === "true") ||
					current;
				movePill(container, selected, pill, vertical);
			});
		});
	}

	bindPills(".nav-links", "a", ".nav-pill", false);

	document.querySelectorAll("[data-tabs]").forEach((rootTabs) => {
		const tablist = rootTabs.querySelector(":scope > .pair-tabs, :scope > .learn-tabs") || rootTabs;
		const tabs = [...tablist.querySelectorAll(':scope > [role="tab"]')];
		const panels = [
			...rootTabs.querySelectorAll(':scope > [role="tabpanel"]'),
			...rootTabs.querySelectorAll(':scope > div > [role="tabpanel"]'),
		];
		const ink = tablist.querySelector(".tab-ink, .learn-ink");
		const vertical = rootTabs.hasAttribute("data-tabs-vertical");

		function show(id, focus) {
			tabs.forEach((tab) => {
				const on = tab.getAttribute("aria-controls") === id;
				tab.setAttribute("aria-selected", on ? "true" : "false");
				tab.tabIndex = on ? 0 : -1;
				if (on && ink) {
					movePill(tablist, tab, ink, vertical);
				}
				if (on && focus) {
					tab.focus();
				}
			});
			panels.forEach((panel) => {
				panel.hidden = panel.id !== id;
			});
		}

		tabs.forEach((tab, index) => {
			tab.addEventListener("click", () => {
				const id = tab.getAttribute("aria-controls");
				show(id);
				if (rootTabs.classList.contains("learn") && id) {
					try {
						history.replaceState(null, "", `#${id}`);
					} catch {
						location.hash = id;
					}
				}
			});
			tab.addEventListener("keydown", (event) => {
				if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "ArrowDown" && event.key !== "ArrowUp") {
					return;
				}
				event.preventDefault();
				const dir = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
				const next = tabs[(index + dir + tabs.length) % tabs.length];
				show(next.getAttribute("aria-controls"), true);
			});
		});

		const selected = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
		if (selected) {
			show(selected.getAttribute("aria-controls"));
		}

		if (rootTabs.classList.contains("learn")) {
			const fromHash = location.hash.replace(/^#/, "");
			if (fromHash && document.getElementById(fromHash) && tabs.some((tab) => tab.getAttribute("aria-controls") === fromHash)) {
				show(fromHash);
			}
			rootTabs.querySelectorAll("[data-learn-next]").forEach((btn) => {
				btn.addEventListener("click", () => {
					const id = btn.getAttribute("data-learn-next");
					show(id);
					try {
						history.replaceState(null, "", `#${id}`);
					} catch {
						location.hash = id;
					}
					const panel = document.getElementById(id);
					if (panel) {
						panel.scrollIntoView({ behavior: "smooth", block: "start" });
					}
				});
			});
		}
	});

	document.querySelectorAll(".card").forEach((card) => {
		card.addEventListener("pointermove", (event) => {
			const r = card.getBoundingClientRect();
			const x = event.clientX - r.left;
			const y = event.clientY - r.top;
			const rx = ((y / r.height) - 0.5) * -8;
			const ry = ((x / r.width) - 0.5) * 10;
			card.style.setProperty("--rx", `${rx}deg`);
			card.style.setProperty("--ry", `${ry}deg`);
			card.style.setProperty("--mx", `${x}px`);
			card.style.setProperty("--my", `${y}px`);
		});
		card.addEventListener("pointerleave", () => {
			card.style.setProperty("--rx", "0deg");
			card.style.setProperty("--ry", "0deg");
		});
	});

	document.querySelectorAll("[data-filter-input]").forEach((input) => {
		const list = document.getElementById(input.getAttribute("data-filter-input"));
		if (!list) {
			return;
		}
		input.addEventListener("input", () => {
			const q = input.value.toLowerCase();
			for (const item of list.children) {
				item.style.display = item.textContent.toLowerCase().includes(q) ? "" : "none";
			}
		});
	});

	if ("IntersectionObserver" in window) {
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add("reveal");
						io.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.12 },
		);
		document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
	}

	function escapeHtml(text) {
		return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	document.querySelectorAll(".explorer").forEach((explorer) => {
		explorer.addEventListener("click", (event) => {
			const row = event.target.closest(".ex-row");
			if (!row || !explorer.contains(row)) {
				return;
			}
			explorer.querySelectorAll(".ex-row.is-on").forEach((item) => item.classList.remove("is-on"));
			row.classList.add("is-on");
		});
	});

	const askPanel = document.querySelector("[data-ask-panel]");
	const askLog = document.querySelector("[data-ask-log]");
	const askForm = document.querySelector("[data-ask-form]");
	const askToggle = document.querySelector("[data-ask-toggle]");
	const history = [];

	if (askToggle && askPanel) {
		askToggle.addEventListener("click", () => {
			askPanel.hidden = !askPanel.hidden;
			if (!askPanel.hidden) {
				const input = askPanel.querySelector("input");
				if (input) {
					input.focus();
				}
			}
		});
	}

	if (askForm && askLog) {
		askForm.addEventListener("submit", async (event) => {
			event.preventDefault();
			const input = askForm.querySelector("input");
			const text = (input && input.value.trim()) || "";
			if (!text) {
				return;
			}
			input.value = "";
			history.push({ role: "user", content: text });
			askLog.insertAdjacentHTML("beforeend", `<p class="ask-user">${escapeHtml(text)}</p>`);
			askLog.scrollTop = askLog.scrollHeight;
			try {
				const res = await fetch("/api/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ messages: history }),
				});
				const data = await res.json();
				const reply = data.text || data.error || "No reply";
				history.push({ role: "assistant", content: reply });
				askLog.insertAdjacentHTML("beforeend", `<p>${escapeHtml(reply)}</p>`);
			} catch {
				askLog.insertAdjacentHTML("beforeend", "<p>Ask needs a Vercel deploy with AI Gateway.</p>");
			}
			askLog.scrollTop = askLog.scrollHeight;
		});
	}
})();
