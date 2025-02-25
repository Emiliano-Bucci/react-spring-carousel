import { ReactNode } from "react";

export type SlideType = "fixed" | "fluid" | "freeScroll";
export type CarouselAxis = "x" | "y";

type Item = {
  id: string;
  renderItem: ReactNode;
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
};

export type Props = BaseProps & LayoutProps;
