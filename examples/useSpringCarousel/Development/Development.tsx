import { useSpringCarousel } from 'src'
import { mockedItems } from '../mocked-data'
import { SliderItem } from 'examples/components/SliderItem/SliderItem'
import { SliderWrapper } from 'examples/components/SliderWrapper/SliderWrapper'
import { css } from '@emotion/react'
import { useState } from 'react'

const items = mockedItems.map(({ id, label, ...rest }) => ({
  id,
  renderItem: <SliderItem {...rest}>{label}</SliderItem>,
}))

export function Development() {
  const [s, ss] = useState(false)
  const { carouselFragment, slideToNextItem, slideToPrevItem } = useSpringCarousel({
    items: s ? items.filter((i, indx) => indx > 2) : items,
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
            slideToNextItem()
            ss(p => !p)
          }}
        >
          next
        </button>
      </div>
    </div>
  )
}
