let isLoggedIn = $state(false);

export const isLoggedInState = () => {
	return isLoggedIn;
};

export const setLoggedIn = (value: boolean) => {
	isLoggedIn = value;
};
