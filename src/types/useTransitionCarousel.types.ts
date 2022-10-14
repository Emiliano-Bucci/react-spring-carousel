import { SpringConfig, TransitionFrom, TransitionTo } from '@react-spring/web'
import { SpringCarouselWithThumbs, SpringCarouselWithNoThumbs } from './internals'
import { ItemWithNoThumb, ItemWithThumb } from '../types'
import { ReactNode } from 'react'
import { UseListenToCustomEvent } from 'src/modules'

type Item = ItemWithThumb | ItemWithNoThumb

export type SpringAnimationProps = {
  initial: TransitionFrom<Item>
  from: TransitionFrom<Item>
  enter: TransitionTo<Item>
  leave: TransitionTo<Item>
}

type BaseProps = {
  init?: boolean
  disableGestures?: boolean
  springConfig?: Omit<SpringConfig, 'velocity'>
  toPrevItemSpringProps?: SpringAnimationProps
  toNextItemSpringProps?: SpringAnimationProps
  exitBeforeEnter?: boolean
  trail?: number
  withLoop?: boolean
  activeItem?: number
  draggingSlideTreshold?: number
  thumbsSlideAxis?: 'x' | 'y'
}

export type UseTransitionCarouselProps = BaseProps &
  (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs)

export type UseTransitionCarouselReturnProps = {
  useListenToCustomEvent: UseListenToCustomEvent<'use-transition'>['useListenToCustomEvent']
  carouselFragment: ReactNode
  thumbsFragment: ReactNode
  slideToPrevItem(): void
  slideToNextItem(): void
}
