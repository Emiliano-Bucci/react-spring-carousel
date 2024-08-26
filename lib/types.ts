import { ReactNode } from "react";

type Item = {
  id: string;
  renderItem: ReactNode;
  renderThumb?: ReactNode;
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
  init?: boolean;
  slideType?: SlideType;
  items: Item[];
  withLoop?: boolean;
  enableGestures?: boolean;
  carouselAxis?: "x" | "y";
  slideWhenDragThresholdIsReached?: boolean;
  gutter?: number;
  startEndGutter?: number;
} & (FixedSlideTypeProps | FluidSlideTypeProps | FreeScrollSlideTypeProps);

export * from "./events";
