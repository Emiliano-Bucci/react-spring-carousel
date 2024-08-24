import { ReactNode } from "react";

type Item = {
  id: string;
  renderItem: ReactNode;
  renderThumb?: ReactNode;
};

type SlideType = "fixed" | "fluid";

export type Props = {
  init?: boolean;
  slideType?: SlideType;
  items: Item[];
};
