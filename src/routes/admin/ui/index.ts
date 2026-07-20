// Gemeinsame Bausteine der CMS-Übersichts-/Landing-Seiten (/admin, /admin/brand,
// /admin/media). Co-located unter der admin-Route, weil ausschließlich dort genutzt
// (kein Teil der dokumentierten ZEIT-DS-Bibliothek). Import: `from '../ui'` bzw.
// `from './ui'` je Ebene.
export { default as AdminPageHeader } from './AdminPageHeader.svelte';
export { default as AdminRow } from './AdminRow.svelte';
export { default as AdminBadge } from './AdminBadge.svelte';
export { default as Pill } from './Pill.svelte';
export { default as PopoverSheet } from './PopoverSheet.svelte';
