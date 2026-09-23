<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 });
const paths: Record<string, string> = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z',
  clock: 'M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  wallet: 'M3 6h16v14H3z M3 6l13-3v3 M15 11h6v5h-6z',
  settings: 'M4 7h16 M4 17h16 M9 4v6 M16 14v6',
  arrow: 'M5 12h14 m-6-6 6 6-6 6',
  back: 'M19 12H5 m6-6-6 6 6 6',
  chevron: 'm9 5 7 7-7 7',
  lock: 'M6 10h12v11H6z M8 10V6a4 4 0 0 1 8 0v4',
  info: 'M12 11v6 M12 7h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  search: 'M16 16l5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  close: 'm6 6 12 12 M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  fish: 'M18 12 22 7v10z M18 12c-4-9-13-8-16 0 3 8 12 9 16 0 M7 10h.01',
  leaf: 'M4 20C2 6 10 3 21 3c0 13-6 18-14 14 M4 20 16 8',
  gem: 'M3 8 7 3h10l4 5-9 13z M3 8h18 M7 3l5 18 5-18',
  shield: 'm12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z m-4 10 3 3 5-6',
  user: 'M8 7a4 4 0 1 1 8 0 4 4 0 0 1-8 0 M4 21v-3a8 8 0 0 1 16 0v3',
  help: 'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4 M12 17h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0'
};
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.gem" /></svg></template>
