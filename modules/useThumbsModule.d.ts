/// <reference types="react" />
import { SpringConfig } from 'react-spring'
import {
  UseSpringCarouselProps,
  PrepareThumbsData,
  UseSpringCarouselItems,
  SlideActionType,
} from '../types'
declare type Props = {
  items: UseSpringCarouselItems['items']
  withThumbs: boolean
  thumbsSlideAxis: UseSpringCarouselProps['thumbsSlideAxis']
  springConfig: SpringConfig
  prepareThumbsData?: PrepareThumbsData
  itemsPerSlide?: UseSpringCarouselProps['itemsPerSlide']
  CustomThumbsWrapperComponent?: UseSpringCarouselProps['CustomThumbsWrapperComponent']
  getFluidWrapperScrollValue?(): number
  getSlideValue?(): number
}
export declare function useThumbsModule({
  items,
  withThumbs,
  thumbsSlideAxis,
  springConfig,
  prepareThumbsData,
  itemsPerSlide,
  getFluidWrapperScrollValue,
  getSlideValue,
  CustomThumbsWrapperComponent,
}: Props): {
  thumbsFragment: JSX.Element | null
  handleThumbsScroll: (
    activeItem: number,
    actionType?: SlideActionType | undefined,
  ) => void
}
export {}
