import { useSpringCarousel } from 'src'
import { mockedItems } from '../mocked-data'
import { SliderItem } from 'examples/components/SliderItem/SliderItem'
import { SliderWrapper } from 'examples/components/SliderWrapper/SliderWrapper'
import { css } from '@emotion/react'
import { useState } from 'react'
import { useIsomorphicMount } from 'src/utils'

const items = mockedItems.map(({ id, label, ...rest }) => ({
  id,
  renderItem: <SliderItem {...rest}>{label}</SliderItem>,
}))

export function Development() {
  const [i, ii] = useState(5)
  const { carouselFragment, slideToPrevItem, slideToNextItem } = useSpringCarousel({
    items,
    itemsPerSlide: i,
    withLoop: true,
    initialStartingPosition: 'center',
  })

  useIsomorphicMount(() => {
    const media = window.matchMedia('(max-width: 800px)')
    if (media.matches) {
      ii(3)
    } else {
      ii(5)
    }
    media.addEventListener('change', e => {
      if (e.matches) {
        ii(3)
      } else {
        ii(5)
      }
    })
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
            ii(p => p + 1)
            slideToNextItem()
          }}
        >
          next
        </button>
      </div>
    </div>
  )
}
