import React from 'react'
import { SlideType } from '../../src/types'

import { useSpringCarousel } from '../../src/useSpringCarousel'

const mockedItems = [
  {
    id: 'item-1',
    title: 'Item 1',
    color: '#1ABC9C',
  },
  {
    id: 'item-2',
    title: 'Item 2',
    color: '#2ECC71',
  },
  {
    id: 'item-3',
    title: 'Item 3',
    color: '#3498DB',
  },
  {
    id: 'item-4',
    title: 'Item 4',
    color: '#F1C40F',
  },
  {
    id: 'item-5',
    title: 'Item 5',
    color: '#9B59B6',
  },
  {
    id: 'item-6',
    title: 'Item 6',
    color: '#E74C3C',
  },
  {
    id: 'item-7',
    title: 'Item 7',
    color: '#E9967A',
  },
  {
    id: 'item-8',
    title: 'Item 8',
    color: '#FFDAB9',
  },
]

export type Props = {
  init: boolean
  withLoop: boolean
  itemsPerSlide: number
  slideType: SlideType
  initialActiveItem: number
  gutter: number
  startEndGutter: number
  disableGestures?: boolean
  slideWhenThresholdIsReached?: boolean
}

export function UseSpringCarousel(props: Props) {
  const { carouselFragment, slideToNextItem, slideToPrevItem } = useSpringCarousel({
    items: mockedItems.map(i => ({
      id: i.id,
      renderItem: (
        <div
          style={{
            flex: '1',
            backgroundColor: i.color,
          }}
        >
          {i.title}
        </div>
      ),
    })),
    ...props,
  })

  return (
    <div
      className="wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          flex: '1',
        }}
      >
        <button
          onClick={() => {
            slideToPrevItem()
          }}
        >
          PREV
        </button>
        <div
          className="carousel-wrapper"
          style={{
            flex: '1',
          }}
        >
          {carouselFragment}
        </div>
        <button onClick={() => slideToNextItem()}>NEXT</button>
      </div>
    </div>
  )
}
