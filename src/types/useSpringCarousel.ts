import { ReactNode } from "react";

type ItemWithThumb = {
  id: string;
  renderItem: ReactNode;
  renderThumb: ReactNode;
};
type ItemWithNoThumb = {
  id: string;
  renderItem: ReactNode;
  renderThumb?: never;
};

export type PrepareThumbsData = (
  items: Omit<ItemWithThumb, "renderItem">[]
) => Omit<ItemWithThumb, "renderItem">[];

export type SpringCarouselWithThumbs = {
  withThumbs?: true;
  thumbsSlideAxis?: "x" | "y";
  items: ItemWithThumb[];
  prepareThumbsData?: PrepareThumbsData;
};
type SpringCarouselWithNoThumbs = {
  withThumbs?: false;
  thumbsSlideAxis?: never;
  items: ItemWithNoThumb[];
  prepareThumbsData?: never;
};

type SpringCarouselWithFixedItems = {
  slideType?: "fixed";
  itemsPerSlide?: number;
  startEndGutter?: number;
};
type SpringCarouselWithNoFixedItems = {
  slideType?: "fluid";
  itemsPerSlide?: never;
  startEndGutter?: never;
};

type SpringCarouselStartingPosition = {
  slideType?: "fixed";
  initialStartingPosition?: "start" | "center" | "end";
  initialActiveItem?: number;
};
type SpringCarouselWithoutStartingPosition = {
  slideType?: "fluid";
  initialStartingPosition?: never;
  initialActiveItem?: never;
};

type SpringCarouselWithLoop = {
  withLoop?: true;
};
type SpringCarouselWithNoLoop = {
  withLoop?: false;
};
type SpringCarouselFreeScroll = {
  freeScroll?: true;
  withLoop?: never;
  slideType?: never;
  enableFreeScrollDrag?: true;
};
type SpringCarouselNoFreeScroll = {
  freeScroll?: never;
  withLoop?: boolean;
  slideType?: "fixed" | "fluid";
  enableFreeScrollDrag?: never;
};

export type SpringCarouselBaseProps = {
  init?: boolean;
  gutter?: number;
  carouselSlideAxis?: "x" | "y";
  draggingSlideTreshold?: number;
  slideWhenThresholdIsReached?: boolean;
  disableGestures?: boolean;
} & (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs) &
  (SpringCarouselWithFixedItems | SpringCarouselWithNoFixedItems) &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop) &
  (SpringCarouselFreeScroll | SpringCarouselNoFreeScroll) &
  (SpringCarouselStartingPosition | SpringCarouselWithoutStartingPosition);
