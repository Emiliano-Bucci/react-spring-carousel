import { useSpringCarousel } from 'src'
import { mockedItems } from '../mocked-data'
import { SliderItem } from 'examples/components/SliderItem/SliderItem'
import { SliderWrapper } from 'examples/components/SliderWrapper/SliderWrapper'
import { css } from '@emotion/react'

const items = mockedItems.map(({ id, label, ...rest }) => ({
  id,
  renderItem: <SliderItem {...rest}>{label}</SliderItem>,
}))

export function Development() {
  const { carouselFragment, slideToPrevItem, slideToNextItem, enterFullscreen } =
    useSpringCarousel({
      items,
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
        <button
          onClick={() => {
            enterFullscreen()
          }}
        >
          next
        </button>
      </div>
    </div>
  )
}
