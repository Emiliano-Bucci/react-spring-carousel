import { describe, expect, it } from "vitest";

import {
  computeAnimationTarget,
  getScrollSize,
  getTotalAvailableSpace,
  getTrackTransform,
} from "../animation";

const baseInput = {
  scrollAmount: 100,
  totalAvailable: 500,
  fromValueRaw: 0,
  actionType: "click" as const,
};

describe("computeAnimationTarget", () => {
  describe("next", () => {
    it("moves to next item without loop", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "next",
        currentActive: 0,
        itemsLength: 6,
        withLoop: false,
      });
      expect(out.newActive).toBe(1);
      expect(out.toValue).toBe(-100);
      expect(out.endReached).toBe(false);
      expect(out.startReached).toBe(false);
    });

    it("flags endReached when reaching last index without loop", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "next",
        currentActive: 4,
        itemsLength: 6,
        withLoop: false,
      });
      expect(out.newActive).toBe(5);
      expect(out.endReached).toBe(true);
      expect(out.toValue).toBe(-500);
    });

    it("flags endReached when toValue exceeds totalAvailable", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "next",
        currentActive: 5,
        itemsLength: 10,
        withLoop: false,
        scrollAmount: 100,
        totalAvailable: 400,
      });
      expect(out.endReached).toBe(true);
      expect(out.toValue).toBe(-400);
    });

    it("wraps around when withLoop and reaching itemsLength", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "next",
        currentActive: 5,
        itemsLength: 6,
        withLoop: true,
        fromValueRaw: -500,
      });
      expect(out.newActive).toBe(0);
      expect(out.toValue).toBe(0);
      expect(out.fromValue).toBe(-500 + 100 * 6);
      expect(out.endReached).toBe(false);
    });
  });

  describe("prev", () => {
    it("moves to previous item without loop", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "prev",
        currentActive: 2,
        itemsLength: 6,
        withLoop: false,
        fromValueRaw: -200,
      });
      expect(out.newActive).toBe(1);
      expect(out.toValue).toBe(-100);
      expect(out.startReached).toBe(false);
    });

    it("flags startReached when reaching index 0 without loop in normal flow", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "prev",
        currentActive: 1,
        itemsLength: 6,
        withLoop: false,
        fromValueRaw: -100,
      });
      expect(out.newActive).toBe(0);
      expect(out.startReached).toBe(true);
      expect(out.toValue).toBe(0);
    });

    it("wraps around with loop when going prev from 0", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "prev",
        currentActive: 0,
        itemsLength: 6,
        withLoop: true,
        fromValueRaw: 0,
      });
      expect(out.newActive).toBe(5);
      expect(out.toValue).toBe(-500);
      expect(out.fromValue).toBe(0 - 6 * 100);
    });
  });

  describe("toIndex override", () => {
    it("respects toIndex regardless of type", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "next",
        toIndex: 3,
        currentActive: 0,
        itemsLength: 6,
        withLoop: false,
      });
      expect(out.newActive).toBe(3);
      expect(out.toValue).toBe(-300);
    });
  });

  describe("resize", () => {
    it("computes toValue from current active without flags when actionType is resize", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "resize",
        actionType: "resize",
        toIndex: 4,
        currentActive: 4,
        itemsLength: 6,
        withLoop: false,
      });
      expect(out.newActive).toBe(4);
      expect(out.toValue).toBe(-400);
      expect(out.endReached).toBe(false);
      expect(out.startReached).toBe(false);
    });

    it("resize actionType overrides loop wrap toValue from next branch", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "next",
        actionType: "resize",
        toIndex: 3,
        currentActive: 0,
        itemsLength: 6,
        withLoop: true,
      });
      expect(out.newActive).toBe(3);
      expect(out.toValue).toBe(-300);
    });

    it("resize at active=0 without loop sets startReached", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "resize",
        actionType: "resize",
        toIndex: 0,
        currentActive: 0,
        itemsLength: 6,
        withLoop: false,
      });
      expect(out.startReached).toBe(true);
      expect(out.endReached).toBe(false);
      expect(Math.abs(out.toValue)).toBe(0);
    });

    it("resize at last item without loop sets endReached and clamps toValue", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "resize",
        actionType: "resize",
        toIndex: 5,
        currentActive: 5,
        itemsLength: 6,
        withLoop: false,
        scrollAmount: 100,
        totalAvailable: 400,
      });
      expect(out.endReached).toBe(true);
      expect(out.toValue).toBe(-400);
    });

    it("resize with loop never sets startReached/endReached", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "resize",
        actionType: "resize",
        toIndex: 5,
        currentActive: 5,
        itemsLength: 6,
        withLoop: true,
      });
      expect(out.startReached).toBe(false);
      expect(out.endReached).toBe(false);
    });
  });

  describe("logicalIndex / realTrackIndex", () => {
    it("computes correctly without loop", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "next",
        currentActive: 1,
        itemsLength: 6,
        withLoop: false,
      });
      expect(out.logicalIndex).toBe(2);
      expect(out.realTrackIndex).toBe(2);
    });

    it("computes correctly with loop", () => {
      const out = computeAnimationTarget({
        ...baseInput,
        type: "next",
        currentActive: 2,
        itemsLength: 6,
        withLoop: true,
      });
      expect(out.logicalIndex).toBe(3);
      expect(out.realTrackIndex).toBe(9);
    });
  });
});

