import { Props } from "./types";
export function helloAnything(props: Props): string {
  return `Hello ${props.value}!`;
}
