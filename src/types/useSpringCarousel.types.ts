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
  slideToNextItem(): void
  slideToPrevItem(): void
  slideToItem(item: string | number): void
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
  slideToNextItem(): void
  slideToPrevItem(): void
}

export type SlideType = 'fixed' | 'fluid'

export type SpringCarouselWithThumbs = {
  withThumbs: true
  thumbsSlideAxis?: 'x' | 'y'
  items: ItemWithThumb[]
  prepareThumbsData?: PrepareThumbsData
}
export type SpringCarouselWithNoThumbs = {
  withThumbs?: false | undefined
  thumbsSlideAxis?: never
  items: ItemWithNoThumb[]
  prepareThumbsData?: never
}
export type SpringCarouselWithFixedItems = {
  slideType?: SlideType[0]
  itemsPerSlide?: number
  startEndGutter?: number
  initialStartingPosition?: 'start' | 'center' | 'end'
  initialActiveItem?: number
  animateWhenActiveItemChange?: boolean
}
export type SpringCarouselWithNoFixedItems = {
  slideType?: SlideType[1]
  itemsPerSlide?: never
  startEndGutter?: never
  initialStartingPosition?: never
  initialActiveItem?: never
  animateWhenActiveItemChange?: never
}
export type SpringCarouselWithLoop = {
  withLoop?: true
}
export type SpringCarouselWithNoLoop = {
  withLoop?: false
}
export type SpringCarouselFreeScroll = {
  freeScroll: true
  withLoop?: never
  slideType?: never
  enableFreeScrollDrag?: true
  initialActiveItem?: never
  itemsPerSlide?: never
}
export type SpringCarouselNoFreeScroll = {
  freeScroll?: never | false | undefined
  withLoop?: boolean
  slideType?: SlideType
  enableFreeScrollDrag?: never
  initialActiveItem?: number
  itemsPerSlide?: number
}
export type BaseProps = {
  init?: boolean
  gutter?: number
  carouselSlideAxis?: 'x' | 'y'
  draggingSlideTreshold?: number
  slideWhenThresholdIsReached?: boolean
  disableGestures?: boolean
  startEndGutter?: number
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
