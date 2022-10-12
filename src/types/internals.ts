import { ReactNode } from "react";
import { UseListenToCustomEvent } from "../modules/useEventsModule";
import {
  SpringCarouselWithThumbs,
  SpringCarouselWithNoThumbs,
  SpringCarouselWithFixedItems,
  SpringCarouselWithNoFixedItems,
  SpringCarouselWithLoop,
  SpringCarouselWithNoLoop,
  SpringCarouselFreeScroll,
  SpringCarouselNoFreeScroll,
  BaseProps,
  PrepareThumbsData,
} from "./useSpringCarousel";

export type UseSpringReturnType = {
  carouselFragment: ReactNode;
  thumbsFragment: ReactNode;
  useListenToCustomEvent: UseListenToCustomEvent["useListenToCustomEvent"];
  getIsFullscreen(): boolean;
  getIsPrevItem(id: string): boolean;
  getIsNextItem(id: string): boolean;
  enterFullscreen(ref?: HTMLElement): void;
  exitFullscreen(): void;
  slideToNextItem(): void;
  slideToPrevItem(): void;
  slideToItem(item: string | number): void;
  getIsActiveItem(id: string): boolean;
};

export type UseSpringCarouselWithThumbs = BaseProps &
  SpringCarouselWithThumbs &
  (SpringCarouselWithFixedItems | SpringCarouselWithNoFixedItems) &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop) &
  (SpringCarouselFreeScroll | SpringCarouselNoFreeScroll);
export type UseSpringCarouselWithNoThumbs = BaseProps &
  SpringCarouselWithNoThumbs &
  (SpringCarouselWithFixedItems | SpringCarouselWithNoFixedItems) &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop) &
  (SpringCarouselFreeScroll | SpringCarouselNoFreeScroll);

export type UseSpringCarouselWithFixedItems = BaseProps &
  (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs) &
  SpringCarouselWithFixedItems &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop) &
  (SpringCarouselFreeScroll | SpringCarouselNoFreeScroll);

export type UseSpringCarouselWithNoFixedItems = BaseProps &
  (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs) &
  SpringCarouselWithNoFixedItems &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop) &
  (SpringCarouselFreeScroll | SpringCarouselNoFreeScroll);

export type UseSpringCarouselComplete = BaseProps & {
  thumbsSlideAxis?: "x" | "y";
  itemsPerSlide?: number;
  startEndGutter?: number;
  initialStartingPosition?: "start" | "center" | "end";
  prepareThumbsData?: PrepareThumbsData;
  initialActiveItem?: number;
} & (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs) &
  (SpringCarouselWithFixedItems | SpringCarouselWithNoFixedItems) &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop) &
  (SpringCarouselFreeScroll | SpringCarouselNoFreeScroll);
