import React from 'react'

import { mockedItems } from '../../src/mockedItems'
import { ItemWithThumb } from '../../src/types'
import { useSpringCarousel } from '../../src/useSpringCarousel'

const items = mockedItems as ItemWithThumb[]

export function UseSpringCarousel() {
  const { carouselFragment, slideToPrevItem, slideToNextItem, getIsNextItem } =
    useSpringCarousel({
      withLoop: true,
      items,
      itemsPerSlide: 3,
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
        <button
          onClick={() => {
            slideToNextItem()
            console.log(getIsNextItem('3'))
          }}
        >
          NEXT
        </button>
      </div>
    </div>
  )
}
