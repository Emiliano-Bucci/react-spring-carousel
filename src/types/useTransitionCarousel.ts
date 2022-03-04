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
    withLoop?: boolean
    exitBeforeEnter?: boolean
    trail?: number
  }

export type UseTransitionCarouselContextProps = {
  useListenToCustomEvent: UseListenToCustomEvent<'use-transition'>
  activeItem: number
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
}
