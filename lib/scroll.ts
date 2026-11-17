export type ScrollReach = "start" | "end" | "idle";

export type GetScrollTargetInput = {
  direction: "prev" | "next";
  activeItem: number;
  scrollAmount: number;
  availableSpace: number;
};

export type GetScrollTargetOutput = {
  activeItem: number;
  toValue: number;
  reach: ScrollReach | null;
};

export function getScrollTarget({
  direction,
  activeItem,
  scrollAmount,
  availableSpace,
}: GetScrollTargetInput): GetScrollTargetOutput {
  const nextActive = direction === "next" ? activeItem + 1 : activeItem - 1;
  const toValue = nextActive * scrollAmount;

  if (direction === "next" && toValue >= availableSpace) {
    return { activeItem: nextActive, toValue: availableSpace, reach: "end" };
  }
  if (direction === "prev" && toValue <= 0) {
    return { activeItem: 0, toValue: 0, reach: "start" };
  }

  return { activeItem: nextActive, toValue, reach: null };
}
