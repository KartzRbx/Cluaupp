<script setup lang="ts">
defineProps<{
	headings: { level: number; id: string; text: string }[];
	groups: { name: string; items: { id: string; title: string; href: string }[] }[];
	currentId: string;
	activeHeading: string;
}>();
</script>

<template>
	<aside class="docs-rail">
		<nav v-if="headings.length" class="page-toc" aria-label="On this page">
			<h2>On this page</h2>
			<ul>
				<li v-for="heading in headings" :key="heading.id" :class="'toc-h' + heading.level">
					<a :href="'#' + heading.id" :class="{ 'is-on': activeHeading === heading.id }">{{ heading.text }}</a>
				</li>
			</ul>
		</nav>
		<nav class="docs-nav" aria-label="Docs">
			<template v-for="group in groups" :key="group.name">
				<h2>{{ group.name }}</h2>
				<ul>
					<li v-for="item in group.items" :key="item.id">
						<a :href="item.href" :aria-current="item.id === currentId ? 'page' : undefined">{{ item.title }}</a>
					</li>
				</ul>
			</template>
		</nav>
	</aside>
</template>
