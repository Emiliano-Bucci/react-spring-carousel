import { ReactNode } from "react";

import { SpringCarouselEventsEventHandler } from "./events";

export type SlideType = "fixed" | "fluid" | "freeScroll";
export type CarouselAxis = "x" | "y";

type Item = {
  id: string;
  renderItem:
    | ReactNode
    | ((props: {
        index: number;
        useListenToCustomEvent(
          eventHandler: SpringCarouselEventsEventHandler,
        ): void;
      }) => ReactNode);
};

type LayoutProps = {
  itemsPerSlide?: number;
  gutter?: number;
  startEndGutter?: number;
  carouselAxis?: CarouselAxis;
  startingPosition?: "start" | "middle-start" | "center" | "middle-end" | "end";
};

type BaseProps = {
  init?: boolean;
  withLoop?: boolean;
  items: Item[];
  id: string;
  slideType?: SlideType;
  enableGestures?: boolean;
  slideWhenDragThresholdIsReached?: boolean;
  onInit?(): void;
};

export type Props = BaseProps & LayoutProps;
