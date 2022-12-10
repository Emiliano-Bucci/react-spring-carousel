import { ReactNode } from 'react'
import { UseListenToCustomEvent } from '../modules/useEventsModule'
import { ItemWithThumb, ItemWithNoThumb, PrepareThumbsData } from '../types'

export type UseSpringReturnType = {
  carouselFragment: ReactNode
  thumbsFragment: ReactNode
  useListenToCustomEvent: UseListenToCustomEvent<'use-spring'>['useListenToCustomEvent']
  getIsFullscreen(): boolean
  enterFullscreen(ref?: HTMLElement): void
  exitFullscreen(): void
  slideToNextItem(animate?: boolean): void
  slideToPrevItem(animate?: boolean): void
  slideToItem(item: string | number, animate?: boolean): void
  getIsActiveItem(id: string): boolean
  getIsNextItem(id: string | number): boolean
  getIsPrevItem(id: string | number): boolean
}
export type UseSpringFreeScrollReturnType = {
  carouselFragment: ReactNode
  thumbsFragment: ReactNode
  useListenToCustomEvent: UseListenToCustomEvent<'use-spring'>['useListenToCustomEvent']
  getIsFullscreen(): boolean
  enterFullscreen(ref?: HTMLElement): void
  exitFullscreen(): void
  slideToNextItem(animate?: boolean): void
  slideToPrevItem(animate?: boolean): void
}

export type SlideType = 'fixed' | 'fluid'

export type SpringCarouselWithThumbs<T = 'use-spring'> = {
  withThumbs: true
  thumbsSlideAxis?: 'x' | 'y'
  items: ItemWithThumb<T>[]
  prepareThumbsData?: PrepareThumbsData<T>
}
export type SpringCarouselWithNoThumbs<T = 'use-spring'> = {
  withThumbs?: false | undefined
  thumbsSlideAxis?: never
  items: ItemWithNoThumb<T>[]
  prepareThumbsData?: never
}
export type SpringCarouselWithFixedItems = {
  slideType?: SlideType[0]
  itemsPerSlide?: number
  startEndGutter?: number
  initialActiveItem?: number
}
export type SpringCarouselWithNoFixedItems = {
  slideType?: SlideType[1]
  itemsPerSlide?: never
  startEndGutter?: never
  initialActiveItem?: never
}
export type SpringCarouselWithLoop = {
  withLoop: true
  initialStartingPosition: 'start' | 'center' | 'end'
}
export type SpringCarouselWithNoLoop = {
  withLoop?: false | undefined
  initialStartingPosition?: never
}
export type SpringCarouselFreeScroll = {
  freeScroll: true
  withLoop?: never
  slideType?: never
  enableFreeScrollDrag?: true
  initialActiveItem?: never
  itemsPerSlide?: never
  animateWhenActiveItemChange?: never
  slideWhenThresholdIsReached?: never
}
export type SpringCarouselNoFreeScroll = {
  freeScroll?: never | false | undefined
  withLoop?: boolean
  slideType?: SlideType
  enableFreeScrollDrag?: never
  initialActiveItem?: number
  itemsPerSlide?: number
  animateWhenActiveItemChange?: boolean
  slideWhenThresholdIsReached?: boolean
}

export type ControllerRef = {
  slideToNextItem: UseSpringReturnType['slideToNextItem']
  slideToPrevItem: UseSpringReturnType['slideToPrevItem']
  slideToItem?: UseSpringReturnType['slideToItem']
}

export type BaseProps = {
  init?: boolean
  gutter?: number
  carouselSlideAxis?: 'x' | 'y'
  draggingSlideTreshold?: number
  disableGestures?: boolean
  startEndGutter?: number
  getControllerRef?(ref: ControllerRef): void
}

type ScrollType<T> = T extends true
  ? SpringCarouselFreeScroll
  : SpringCarouselNoFreeScroll

export type UseSpringCarouselWithThumbs<T> = BaseProps &
  SpringCarouselWithThumbs &
  ScrollType<T> &
  (SpringCarouselWithFixedItems | SpringCarouselWithNoFixedItems) &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop)
export type UseSpringCarouselWithNoThumbs<T> = BaseProps &
  SpringCarouselWithNoThumbs &
  ScrollType<T> &
  (SpringCarouselWithFixedItems | SpringCarouselWithNoFixedItems) &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop)

export type UseSpringCarouselWithFixedItems<T> = BaseProps &
  SpringCarouselWithFixedItems &
  ScrollType<T> &
  (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs) &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop)

export type UseSpringCarouselWithNoFixedItems<T> = BaseProps &
  SpringCarouselWithNoFixedItems &
  ScrollType<T> &
  (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs) &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop)

export type UseSpringCarouselWithFreeScroll = BaseProps &
  SpringCarouselFreeScroll &
  (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs)

export type UseSpringCarouselComplete = BaseProps &
  (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs) &
  (SpringCarouselWithFixedItems | SpringCarouselWithNoFixedItems) &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop) &
  (SpringCarouselFreeScroll | SpringCarouselNoFreeScroll)
