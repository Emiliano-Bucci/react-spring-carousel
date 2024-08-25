import { ReactNode } from "react";

type Item = {
  id: string;
  renderItem: ReactNode;
  renderThumb?: ReactNode;
};

type SlideType = "fixed" | "fluid";

type FixedSlideTypeProps = {
  slideType?: "fixed";
  scrollAmount?: never;
};
type FluidSlideTypeProps = {
  slideType?: "fluid";
  scrollAmount?: number;
};

export type Props = {
  init?: boolean;
  slideType?: SlideType;
  items: Item[];
  withLoop?: boolean;
  enableGestures?: boolean;
  carouselAxis?: "x" | "y";
  slideWhenDragThresholdIsReached?: boolean;
} & (FixedSlideTypeProps | FluidSlideTypeProps);

export * from "./events";
