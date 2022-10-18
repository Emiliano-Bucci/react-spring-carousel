import { ReactNode } from 'react'
import { UseListenToCustomEvent } from '../modules/useEventsModule'
import { UseSpringReturnType } from './useSpringCarousel.types'

export type SlideActionType = 'prev' | 'next' | 'initial'
export type SlideMode = 'drag' | 'click' | 'initial'
export type TransitionSlideMode = 'swipe' | 'click' | 'initial'

export type RenderItemProps = {
  useListenToCustomEvent: UseListenToCustomEvent<'use-spring'>['useListenToCustomEvent']
  getIsActiveItem: UseSpringReturnType['getIsActiveItem']
  getIsPrevItem: UseSpringReturnType['getIsPrevItem']
  getIsNextItem: UseSpringReturnType['getIsNextItem']
}

type RenderItemFn = (props: RenderItemProps) => JSX.Element

export type ItemWithThumb = {
  id: string
  renderItem: ReactNode | RenderItemFn
  renderThumb: ReactNode | RenderItemFn
}
export type ItemWithNoThumb = {
  id: string
  renderItem: ReactNode | RenderItemFn
}

export type PrepareThumbsData = (
  items: Omit<ItemWithThumb, 'renderItem'>[],
) => Omit<ItemWithThumb, 'renderItem'>[]
