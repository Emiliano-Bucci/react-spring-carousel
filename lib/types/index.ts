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
  carouselAxis?: CarouselAxis;
};

type BaseProps = {
  init?: boolean;
  withLoop?: boolean;
  items: Item[];
  id: string;
  slideType?: SlideType;
};

export type Props = BaseProps & LayoutProps;
