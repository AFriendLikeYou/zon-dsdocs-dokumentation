import { setCookie } from '$lib/cookie';

/**
 * Sidebar-Zustand — zwei getrennte Achsen:
 *
 *  1. Mobile Off-Canvas-Drawer (`isSidebarOpen`) — transient, mountet/entfernt sich.
 *  2. Desktop-Einklappen (`isDesktopCollapsed`) — persistiert (Cookie, no-flash via
 *     SSR wie beim Theme). Steuert, ob die Sidebar Teil des Layouts ist oder auf 0
 *     zusammenklappt; der Inhalt nimmt die freiwerdende Breite ein.
 *
 * Der Cookie wird serverseitig in `+layout.server.ts` gelesen und beim Mount über
 * `initDesktopCollapsed()` in den Store gespiegelt — so gibt es keinen Flash.
 */

const COOKIE_NAME = 'sidebar-collapsed';

// --- Mobile Drawer -------------------------------------------------------
let isSidebarOpen = $state(false);

export const toggleSidebar = () => {
	isSidebarOpen = !isSidebarOpen;
};

export const closeSidebar = () => {
	isSidebarOpen = false;
};

export const openSidebar = () => {
	isSidebarOpen = true;
};

export const sidebarState = () => {
	return isSidebarOpen;
};

// --- Desktop Collapse (persistiert) -------------------------------------
let isDesktopCollapsed = $state(false);

/** Einmalig beim Mount aus dem serverseitig gelesenen Cookie initialisieren. */
export const initDesktopCollapsed = (collapsed: boolean) => {
	isDesktopCollapsed = collapsed;
};

export const toggleDesktopCollapsed = () => {
	isDesktopCollapsed = !isDesktopCollapsed;
	setCookie(COOKIE_NAME, String(isDesktopCollapsed));
};

export const desktopCollapsed = () => {
	return isDesktopCollapsed;
};
