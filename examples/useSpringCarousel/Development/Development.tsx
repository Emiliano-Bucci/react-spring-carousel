import { useSpringCarousel } from 'src'
import { mockedItems } from '../mocked-data'
import { SliderItem } from 'examples/components/SliderItem/SliderItem'
import { SliderWrapper } from 'examples/components/SliderWrapper/SliderWrapper'
import { css } from '@emotion/react'

export function Development() {
  const { carouselFragment, slideToNextItem, slideToPrevItem } = useSpringCarousel({
    itemsPerSlide: 'fluid',
    items: mockedItems.map(({ id, label, ...rest }) => ({
      id,
      renderItem: <SliderItem {...rest}>{label}</SliderItem>,
    })),
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
          display: flex;
          overflow: hidden;
        `}
      >
        <button onClick={slideToPrevItem}>prev</button>
        <SliderWrapper>{carouselFragment}</SliderWrapper>
        <button onClick={slideToNextItem}>next</button>
      </div>
    </div>
  )
}
