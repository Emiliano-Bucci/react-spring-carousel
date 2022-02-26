import { useSpringCarousel } from 'src'
import { mockedItems } from '../mocked-data'
import { SliderItem } from 'examples/components/SliderItem/SliderItem'
import { SliderWrapper } from 'examples/components/SliderWrapper/SliderWrapper'
import { css } from '@emotion/react'
import { useState } from 'react'

const newItems = [
  {
    id: 'extra-item-1',
    label: 'Extra item 1',
    css: css`
      background-color: red;
    `,
  },
  // {
  //   id: 'extra-item-2',
  //   label: 'Extra item 2',
  //   css: css`
  //     background-color: brown;
  //   `,
  // },
]

export function Development() {
  const [showMoreItems, setShowMoreItems] = useState(false)
  let items = [...mockedItems]

  if (showMoreItems) {
    items.push(...newItems)
  } else {
    items = items.filter(i => !i.id.includes('extra-item'))
  }

  const {
    carouselFragment,
    thumbsFragment,
    slideToNextItem,
    slideToPrevItem,
    slideToItem,
  } = useSpringCarousel({
    withThumbs: true,
    prepareThumbsData(items) {
      return [
        ...items,
        {
          id: 'btn',
          renderThumb: (
            <button onClick={() => setShowMoreItems(p => !p)}>Toggle items</button>
          ),
        },
      ]
    },
    items: items.map(({ id, label, ...rest }) => ({
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
      onClick={() => slideToItem(0)}
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
