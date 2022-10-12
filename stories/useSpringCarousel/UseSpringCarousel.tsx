import React from 'react'

import { mockedItems } from '../../src/mockedItems'
import { useSpringCarousel } from 'react-spring-carousel'

export function UseSpringCarousel() {
  const { carouselFragment, slideToPrevItem, slideToNextItem, thumbsFragment } =
    useSpringCarousel({
      gutter: 24,
      items: mockedItems,
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
      <div
        style={{
          border: '4px solid brown',
          height: '80px',
        }}
      >
        {thumbsFragment}
      </div>
    </div>
  )
}
