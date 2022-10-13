import React from 'react'

import { mockedItems } from '../../src/mockedItems'
import { ItemWithNoThumb } from '../../src/types'
import { useSpringCarousel } from '../../src/useSpringCarousel'

const items: ItemWithNoThumb[] = mockedItems

export function UseSpringCarousel() {
  const { carouselFragment, slideToPrevItem, slideToNextItem } = useSpringCarousel({
    items,
    enableFreeScrollDrag: true,
    freeScroll: true,
    // startEndGutter: 20,
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
        <button onClick={slideToPrevItem}>PREV</button>
        <div
          className="carousel-wrapper"
          style={{
            flex: '1',
          }}
        >
          {carouselFragment}
        </div>
        <button onClick={slideToNextItem}>NEXT</button>
      </div>
    </div>
  )
}
