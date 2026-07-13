/**
 * Zentrale Icon-Bibliothek der Doku-APP-UI (NICHT das dokumentierte ZEIT-DS!).
 * Alle UI-Icons an einem Ort, nach Verwendungsbereich gruppiert, leicht tauschbar.
 * Siehe README.md für Konventionen und wie man ein Icon ergänzt.
 *
 *   import { SunIcon, GithubIcon } from '$lib/icons';
 *   import { Icon } from '$lib/icons/cms';   // CMS-Editor-Dispatcher (Task 21)
 */

// specsheet/ — Doku-Ansichten (Playground, Specsheet, CodeBlock …)
export { default as SunIcon } from './specsheet/SunIcon.svelte';
export { default as MoonIcon } from './specsheet/MoonIcon.svelte';
export { default as CopyIcon } from './specsheet/CopyIcon.svelte';
export { default as CheckIcon } from './specsheet/CheckIcon.svelte';
export { default as DownloadIcon } from './specsheet/DownloadIcon.svelte';
export { default as ResetIcon } from './specsheet/ResetIcon.svelte';
export { default as ChevronDownIcon } from './specsheet/ChevronDownIcon.svelte';

// nav/ — App-Chrome (Navbar, Sidebar, Footer, Suche …)
export { default as GithubIcon } from './nav/GithubIcon.svelte';
export { default as SearchIcon } from './nav/SearchIcon.svelte';
export { default as CloseIcon } from './nav/CloseIcon.svelte';
export { default as ChevronRightIcon } from './nav/ChevronRightIcon.svelte';
export { default as LoginIcon } from './nav/LoginIcon.svelte';
export { default as ArrowLeftIcon } from './nav/ArrowLeftIcon.svelte';
export { default as ArrowRightIcon } from './nav/ArrowRightIcon.svelte';
export { default as LockOpenIcon } from './nav/LockOpenIcon.svelte';
export { default as LockClosedIcon } from './nav/LockClosedIcon.svelte';
export { default as ThemeSystemIcon } from './nav/ThemeSystemIcon.svelte';
export { default as ThemeLightIcon } from './nav/ThemeLightIcon.svelte';
export { default as ThemeDarkIcon } from './nav/ThemeDarkIcon.svelte';

// cms/ — Editor-Icons via Namens-Dispatcher (eigenes Barrel, s. ./cms).
export { Icon, CMS_ICONS } from './cms';
