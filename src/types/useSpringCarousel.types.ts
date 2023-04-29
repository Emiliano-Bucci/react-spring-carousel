import { ReactNode } from 'react'

import { ItemWithNoThumb, ItemWithThumb, PrepareThumbsData } from '../types'
import { UseListenToCustomEvent } from './useEventsModule.types'

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

const NSlideType = ['fixed', 'fluid'] as const
export type SlideType = (typeof NSlideType)[number]
export type SlideAxis = 'x' | 'y'
export type StartingPosition = 'start' | 'center' | 'end'

export type BaseProps = {
  init?: boolean
  gutter?: number
  carouselSlideAxis?: 'x' | 'y'
  draggingSlideTreshold?: number
  disableGestures?: boolean
  startEndGutter?: number
  animateWhenActiveItemChange?: boolean
  slideWhenThresholdIsReached?: boolean
}

type Fixed = {
  slideType: (typeof NSlideType)[0]
  itemsPerSlide?: number
  slideGroupOfItems?: boolean
  startEndGutter?: number
  initialActiveItem?: number
  /** @deprecated Must be used with slideType: fluid and freeScroll: true */
  enableFreeScrollDrag?: never
  /** @deprecated Musts be used with slideType: fluid */
  freeScroll?: never
  /** @deprecated Musts be used with slideType: fluid */
  slideAmount?: never
}

type WithThumbs = {
  withThumbs?: true | undefined
  items: ItemWithThumb<'use-spring'>[]
  thumbsSlideAxis?: SlideAxis
  prepareThumbsData?: PrepareThumbsData<'use-spring'>
}
type WithNoThumbs = {
  withThumbs?: false | undefined
  items: ItemWithNoThumb<'use-spring'>[]
  /** @deprecated Must be used with withThumbs: true */
  thumbsSlideAxis?: never | undefined
  /** @deprecated Must be used with withThumbs: true */
  prepareThumbsData?: never | undefined
}

type Thumbs = WithThumbs | WithNoThumbs
type Common = BaseProps & Thumbs

export type FixedWithLoop = Common &
  Fixed & {
    withLoop: true
    initialStartingPosition?: StartingPosition
  }
export type FixedWithNoLoop = Common &
  Fixed & {
    withLoop?: false
    /** @deprecated Must be used with withLoop: true */
    initialStartingPosition?: never
  }
export type FluidWithFreeScroll = Common & {
  slideType?: (typeof NSlideType)[1]
  freeScroll: true
  slideAmount?: number
  enableFreeScrollDrag?: boolean
  /** @derecated Must be used with slideType: fixed */
  slideGroupOfItems?: never
  /** @deprecated Must be used with slideType: fixed */
  itemsPerSlide?: number
  /** @deprecated Can't be used with freeScroll: true */
  withLoop?: never
  /** @deprecated Can't be used with slideType: fluid */
  initialActiveItem?: never
  /** @deprecated Should be used with slideType: fixed and withLoop: true */
  initialStartingPosition?: never
}
export type FluidWithNoFreeScroll = Common & {
  slideType?: (typeof NSlideType)[1]
  withLoop?: boolean
  freeScroll?: false
  enableFreeScrollDrag?: never
  /** @derecated Must be used with slideType: fixed */
  slideGroupOfItems?: never
  /** @deprecated Must be used with slideType: fixed */
  itemsPerSlide?: number
  /** @deprecated Can't be used with slideType: fluid */
  initialActiveItem?: never
  /** @deprecated Should be used with slideType: fixed and withLoop: true */
  initialStartingPosition?: never
  slideAmount?: never
}

export type Complete = FixedWithLoop | FixedWithNoLoop | FluidWithFreeScroll | FluidWithNoFreeScroll

export type Total = Common & {
  slideType?: SlideType
  withLoop?: boolean
  freeScroll?: boolean
  slideAmount?: number
  itemsPerSlide?: number
  slideGroupOfItems?: boolean
  startEndGutter?: number
  initialActiveItem?: number
  initialStartingPosition?: StartingPosition
  enableFreeScrollDrag?: boolean
  thumbsSlideAxis?: SlideAxis
}
