import { SpringConfig, TransitionFrom, TransitionTo } from '@react-spring/web'
import {
  ItemWithNoThumb,
  ItemWithThumb,
  SpringCarouselWithNoThumbs,
  SpringCarouselWithThumbs,
} from '../types'
import { ReactNode } from 'react'
import { UseListenToCustomEvent } from '../modules'

type Item = ItemWithThumb<'use-transition'> | ItemWithNoThumb<'use-transition'>

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
  draggingSlideTreshold?: number
  thumbsSlideAxis?: 'x' | 'y'
  activeItem?: number
}

export type UseTransitionCarouselProps = BaseProps &
  (SpringCarouselWithThumbs<'use-transition'> | SpringCarouselWithNoThumbs<'use-transition'>)

export type UseTransitionCarouselReturnProps = {
  useListenToCustomEvent: UseListenToCustomEvent<'use-transition'>['useListenToCustomEvent']
  carouselFragment: ReactNode
  thumbsFragment: ReactNode
  slideToPrevItem(): void
  slideToNextItem(): void
}
