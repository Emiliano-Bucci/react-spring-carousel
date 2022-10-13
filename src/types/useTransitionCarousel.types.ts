import { SpringConfig, TransitionFrom, TransitionTo } from '@react-spring/web'
import { SpringCarouselWithThumbs, SpringCarouselWithNoThumbs } from './internals'
import { ItemWithNoThumb, ItemWithThumb } from '../types'

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
  initialActiveItem?: number
  springConfig?: Omit<SpringConfig, 'velocity'>
  animationProps?: SpringAnimationProps
  exitBeforeEnter?: boolean
  trail?: number
}

export type UseTransitionCarouselProps = BaseProps &
  (SpringCarouselWithThumbs | SpringCarouselWithNoThumbs)
