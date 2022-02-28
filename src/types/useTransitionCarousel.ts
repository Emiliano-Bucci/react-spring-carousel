import { TransitionFrom, TransitionTo } from 'react-spring'
import { UseListenToCustomEvent } from './index'
import { UseSpringCarouselBaseProps, ThumbsProps } from './useSpringCarousel'

type ReactSpringCarouselItem = {
  id: string
}

export type SpringAnimationProps = {
  initial: TransitionFrom<ReactSpringCarouselItem>
  from: TransitionFrom<ReactSpringCarouselItem>
  enter: TransitionTo<ReactSpringCarouselItem>
  leave: TransitionTo<ReactSpringCarouselItem>
}

export type UseTransitionCarouselProps = UseSpringCarouselBaseProps &
  ThumbsProps & {
    toPrevItemSpringProps?: SpringAnimationProps
    toNextItemSpringProps?: SpringAnimationProps
    springAnimationProps?: SpringAnimationProps
  }

export type UseTransitionCarouselContextProps = {
  useListenToCustomEvent: UseListenToCustomEvent
  getIsFullscreen(): boolean
  getIsPrevItem(id: string): boolean
  getIsNextItem(id: string): boolean
  enterFullscreen(elementRef?: HTMLElement): void
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
}
