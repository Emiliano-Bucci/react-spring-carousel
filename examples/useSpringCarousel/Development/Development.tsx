import { useSpringCarousel } from 'src'
import { mockedItems } from '../mocked-data'
import { SliderItem } from 'examples/components/SliderItem/SliderItem'
import { SliderWrapper } from 'examples/components/SliderWrapper/SliderWrapper'
import { css } from '@emotion/react'

export function Development() {
  const { carouselFragment, thumbsFragment, slideToNextItem, slideToPrevItem } =
    useSpringCarousel({
      withThumbs: true,
      items: mockedItems.map(({ id, label, ...rest }) => ({
        id,
        renderItem: <SliderItem {...rest}>{label}</SliderItem>,
        renderThumb: (
          <div
            css={css`
              display: flex;
              justify-content: center;
              align-items: center;
              width: 240px;
              height: 100%;
            `}
          >
            {label}
          </div>
        ),
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
      <div
        css={css`
          overflow: hidden;
          border: 2px solid red;
          max-height: 200px;
        `}
      >
        {thumbsFragment}
      </div>
    </div>
  )
}
