import { useSpringCarousel } from 'src'
import { mockedItems } from '../mocked-data'
import { SliderItem } from 'examples/components/SliderItem/SliderItem'
import { SliderWrapper } from 'examples/components/SliderWrapper/SliderWrapper'
import { css } from '@emotion/react'
import { useState } from 'react'

export function Development() {
  const [gutter, setGutter] = useState(0)
  const { carouselFragment, slideToNextItem, slideToPrevItem } = useSpringCarousel({
    gutter,
    itemsPerSlide: 3,
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
      <button onClick={() => setGutter(59)}>1</button>
      <button onClick={() => setGutter(20)}>2</button>
      <button onClick={() => setGutter(30)}>3</button>
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
