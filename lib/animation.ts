import { CarouselAxis, SlideActionType } from "./types";

export type ComputeAnimationTargetInput = {
  type: "prev" | "next" | "resize";
  actionType: SlideActionType;
  toIndex?: number;
  currentActive: number;
  itemsLength: number;
  withLoop: boolean;
  scrollAmount: number;
  totalAvailable: number;
  fromValueRaw: number;
};

export type ComputeAnimationTargetOutput = {
  newActive: number;
  fromValue: number;
  toValue: number;
  startReached: boolean;
  endReached: boolean;
  logicalIndex: number;
  realTrackIndex: number;
};

export function computeAnimationTarget(
  input: ComputeAnimationTargetInput,
): ComputeAnimationTargetOutput {
  const {
    type,
    actionType,
    toIndex,
    itemsLength,
    withLoop,
    scrollAmount,
    totalAvailable,
  } = input;

  let active = input.currentActive;
  let fromValue = input.fromValueRaw;

  let startReached = false;
  let endReached = false;

  if (type === "next") {
    active += 1;
  }
  if (type === "prev") {
    active = active === 0 ? itemsLength - 1 : active - 1;
  }
  if (toIndex !== undefined) {
    active = toIndex;
  }

  let toValue = 0;

  if (type === "next") {
    toValue = -(active * scrollAmount);

    if (withLoop && active === itemsLength) {
      active = 0;
      fromValue = fromValue + scrollAmount * itemsLength;
      toValue = 0;
    }

    if (
      !withLoop &&
      (Math.abs(toValue) >= totalAvailable || active === itemsLength - 1)
    ) {
      endReached = true;
      toValue = -totalAvailable;
    }
  }

  if (type === "prev") {
    toValue = -(active * scrollAmount);

    if (active === itemsLength - 1) {
      fromValue = fromValue - itemsLength * scrollAmount;
    }

    if (!withLoop && toValue >= 0) {
      startReached = true;
      toValue = 0;
    }
  }

  if (actionType === "resize") {
    toValue = -(active * scrollAmount);
  }

  const logicalIndex = withLoop ? active % itemsLength : active;
  const realTrackIndex = withLoop
    ? itemsLength + (active % itemsLength)
    : active;

  return {
    newActive: active,
    fromValue,
    toValue,
    startReached,
    endReached,
    logicalIndex,
    realTrackIndex,
  };
}

export function getTrackTransform(
  value: number,
  axis: CarouselAxis,
  id: string,
): string {
  return axis === "x"
    ? `translate3d(calc(${value}px + var(--${id}-offset-modifier)), 0px, 0px)`
    : `translate3d(0px, calc(${value}px + var(--${id}-offset-modifier)), 0px)`;
}
