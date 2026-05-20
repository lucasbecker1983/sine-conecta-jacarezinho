import "@testing-library/jest-dom/vitest";

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: () => ({
    clearRect: () => undefined,
    fillRect: () => undefined,
    beginPath: () => undefined,
    arc: () => undefined,
    fill: () => undefined,
    fillText: () => undefined,
    strokeText: () => undefined,
    stroke: () => undefined,
    closePath: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    createRadialGradient: () => ({ addColorStop: () => undefined }),
    measureText: () => ({ width: 10 }),
    save: () => undefined,
    restore: () => undefined,
    setTransform: () => undefined,
    resetTransform: () => undefined,
    scale: () => undefined,
    translate: () => undefined,
    rotate: () => undefined,
  }),
});
