import { ReactNode } from 'react'
import { SpringConfig } from 'react-spring'
import { PrepareThumbsData, UseListenToCustomEvent } from './index'

export type UseSpringCarouselBaseProps = {
  disableGestures?: boolean
  draggingSlideTreshold?: number
  springConfig?: SpringConfig
  carouselSlideAxis?: 'x' | 'y'
  gutter?: number
  shouldResizeOnWindowResize?: boolean
}

/**
 * Types based on withThums prop
 */
export type ReactSpringCarouselItem = {
  id: string
  renderItem: ReactNode
  renderThumb?: never
}
export type ReactSpringCarouselItemWithThumbs = {
  id: string
  renderItem: ReactNode
  renderThumb: ReactNode
}

type UseSpringCarouselWithThumbs = {
  withThumbs: true
  thumbsSlideAxis?: 'x' | 'y'
  items: ReactSpringCarouselItemWithThumbs[]
  enableThumbsWrapperScroll?: boolean
  prepareThumbsData?: PrepareThumbsData
}
type UseSpringCarouselWithNoThumbs = {
  withThumbs?: false
  thumbsSlideAxis?: never
  items: ReactSpringCarouselItem[]
  enableThumbsWrapperScroll?: never
  prepareThumbsData?: never
}

export type ThumbsProps = UseSpringCarouselWithThumbs | UseSpringCarouselWithNoThumbs

/**
 * Types based on slideType
 */
type UseSpringCarouselFluidType = {
  slideType: 'fluid'
  slideAmount?: number
  itemsPerSlide?: never
  initialActiveItem?: never
  initialStartingPosition?: never
  freeScroll?: boolean
  enableFreeScrollDrag?: boolean | (() => boolean)
}

type UseSpringCarouselNumericSlideType = {
  slideType?: 'fixed'
  itemsPerSlide?: number
  initialActiveItem?: number
  slideAmount?: never
  initialStartingPosition?: 'start' | 'center' | 'end'
  freeScroll?: never
  enableFreeScrollDrag?: never
}

type SlideTypes = UseSpringCarouselFluidType | UseSpringCarouselNumericSlideType

/**
 * Types based on gestures activation
 */

type DisableGesturesProps = {
  disableGestures?: true
  touchAction?: never
}
type EnableGesturesProps = {
  disableGestures?: false
  touchAction?: string
}

type Gestures = DisableGesturesProps | EnableGesturesProps

/**
 * Types based on loop functionality
 */

type WithLoopProps = {
  withLoop: true
  initialStartingPosition?: 'start' | 'center' | 'end'
  startEndGutter?: number
}
type WithNoLoop = {
  withLoop?: false
  initialStartingPosition?: never
  startEndGutter?: never
}

type LoopProps = WithLoopProps | WithNoLoop
export type UseSpringCarouselProps = UseSpringCarouselBaseProps &
  ThumbsProps &
  SlideTypes &
  Gestures &
  LoopProps

export type UseSpringCarouselWithThumbsReturnProps = {
  carouselFragment: ReactNode
  thumbsFragment: ReactNode
  useListenToCustomEvent: UseListenToCustomEvent<'use-spring'>
  getIsFullscreen(): boolean
  getIsPrevItem(id: string): boolean
  getIsNextItem(id: string): boolean
  enterFullscreen(elementRef?: HTMLElement): void
  exitFullscreen(): void
  slideToNextItem(): void
  slideToPrevItem(): void
  getIsAnimating(): boolean
  getIsDragging(): boolean
}

export type UseSpringDafaultTypeReturnProps = {
  carouselFragment: ReactNode
  useListenToCustomEvent: UseListenToCustomEvent<'use-spring'>
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
  getIsDragging(): boolean
  getCurrentActiveItem(): {
    id: string
    index: number
  }
}
