export type SlideMode = "drag" | "click";
export type SlideDirection = "prev" | "next";

export type OnSlideStartChange = {
  eventName: "onSlideStartChange";
  slideActionType: SlideDirection;
  slideMode: SlideMode;
  nextItem: {
    index: number;
    id: string;
    startReached: boolean;
    endReached: boolean;
  };
};

export type SpringCarouselEvents = OnSlideStartChange;
export type SpringCarouselEventsEventHandler = (
  props: SpringCarouselEvents
) => void;
