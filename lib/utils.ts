function isOutOfViewport(element: Element): {
  isOut: boolean;
  direction: "start" | "end" | null;
} {
  const { left, right, top, bottom } = element.getBoundingClientRect();
  const { innerWidth, innerHeight } = window;

  if (left < 0 || top < 0) {
    return {
      isOut: true,
      direction: "start",
    };
  }

  if (
    Math.floor(right) > Math.floor(innerWidth) ||
    Math.floor(bottom) > Math.floor(innerHeight)
  ) {
    return {
      isOut: true,
      direction: "end",
    };
  }

  return {
    isOut: false,
    direction: null,
  };
}
function pFloat(v: number) {
  return parseFloat(v.toFixed(2));
}
function logWarn(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message);
  }
}
function logError(message: string) {
  console.error(message);
}

export { isOutOfViewport, pFloat, logWarn, logError };
