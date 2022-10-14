import React, { useEffect, useState } from 'react'

import { mockedItems } from '../../src/mockedItems'
import { ItemWithThumb } from '../../src/types'
import { useSpringCarousel } from '../../src/useSpringCarousel'

const items = mockedItems as ItemWithThumb[]

export function UseSpringCarousel() {
  const [i, set] = useState(3)
  const { carouselFragment, slideToPrevItem, slideToNextItem } = useSpringCarousel({
    withLoop: true,
    items,
    itemsPerSlide: i,
    initialStartingPosition: 'center',
  })

  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)')
    if (media.matches) {
      set(3)
    } else {
      set(5)
    }
    media.addEventListener('change', e => {
      if (e.matches) {
        set(3)
      } else {
        set(5)
      }
    })
  }, [])

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
