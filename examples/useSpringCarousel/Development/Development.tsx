import { mockedItems } from '../mocked-data'
import { SliderItem } from 'examples/components/SliderItem/SliderItem'
import { SliderWrapper } from 'examples/components/SliderWrapper/SliderWrapper'
import { css } from '@emotion/react'
import { useSpringCarousel } from 'src/useSpringCarousel'

const items = mockedItems.map(({ id, label, ...rest }) => ({
  id,
  renderItem: <SliderItem {...rest}>{label}</SliderItem>,
  renderThumb: <div>asd</div>,
}))

export function Development() {
  const {
    carouselFragment,
    slideToPrevItem,
    slideToNextItem,
    getCurrentActiveItem,
    thumbsFragment,
  } = useSpringCarousel({
    items,
    // slideType,
    withLoop: false,
    withThumbs: true,
    slideWhenThresholdIsReached: false,
  })

  getCurrentActiveItem()

  return (
    <div
      css={css`
        display: grid;
        width: 100%;
      `}
    >
      <div
        css={css`
          display: grid;
        `}
      >
        <div
          css={css`
            display: flex;
            overflow: hidden;
          `}
        >
          <button onClick={slideToPrevItem}>prev</button>
          <SliderWrapper>{carouselFragment}</SliderWrapper>
          <button onClick={slideToNextItem}>next</button>
        </div>
        {thumbsFragment}
      </div>
    </div>
  )
}
