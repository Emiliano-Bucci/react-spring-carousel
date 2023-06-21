import { SpringConfig, TransitionFrom, TransitionTo } from '@react-spring/web'
import { ReactNode } from 'react'

import { ItemWithNoThumb, ItemWithThumb } from '../types'
import { UseListenToCustomEvent } from './useEventsModule.types'

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

export type UseTransitionCarouselProps = BaseProps & {
  items: ItemWithNoThumb<'use-transition'>[] | ItemWithThumb<'use-transition'>[]
}

export type UseTransitionCarouselReturnProps = {
  useListenToCustomEvent: UseListenToCustomEvent<'use-transition'>['useListenToCustomEvent']
  carouselFragment: ReactNode
  thumbsFragment: ReactNode
  slideToPrevItem(): void
  slideToNextItem(): void
}
