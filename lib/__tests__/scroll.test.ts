import { describe, expect, it } from "vitest";

import { getScrollTarget } from "../scroll";

describe("getScrollTarget", () => {
  it("moves one step forward", () => {
    expect(
      getScrollTarget({
        direction: "next",
        activeItem: 0,
        scrollAmount: 300,
        availableSpace: 1000,
      }),
    ).toEqual({ activeItem: 1, toValue: 300, reach: null });
  });

  it("clamps to the available space and flags the end", () => {
    expect(
      getScrollTarget({
        direction: "next",
        activeItem: 3,
        scrollAmount: 300,
        availableSpace: 1000,
      }),
    ).toEqual({ activeItem: 4, toValue: 1000, reach: "end" });
  });

  it("flags the end when the step lands exactly on it", () => {
    expect(
      getScrollTarget({
        direction: "next",
        activeItem: 1,
        scrollAmount: 500,
        availableSpace: 1000,
      }),
    ).toEqual({ activeItem: 2, toValue: 1000, reach: "end" });
  });

  it("moves one step back", () => {
    expect(
      getScrollTarget({
        direction: "prev",
        activeItem: 3,
        scrollAmount: 300,
        availableSpace: 1000,
      }),
    ).toEqual({ activeItem: 2, toValue: 600, reach: null });
  });

  it("stops at the start and flags it", () => {
    expect(
      getScrollTarget({
        direction: "prev",
        activeItem: 1,
        scrollAmount: 300,
        availableSpace: 1000,
      }),
    ).toEqual({ activeItem: 0, toValue: 0, reach: "start" });
  });
});
