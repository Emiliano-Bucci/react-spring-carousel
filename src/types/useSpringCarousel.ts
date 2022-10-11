import { ReactNode } from "react";

type ItemWithThumb = {
  id: string;
  renderItem: ReactNode;
  renderThumn: ReactNode;
};
type ItemWithNoThumb = {
  id: string;
  renderItem: ReactNode;
  renderThumb?: never;
};

type SpringCarouselWithThumbs = {
  withThumbs?: true;
  items: ItemWithThumb[];
};
type SpringCarouselWithNoThumbs = {
  withThumbs?: false;
  items: ItemWithNoThumb[];
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
};
type SpringCarouselNoFreeScroll = {
  freeScroll?: never | false;
  withLoop?: boolean;
  slideType?: "fixed" | "fluid";
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
  (SpringCarouselFreeScroll | SpringCarouselNoFreeScroll);
