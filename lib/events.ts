export type SlideMode = "drag" | "click";
export type SlideDirection = "prev" | "next";

type OnSlideStartChange = {
  eventName: "onSlideStartChange";
  slideActionType: SlideDirection;
  slideMode: SlideMode;
  nextItem: {
    index: number;
    id: string;
    startReached: boolean | undefined;
    endReached: boolean | undefined;
  };
};
type OnSlideChangeComplete = {
  eventName: "onSlideChangeComplete";
  slideActionType: SlideDirection;
  slideMode: SlideMode;
  currentItem: {
    index: number;
    id: string;
    startReached: boolean | undefined;
    endReached: boolean | undefined;
  };
};

export type SpringCarouselEvents = OnSlideStartChange | OnSlideChangeComplete;
export type SpringCarouselEventsEventHandler = (
  props: SpringCarouselEvents
) => void;
