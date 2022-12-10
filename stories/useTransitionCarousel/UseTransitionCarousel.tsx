import React from 'react'
import { useTransitionCarousel } from '../../src/useTransitionCarousel'
import { mockedItems } from '../../src/mockedItems'

export function UseTransitionCarousel() {
  const { carouselFragment, slideToPrevItem, slideToNextItem } = useTransitionCarousel({
    items: mockedItems.map(i => ({
      id: i.id,
      renderItem(props) {
        const isActive = props.activeItem.id === i.id
        return (
          <div
            style={{
              transition: 'background 480ms ease',
              background: isActive ? 'orange' : 'red',
              flex: '1',
              fontSize: '24px',
            }}
          >
            {i.id}
          </div>
        )
      },
    })),
    withLoop: true,
    toPrevItemSpringProps: {
      initial: {
        transform: 'translateX(0%)',
        position: 'absolute',
      },
      from: {
        transform: 'translateX(-100%)',
        position: 'absolute',
      },
      enter: {
        transform: 'translateX(0%)',
        position: 'absolute',
      },
      leave: {
        transform: 'translateX(50%)',
        position: 'absolute',
      },
    },
    toNextItemSpringProps: {
      initial: {
        transform: 'translateX(0%)',
        position: 'relative',
      },
      from: {
        transform: 'translateX(100%)',
        position: 'relative',
      },
      enter: {
        transform: 'translateX(0%)',
        position: 'relative',
      },
      leave: {
        transform: 'translateX(-50%)',
        position: 'absolute',
      },
    },
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
