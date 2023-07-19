import { ItemWithThumb, PrepareThumbsData, RenderItemProps } from '../types'

export type UseThumbsModule<T extends 'use-spring' | 'use-transition'> = {
  withThumbs?: boolean
  thumbsSlideAxis: 'x' | 'y'
  prepareThumbsData?: PrepareThumbsData<T>
  items: ItemWithThumb<T>[]
  renderThumbFnProps: RenderItemProps<T>
}
