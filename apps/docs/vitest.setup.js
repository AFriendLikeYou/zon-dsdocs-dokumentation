// @see https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom kennt keinen ResizeObserver — Komponenten (SegmentedControl, Playground)
// nutzen ihn nur für Mess-Updates, im Test genügt ein No-op-Stub.
if (typeof globalThis.ResizeObserver === 'undefined') {
	globalThis.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
