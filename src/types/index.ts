import { ReactNode } from "react";

export type ItemWithThumb = {
  id: string;
  renderItem: ReactNode;
  renderThumb: ReactNode;
};
export type ItemWithNoThumb = {
  id: string;
  renderItem: ReactNode;
};
