import { ReactNode } from "react";

type SlideType = "fixed" | "fluid" | "freeScroll";

type Item = {
  id: string;
  renderItem: ReactNode;
};

export type Props = {
  init?: boolean;
  withLoop?: boolean;
  items: Item[];
  id: string;
  slideType?: SlideType;
};
