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
  const { carouselFragment, slideToPrevItem, slideToNextItem, thumbsFragment } =
    useSpringCarousel({
      items,
      slideWhenThresholdIsReached: false,
      draggingSlideTreshold: 24,
      slideType: 'fluid',
    })

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
