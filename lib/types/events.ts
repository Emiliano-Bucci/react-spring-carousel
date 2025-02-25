import { FullGestureState } from "@use-gesture/react";

export type SlideActionType = "drag" | "click" | "resize";
export type SlideDirection = "prev" | "next";

export type OnDrag = Omit<FullGestureState<"drag">, "event"> & {
  eventName: "onDrag";
  slideActionType: SlideActionType;
};
type OnSlideStartChange = {
  eventName: "onSlideStartChange";
  slideDirection: SlideDirection;
  sliceActionType: SlideActionType;
  nextItem: {
    index: number;
    id: string;
    startReached: boolean | undefined;
    endReached: boolean | undefined;
  };
};
type OnSlideChangeComplete = {
  eventName: "onSlideChangeComplete";
  slideDirection: SlideDirection;
  sliceActionType: SlideActionType;
  currentItem: {
    index: number;
    id: string;
    startReached: boolean | undefined;
    endReached: boolean | undefined;
  };
};
type OnResize = {
  eventName: "onResize";
  slideDirection: SlideDirection;
  sliceActionType: SlideActionType;
  currentItem: {
    index: number;
    id: string;
    startReached: boolean | undefined;
    endReached: boolean | undefined;
  };
};

export type SpringCarouselEvents =
  | OnSlideStartChange
  | OnSlideChangeComplete
  | OnResize
  | OnDrag;

export type SpringCarouselEventsEventHandler = (
  props: SpringCarouselEvents,
) => void;
