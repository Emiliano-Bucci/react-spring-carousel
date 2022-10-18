import React from 'react'

import { mockedItems } from '../../src/mockedItems'
import { ItemWithThumb, SlideType } from '../../src/types'
import { useSpringCarousel } from '../../src/useSpringCarousel'

const items = mockedItems as ItemWithThumb[]

type Props = {
  withLoop: boolean
  itemsPerSlide: number
  slideType: SlideType
}

export function UseSpringCarousel({ withLoop, itemsPerSlide, slideType }: Props) {
  const { carouselFragment, slideToPrevItem, slideToNextItem } = useSpringCarousel({
    items,
    withLoop,
    itemsPerSlide,
    slideType,
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
