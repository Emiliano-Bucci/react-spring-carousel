import { ReactNode } from 'react'
import { ItemWithThumb, ItemWithNoThumb } from './'
import { UseListenToCustomEvent } from '../modules/useEventsModule'

export type UseSpringReturnType = {
  carouselFragment: ReactNode
  thumbsFragment: ReactNode
  useListenToCustomEvent: UseListenToCustomEvent['useListenToCustomEvent']
  getIsFullscreen(): boolean
  getIsPrevItem(id: string): boolean
  getIsNextItem(id: string): boolean
  enterFullscreen(ref?: HTMLElement): void
  exitFullscreen(): void
  slideToNextItem(): void
  slideToPrevItem(): void
  slideToItem(item: string | number): void
  getIsActiveItem(id: string): boolean
}

export type PrepareThumbsData = (
  items: Omit<ItemWithThumb, 'renderItem'>[],
) => Omit<ItemWithThumb, 'renderItem'>[]

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
  slideType?: 'fixed'
  itemsPerSlide?: number
  startEndGutter?: number
  initialStartingPosition?: 'start' | 'center' | 'end'
  initialActiveItem?: number
}
export type SpringCarouselWithNoFixedItems = {
  slideType?: 'fluid'
  startEndGutter?: never
  initialStartingPosition?: never
  initialActiveItem?: never
  itemsPerSlide?: never
}
export type SpringCarouselWithLoop = {
  withLoop?: true
}
export type SpringCarouselWithNoLoop = {
  withLoop?: false
}
export type SpringCarouselFreeScroll = {
  freeScroll?: true
  withLoop?: never
  slideType?: never
  enableFreeScrollDrag?: true
}
export type SpringCarouselNoFreeScroll = {
  freeScroll?: never
  withLoop?: boolean
  slideType?: 'fixed' | 'fluid'
  enableFreeScrollDrag?: never
}
export type BaseProps = {
  init?: boolean
  gutter?: number
  carouselSlideAxis?: 'x' | 'y'
  draggingSlideTreshold?: number
  slideWhenThresholdIsReached?: boolean
  disableGestures?: boolean
}

export type UseSpringCarouselWithThumbs = BaseProps &
  SpringCarouselWithThumbs &
  (SpringCarouselWithFixedItems | SpringCarouselWithNoFixedItems) &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop) &
  (SpringCarouselFreeScroll | SpringCarouselNoFreeScroll)
export type UseSpringCarouselWithNoThumbs = BaseProps &
  SpringCarouselWithNoThumbs &
  (SpringCarouselWithFixedItems | SpringCarouselWithNoFixedItems) &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop) &
  (SpringCarouselFreeScroll | SpringCarouselNoFreeScroll)

export type UseSpringCarouselWithFixedItems = BaseProps &
  (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs) &
  SpringCarouselWithFixedItems &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop) &
  (SpringCarouselFreeScroll | SpringCarouselNoFreeScroll)

export type UseSpringCarouselWithNoFixedItems = BaseProps &
  (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs) &
  SpringCarouselWithNoFixedItems &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop) &
  (SpringCarouselFreeScroll | SpringCarouselNoFreeScroll)

export type UseSpringCarouselComplete = BaseProps & {
  thumbsSlideAxis?: 'x' | 'y'
  itemsPerSlide?: number
  startEndGutter?: number
  initialStartingPosition?: 'start' | 'center' | 'end'
  prepareThumbsData?: PrepareThumbsData
  initialActiveItem?: number
} & (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs) &
  (SpringCarouselWithFixedItems | SpringCarouselWithNoFixedItems) &
  (SpringCarouselWithLoop | SpringCarouselWithNoLoop) &
  (SpringCarouselFreeScroll | SpringCarouselNoFreeScroll)
