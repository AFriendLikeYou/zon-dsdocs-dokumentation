/**
 * Zentrale Icon-Bibliothek der Doku-APP-UI (NICHT das dokumentierte ZEIT-DS!).
 * Icons liegen flach in $lib/icons, exportiert über dieses eine Barrel.
 * Einzige Ausnahme: cms/ (eigener Namens-Dispatcher, nur von admin/ konsumiert).
 * Siehe README.md für Konventionen und wie man ein Icon ergänzt.
 *
 *   import { SunIcon, GithubIcon, ChevronIcon } from '$lib/icons';
 *   import { Icon } from '$lib/icons/cms';   // CMS-Editor-Dispatcher (Task 21)
 */

export { default as SunIcon } from './SunIcon.svelte';
export { default as MoonIcon } from './MoonIcon.svelte';
export { default as CopyIcon } from './CopyIcon.svelte';
export { default as CheckIcon } from './CheckIcon.svelte';
export { default as DownloadIcon } from './DownloadIcon.svelte';
export { default as ResetIcon } from './ResetIcon.svelte';
export { default as ChevronIcon } from './ChevronIcon.svelte';
export { default as GithubIcon } from './GithubIcon.svelte';
export { default as SearchIcon } from './SearchIcon.svelte';
export { default as CloseIcon } from './CloseIcon.svelte';
export { default as LoginIcon } from './LoginIcon.svelte';
export { default as ArrowLeftIcon } from './ArrowLeftIcon.svelte';
export { default as ArrowRightIcon } from './ArrowRightIcon.svelte';
export { default as LockOpenIcon } from './LockOpenIcon.svelte';
export { default as LockClosedIcon } from './LockClosedIcon.svelte';
export { default as ThemeSystemIcon } from './ThemeSystemIcon.svelte';
// Product-CMS / Spec-Editor: Herkunft (Import/Redaktion), Drift, Legende.
export { default as ImportIcon } from './ImportIcon.svelte';
export { default as PencilIcon } from './PencilIcon.svelte';
export { default as AlertTriangleIcon } from './AlertTriangleIcon.svelte';
export { default as InfoIcon } from './InfoIcon.svelte';

// cms/ — Editor-Icons via Namens-Dispatcher (eigenes Barrel, s. ./cms).
export { Icon, CMS_ICONS } from './cms';
