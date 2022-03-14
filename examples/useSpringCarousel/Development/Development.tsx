import { mockedItems } from '../mocked-data'
import { SliderItem } from 'examples/components/SliderItem/SliderItem'
import { SliderWrapper } from 'examples/components/SliderWrapper/SliderWrapper'
import { css } from '@emotion/react'
import { useSpringCarousel } from 'src'

const items = mockedItems.map(({ id, label, ...rest }) => ({
  id,
  renderItem: <SliderItem {...rest}>{label}</SliderItem>,
}))

const slideType = 'fixed'
export function Development() {
  const { carouselFragment, slideToPrevItem, slideToNextItem, getCurrentActiveItem } =
    useSpringCarousel<typeof slideType>({
      items,
      slideType,
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
