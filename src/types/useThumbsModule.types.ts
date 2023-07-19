import { ItemWithThumb, PrepareThumbsData, RenderItemProps } from '../types'
import { SlideAxis } from './useSpringCarousel.types'

export type UseThumbsModule<T extends 'use-spring' | 'use-transition'> = {
  withThumbs?: boolean
  thumbsSlideAxis: SlideAxis
  prepareThumbsData?: PrepareThumbsData<T>
  items: ItemWithThumb<T>[]
  renderThumbFnProps: RenderItemProps<T>
}
