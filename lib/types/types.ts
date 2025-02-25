import { ReactNode } from "react";

import { SpringCarouselEventsEventHandler } from "./events";

type Item = {
  id: string;
  renderThumb?: ReactNode;
  renderItem:
    | ReactNode
    | ((props: {
        useListenToCustomEvent(
          eventHandler: SpringCarouselEventsEventHandler,
        ): void;
      }) => ReactNode);
};

type SlideType = "fixed" | "fluid" | "freeScroll";

type FixedSlideTypeProps = {
  slideType?: "fixed";
  scrollAmount?: never;
  itemsPerSlide?: number;
  scrollAmountType?: "group" | "slide";
};
type FluidSlideTypeProps = {
  slideType?: "fluid";
  scrollAmount?: number;
  itemsPerSlide?: never;
  scrollAmountType?: never;
};
type FreeScrollSlideTypeProps = {
  slideType?: "freeScroll";
  scrollAmount?: number;
  itemsPerSlide?: never;
  scrollAmountType?: never;
  withLoop?: never;
};

export type Props = {
  init?: boolean | (() => Promise<boolean>);
  slideType?: SlideType;
  items: Item[];
  withLoop?: boolean;
  carouselAxis?: "x" | "y";
  enableGestures?: boolean;
  slideWhenDragThresholdIsReached?: boolean;
  initialActiveItem?: number;
  fadeIn?: boolean;
} & (FixedSlideTypeProps | FluidSlideTypeProps | FreeScrollSlideTypeProps);

export * from "./events";
