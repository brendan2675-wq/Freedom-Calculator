import "@testing-library/jest-dom";

let uuidCounter = 0;

Object.defineProperty(globalThis.crypto, "randomUUID", {
  writable: true,
  value: () => `test-uuid-${++uuidCounter}`,
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
