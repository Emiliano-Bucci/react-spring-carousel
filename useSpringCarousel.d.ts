/// <reference types="react" />
import {
  UseSpringCarouselProps,
  UseSpringDafaultTypeReturnProps,
  UseSpringFluidTypeReturnProps,
} from './types'
declare type ReturnHook<T> = T extends 'fluid'
  ? UseSpringFluidTypeReturnProps
  : UseSpringDafaultTypeReturnProps
export default function useSpringCarousel<T>({
  itemsPerSlide,
  items,
  withLoop,
  draggingSlideTreshold,
  springConfig,
  shouldResizeOnWindowResize,
  withThumbs,
  enableThumbsWrapperScroll,
  carouselSlideAxis,
  thumbsSlideAxis,
  prepareThumbsData,
  initialActiveItem,
  initialStartingPosition,
  disableGestures,
  gutter,
  startEndGutter,
  touchAction,
  slideAmount,
  freeScroll,
  CustomThumbsWrapperComponent,
}: UseSpringCarouselProps): ReturnHook<T> & {
  carouselFragment: JSX.Element
  thumbsFragment: JSX.Element
}
export declare function useSpringCarouselContext<T>(): ReturnHook<T>
export {}
