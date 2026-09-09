// Extends Vitest's `expect` with @testing-library/jest-dom matchers
// (toBeInTheDocument, toHaveTextContent, toBeVisible, ...) for component tests.
import "@testing-library/jest-dom/vitest";

// Recharts' ResponsiveContainer observes its parent; jsdom has no ResizeObserver.
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