describe("getTrackTransform", () => {
  it("formats x axis transform", () => {
    expect(getTrackTransform(-100, "x", "carousel-1")).toBe(
      "translate3d(calc(-100px + var(--carousel-1-offset-modifier)), 0px, 0px)",
    );
  });

  it("formats y axis transform", () => {
    expect(getTrackTransform(-200, "y", "reel")).toBe(
      "translate3d(0px, calc(-200px + var(--reel-offset-modifier)), 0px)",
    );
  });
});

describe("getScrollSize", () => {
  it("keeps the fraction of a fractional layout", () => {
    // Viewport 1080 / 2.8 = 385.703: two slides of 353.703 and a 16 gap.
    expect(
      getScrollSize({
        trackStart: -353.297,
        lastItemEnd: 370.109,
        viewportSize: 385.703,
      }),
    ).toBeCloseTo(723.406, 3);
  });

  it("is measured from the track start, wherever the track is translated", () => {
    expect(
      getScrollSize({
        trackStart: 0,
        lastItemEnd: 723.406,
        viewportSize: 385.703,
      }),
    ).toBeCloseTo(
      getScrollSize({
        trackStart: -353.297,
        lastItemEnd: 370.109,
        viewportSize: 385.703,
      }),
      6,
    );
  });

  it("is never smaller than the viewport", () => {
    expect(
      getScrollSize({ trackStart: 0, lastItemEnd: 200, viewportSize: 385.703 }),
    ).toBe(385.703);
  });

  it("lets the last of two slides reach the edge on a fractional viewport", () => {
    // Same layout: the end of the track is one step (353.703 + 16) away, and
    // the rounded scrollWidth (723) stopped 0.406px short of it.
    const viewportSize = 385.703;
    const step = 353.703 + 16;
    const scrollSize = getScrollSize({
      trackStart: 0,
      lastItemEnd: 353.703 * 2 + 16,
      viewportSize,
    });

    expect(
      getTotalAvailableSpace({
        scrollSize,
        viewportSize,
        startEndGutterTotal: 32,
        modifier: 0,
      }),
    ).toBeCloseTo(step, 6);
  });
});

describe("getTotalAvailableSpace", () => {
  it("is the scroll size minus the viewport without a start/end gutter", () => {
    expect(
      getTotalAvailableSpace({
        scrollSize: 1000,
        viewportSize: 400,
        startEndGutterTotal: 0,
        modifier: 0,
      }),
    ).toBe(600);
  });

  it("grows by the whole start/end gutter", () => {
    expect(
      getTotalAvailableSpace({
        scrollSize: 1000,
        viewportSize: 400,
        startEndGutterTotal: 32,
        modifier: 0,
      }),
    ).toBe(632);
  });

  it("subtracts the modifier", () => {
    expect(
      getTotalAvailableSpace({
        scrollSize: 1000,
        viewportSize: 400,
        startEndGutterTotal: 32,
        modifier: 100,
      }),
    ).toBe(532);
  });

  it("lets the last of two full-width slides reach the start edge", () => {
    // Viewport 1297, gutter 16, startEndGutter 16 (32 in total): each slide
    // is 1297 - 32 = 1265 wide and one step is 1265 + 16 = 1281.
    const viewportSize = 1297;
    const slideSize = 1265;
    const gutter = 16;
    const step = slideSize + gutter;

    expect(
      getTotalAvailableSpace({
        scrollSize: slideSize * 2 + gutter,
        viewportSize,
        startEndGutterTotal: 32,
        modifier: 0,
      }),
    ).toBe(step);
  });
});
