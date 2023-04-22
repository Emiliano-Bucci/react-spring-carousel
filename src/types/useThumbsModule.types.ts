import {
  ItemWithThumb,
  PrepareThumbsData,
  RenderItemProps,
  SpringCarouselWithThumbs,
} from '../types'

export type UseThumbsModule<T extends 'use-spring' | 'use-transition'> = {
  withThumbs?: boolean
  thumbsSlideAxis: SpringCarouselWithThumbs['thumbsSlideAxis']
  prepareThumbsData?: PrepareThumbsData<T>
  items: ItemWithThumb<T>[]
  renderThumbFnProps: RenderItemProps<T>
}
