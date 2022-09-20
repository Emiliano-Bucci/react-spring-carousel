import { mockedItems } from '../mocked-data'
import { SliderItem } from 'examples/components/SliderItem/SliderItem'
import { SliderWrapper } from 'examples/components/SliderWrapper/SliderWrapper'
import { css } from '@emotion/react'
import { useSpringCarousel } from 'src/useSpringCarousel'
import { useState } from 'react'

const items = mockedItems.map(({ id, label, ...rest }) => ({
  id,
  renderItem: <SliderItem {...rest}>{label}</SliderItem>,
  // renderThumb: <div>asd</div>,
}))

export function Development() {
  const [init, set] = useState(false)
  const { carouselFragment, slideToNextItem, thumbsFragment } = useSpringCarousel({
    items,
    gutter: 8,
    withLoop: true,
    init,
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
          <button onClick={() => set(p => !p)}>prev</button>
          <SliderWrapper>{carouselFragment}</SliderWrapper>
          <button onClick={slideToNextItem}>next</button>
        </div>
        {thumbsFragment}
      </div>
    </div>
  )
}
