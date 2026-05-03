import { FullGestureState } from "@use-gesture/react";
import { ReactNode } from "react";

export type SlideType = "fixed" | "freeScroll";
export type CarouselAxis = "x" | "y";

export type ResponsiveGutterItem = {
  /** This will create a min-width media query */
  breakpoint: number;
  gutter: number;
  startEndGutter?: number;
  /** Optional custom media query. If undefined, defaults to min-width */
  media?: string;
};

export type ResponsiveItemsPerSlideItem = {
  /** This will create a min-width media query */
  breakpoint: number;
  itemsPerSlide: number;
  /** Optional custom media query. If undefined, defaults to min-width */
  media?: string;
};

export type Item = {
  id: string;
  renderItem:
    | ReactNode
    | ((props: {
        index: number;
        isClonedItem: boolean;
        isActiveItem(id: string | number): boolean;
        isNextItem(): boolean;
        isPrevItem(): boolean;
        useListenToCustomEvent(
          eventHandler: SpringCarouselEventsEventHandler,
        ): void;
      }) => ReactNode);
};

type LayoutProps = {
  gutter?: ResponsiveGutterItem[];
  itemsPerSlide?: ResponsiveItemsPerSlideItem[];
  carouselAxis?: CarouselAxis;
  startingPosition?: "start" | "middle-start" | "center" | "middle-end" | "end";
};

type BaseProps = {
  init?: boolean;
  withLoop?: boolean;
  items: Item[];
  id: string;
  enableGestures?: boolean;
  slideWhenDragThresholdIsReached?: boolean;
  initialActiveItem?: number | string;
  slideType?: "item" | "container";
  /**
   * If set, only renders items within `renderWindow` slots from the active
   * one. Other slots become empty placeholders sized identically. Use to
   * reduce mount cost with many heavy items (e.g. video players).
   * Recommended minimum: 1 (active + immediate neighbors).
   */
  renderWindow?: number;
};

export type Props = BaseProps & LayoutProps;

export type SlideActionType = "drag" | "click" | "resize";
export type SlideDirection = "prev" | "next" | "resize";

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
    trackIndex?: number;
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
    trackIndex?: number;
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
    trackIndex?: number;
    startReached: boolean | undefined;
    endReached: boolean | undefined;
  };
};
type OnInit = {
  eventName: "onInit";
  index: number;
  trackIndex: number;
};

export type SpringCarouselEvents =
  | OnSlideStartChange
  | OnSlideChangeComplete
  | OnResize
  | OnDrag
  | OnInit;

export type SpringCarouselEventsEventHandler = (
  props: SpringCarouselEvents,
) => void;
