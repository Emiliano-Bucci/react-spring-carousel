import { ReactNode } from 'react'
import { UseListenToCustomEvent } from '../modules/useEventsModule'
import { UseSpringReturnType } from './useSpringCarousel.types'

export type SlideActionType = 'prev' | 'next' | 'initial'
export type SlideMode = 'drag' | 'click' | 'initial'
export type TransitionSlideMode = 'swipe' | 'click' | 'initial'

type SpringRenderItem = {
  useListenToCustomEvent: UseListenToCustomEvent<'use-spring'>['useListenToCustomEvent']
  getIsActiveItem: UseSpringReturnType['getIsActiveItem']
  getIsPrevItem: UseSpringReturnType['getIsPrevItem']
  getIsNextItem: UseSpringReturnType['getIsNextItem']
}
type TransitionRenderItem = {
  getIsPrevItem: UseSpringReturnType['getIsPrevItem']
  getIsNextItem: UseSpringReturnType['getIsNextItem']
  useListenToCustomEvent: UseListenToCustomEvent<'use-transition'>['useListenToCustomEvent']
  activeItem: {
    index: number
    id: string
  }
}

export type RenderItemProps<T> = T extends 'use-spring'
  ? SpringRenderItem
  : TransitionRenderItem

type RenderItemFn<T> = (props: RenderItemProps<T>) => JSX.Element

export type ItemWithThumb<T extends 'use-spring' | 'use-transition'> = {
  id: string
  renderItem: ReactNode | RenderItemFn<T>
  renderThumb: ReactNode | RenderItemFn<T>
}
export type ItemWithNoThumb<T extends 'use-spring' | 'use-transition'> = {
  id: string
  renderItem: ReactNode | RenderItemFn<T>
}

export type PrepareThumbsData<T extends 'use-spring' | 'use-transition'> = (
  items: Omit<ItemWithThumb<T>, 'renderItem'>[],
) => Omit<ItemWithThumb<T>, 'renderItem'>[]
