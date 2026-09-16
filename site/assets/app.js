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
			tab.addEventListener("click", () => show(tab.getAttribute("aria-controls")));
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

	function highlightSource(source, lang) {
		const keywords =
			lang === "luau"
				? "and|break|do|else|elseif|end|false|for|function|if|in|local|nil|not|or|repeat|return|then|true|until|while|const|export|type"
				: "alignas|alignof|and|auto|bool|break|case|catch|char|class|const|continue|default|delete|do|double|else|enum|explicit|export|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|not|nullptr|operator|or|private|protected|public|register|return|short|signed|sizeof|static|struct|switch|template|this|throw|true|try|typedef|typename|union|unsigned|using|virtual|void|volatile|while|string|include|pragma|once";
		const types =
			"Player|Players|Folder|Part|Instance|IntValue|StringValue|BoolValue|NumberValue|Vector3|Vector2|CFrame|UDim|UDim2|Color3|BrickColor|Ray|RaycastParams|TweenService|UserInputService|DataStoreService|Humanoid|ScreenGui|Frame|Janitor|Workspace|DataModel";
		const parts = [];
		const pattern =
			lang === "luau"
				? /(\-\-[^\n]*)|("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g
				: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g;
		let last = 0;
		let match;
		while ((match = pattern.exec(source))) {
			if (match.index > last) {
				parts.push({ type: "code", text: source.slice(last, match.index) });
			}
			parts.push({ type: match[1] ? "comment" : "string", text: match[0] });
			last = match.index + match[0].length;
		}
		if (last < source.length) {
			parts.push({ type: "code", text: source.slice(last) });
		}
		const kw = new RegExp(`\\b(${keywords})\\b`, "g");
		const ty = new RegExp(`\\b(${types})\\b`, "g");
		const fn = /\b([A-Za-z_][A-Za-z0-9_]*)\s*(?=\()/g;
		const num = /\b\d+(?:\.\d+)?\b/g;
		return parts
			.map((part) => {
				if (part.type === "comment") {
					return `<span class="tok-comment">${escapeHtml(part.text)}</span>`;
				}
				if (part.type === "string") {
					return `<span class="tok-string">${escapeHtml(part.text)}</span>`;
				}
				let html = escapeHtml(part.text);
				html = html.replace(ty, '<span class="tok-type">$1</span>');
				html = html.replace(kw, '<span class="tok-keyword">$1</span>');
				html = html.replace(fn, '<span class="tok-fn">$1</span>');
				html = html.replace(num, '<span class="tok-number">$&</span>');
				return html;
			})
			.join("");
	}

	function langForPre(pre) {
		const id = (pre.parentElement && pre.parentElement.id) || "";
		if (id.endsWith("-luau") || /--!strict|\blocal\b|\bthen\b|\bend\b/.test(pre.textContent)) {
			return "luau";
		}
		return "cpp";
	}

	document.querySelectorAll("pre").forEach((pre) => {
		if (pre.dataset.highlighted) {
			return;
		}
		pre.dataset.highlighted = "1";
		pre.innerHTML = highlightSource(pre.textContent, langForPre(pre));
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
