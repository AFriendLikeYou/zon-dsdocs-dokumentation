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
