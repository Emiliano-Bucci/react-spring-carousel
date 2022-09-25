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
};
type SpringCarouselWithNoFixedItems = {
  slideType?: "fluid";
  itemsPerSlide?: never;
};

type SpringCarouselWithLoop = {
  withLoop?: true;
};
type SpringCarouselWithNoLoop = {
  withLoop?: false;
};

export type SpringCarouselBaseProps = {
  init?: boolean;
  gutter?: number;
} & (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs) &
  (SpringCarouselWithFixedItems | SpringCarouselWithNoFixedItems) &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop);
