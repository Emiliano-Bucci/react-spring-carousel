/// <reference types="react" />
import { UseTransitionCarouselContextProps, UseTransitionCarouselProps } from './types'
export declare function useTransitionCarouselContext(): UseTransitionCarouselContextProps
export default function useTransitionCarousel({
  items,
  withLoop,
  withThumbs,
  springConfig,
  thumbsSlideAxis,
  enableThumbsWrapperScroll,
  draggingSlideTreshold,
  prepareThumbsData,
  toPrevItemSpringProps,
  toNextItemSpringProps,
  disableGestures,
  CustomThumbsWrapperComponent,
  springAnimationProps,
}: UseTransitionCarouselProps): {
  useListenToCustomEvent: import('./types').UseListenToCustomEvent
  getIsFullscreen(): boolean
  getIsPrevItem(id: string): boolean
  getIsNextItem(id: string): boolean
  enterFullscreen(elementRef?: HTMLElement | undefined): void
  exitFullscreen(): void
  slideToNextItem(): void
  slideToPrevItem(): void
  getIsAnimating(): boolean
  slideToItem(item: string | number): void
  getIsActiveItem(id: string): boolean
  getCurrentActiveItem(): {
    id: string
    index: number
  }
  activeItem: number
  carouselFragment: JSX.Element
  thumbsFragment: JSX.Element
}
