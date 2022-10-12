import { ReactNode } from "react";

type ItemWithThumb = {
  id: string;
  renderItem: ReactNode;
  renderThumb: ReactNode;
};
type ItemWithNoThumb = {
  id: string;
  renderItem: ReactNode;
};

export type PrepareThumbsData = (
  items: Omit<ItemWithThumb, "renderItem">[]
) => Omit<ItemWithThumb, "renderItem">[];

export type SpringCarouselWithThumbs = {
  withThumbs: true;
  thumbsSlideAxis?: "x" | "y";
  items: ItemWithThumb[];
  prepareThumbsData?: PrepareThumbsData;
};
export type SpringCarouselWithNoThumbs = {
  withThumbs?: false | undefined;
  thumbsSlideAxis?: never;
  items: ItemWithNoThumb[];
  prepareThumbsData?: never;
};

export type SpringCarouselWithFixedItems = {
  slideType?: "fixed";
  itemsPerSlide?: number;
  startEndGutter?: number;
  initialStartingPosition?: "start" | "center" | "end";
  initialActiveItem?: number;
};

export type SpringCarouselWithNoFixedItems = {
  slideType?: "fluid";
  startEndGutter?: never;
  initialStartingPosition?: never;
  initialActiveItem?: never;
  itemsPerSlide?: never;
};

export type SpringCarouselWithLoop = {
  withLoop?: true;
};
export type SpringCarouselWithNoLoop = {
  withLoop?: false;
};
export type SpringCarouselFreeScroll = {
  freeScroll?: true;
  withLoop?: never;
  slideType?: never;
  enableFreeScrollDrag?: true;
};
export type SpringCarouselNoFreeScroll = {
  freeScroll?: never;
  withLoop?: boolean;
  slideType?: "fixed" | "fluid";
  enableFreeScrollDrag?: never;
};

export type BaseProps = {
  init?: boolean;
  gutter?: number;
  carouselSlideAxis?: "x" | "y";
  draggingSlideTreshold?: number;
  slideWhenThresholdIsReached?: boolean;
  disableGestures?: boolean;
};
