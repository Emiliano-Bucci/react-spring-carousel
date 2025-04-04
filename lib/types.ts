import { FullGestureState } from "@use-gesture/react";
import { ReactNode } from "react";

export type SlideType = "fixed" | "freeScroll";
export type CarouselAxis = "x" | "y";

export type ResponsiveGutterItem = {
  /** This will create a min-width media query */
  breakpoint: number;
  gutter: number;
  startEndGutter?: number;
};

export type ResponsiveItemsPerSlideItem = {
  /** This will create a min-width media query */
  breakpoint: number;
  itemsPerSlide: number;
};

export type Item = {
  id: string;
  renderItem:
    | ReactNode
    | ((props: {
        index: number;
        isClonedItem: boolean;
        isActiveItem(id: string | number): boolean;
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
  initialActiveItem?: number;
  onInit?(): void;
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
