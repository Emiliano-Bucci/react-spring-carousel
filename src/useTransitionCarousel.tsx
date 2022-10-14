import { a, config, useTransition } from '@react-spring/web'
import { useEffect, useRef, useState } from 'react'
import { SlideActionType, SlideMode } from './types/common'
import { UseTransitionCarouselProps } from './types/useTransitionCarousel.types'
import { useEventsModule } from './modules/useEventsModule'

const defaultAnimationProps = {
  initial: {
    opacity: 1,
    position: 'relative',
  },
  from: {
    opacity: 0,
    position: 'relative',
  },
  enter: {
    position: 'relative',
    opacity: 1,
  },
  leave: {
    opacity: 1,
    position: 'absolute',
  },
}

export function useTransitionCarousel({
  init = true,
  // disableGestures = false,
  items,
  springConfig = config.default,
  exitBeforeEnter = false,
  trail,
  withLoop = false,
  activeItem: externalActiveItem,
  toPrevItemSpringProps = defaultAnimationProps,
  toNextItemSpringProps = defaultAnimationProps,
}: UseTransitionCarouselProps) {
  const slideActionType = useRef<SlideActionType>('next')
  const slideModeType = useRef<SlideMode>('initial')
  const mainCarouselWrapperRef = useRef<HTMLDivElement | null>(null)
  const [activeItem, setActiveItem] = useState(externalActiveItem ?? 0)
  const { emitEvent, useListenToCustomEvent } = useEventsModule()

  function getConfig() {
    if (slideActionType.current === 'prev') {
      return {
        initial: {
          ...toPrevItemSpringProps.initial,
        },
        from: {
          ...toPrevItemSpringProps.from,
        },
        enter: {
          ...toPrevItemSpringProps.enter,
        },
        leave: {
          ...toPrevItemSpringProps.leave,
        },
      }
    }
    if (slideActionType.current === 'next') {
      return {
        initial: {
          ...toNextItemSpringProps.initial,
        },
        from: {
          ...toNextItemSpringProps.from,
        },
        enter: {
          ...toNextItemSpringProps.enter,
        },
        leave: {
          ...toNextItemSpringProps.leave,
        },
      }
    }
    return {
      initial: {
        ...defaultAnimationProps.initial,
      },
      from: {
        ...defaultAnimationProps.from,
      },
      enter: {
        ...defaultAnimationProps.enter,
      },
      leave: {
        ...defaultAnimationProps.leave,
      },
    }
  }

  useEffect(() => {
    if (typeof externalActiveItem === 'number' && externalActiveItem !== activeItem) {
      setActiveItem(externalActiveItem)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalActiveItem])

  type SlideToItem = { to: number; slideType: SlideActionType; slideMode: SlideMode }

  function slideToItem({ to, slideType, slideMode }: SlideToItem) {
    slideActionType.current = slideType
    slideModeType.current = slideMode
    emitEvent({
      eventName: 'onSlideStartChange',
      slideActionType: slideActionType.current,
      slideMode: slideModeType.current,
      nextItem: {
        index: to,
        id: items[to].id,
        startReached: to === 0,
        endReached: to === items.length - 1,
      },
    })
    setActiveItem(to)
  }

  function slideToPrevItem() {
    if (!init) return
    const isFirstItem = activeItem === 0

    if (!withLoop && isFirstItem) return

    if (withLoop && isFirstItem) {
      slideToItem({
        to: items.length - 1,
        slideType: 'prev',
        slideMode: 'click',
      })
    } else {
      slideToItem({
        to: activeItem - 1,
        slideType: 'prev',
        slideMode: 'click',
      })
    }
  }
  function slideToNextItem() {
    if (!init) return
    const isLastItem = activeItem === items.length - 1

    if (!withLoop && isLastItem) return

    if (withLoop && isLastItem) {
      slideToItem({
        to: 0,
        slideType: 'next',
        slideMode: 'click',
      })
    } else {
      slideToItem({
        to: activeItem + 1,
        slideType: 'next',
        slideMode: 'click',
      })
    }
  }

  const transitions = useTransition(activeItem, {
    config: springConfig,
    key: null,
    trail,
    exitBeforeEnter,
    ...getConfig(),
    onRest(value) {
      if (value.finished) {
        emitEvent({
          eventName: 'onSlideChange',
          slideActionType: slideActionType.current,
          slideMode: slideModeType.current,
          currentItem: {
            index: activeItem,
            id: items[activeItem].id,
            startReached: activeItem === 0,
            endReached: activeItem === items.length - 1,
          },
        })
      }
    },
  })
  const itemsFragment = transitions((styles, item, _, indx) => {
    return (
      <a.div
        id={`use-transition-carousel-item-${indx}`}
        className="use-transition-carousel-item"
        style={{
          ...styles,
          flex: '1 0 100%',
          width: '100%',
          height: '100%',
        }}
      >
        {items[item].renderItem}
      </a.div>
    )
  })
  const carouselFragment = (
    <div
      ref={mainCarouselWrapperRef}
      // {...bindSwipe()}
      style={{
        display: 'flex',
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {itemsFragment}
    </div>
  )

  return {
    useListenToCustomEvent,
    carouselFragment,
    slideToPrevItem,
    slideToNextItem,
  }
}
