import { ReactNode } from 'react'

export type SlideActionType = 'prev' | 'next' | 'initial'
export type SlideMode = 'drag' | 'click' | 'initial'
export type TransitionSlideMode = 'swipe' | 'click' | 'initial'

export type ItemWithThumb = {
  id: string
  renderItem: ReactNode
  renderThumb: ReactNode
}
export type ItemWithNoThumb = {
  id: string
  renderItem: ReactNode
}

export type PrepareThumbsData = (
  items: Omit<ItemWithThumb, 'renderItem'>[],
) => Omit<ItemWithThumb, 'renderItem'>[]
