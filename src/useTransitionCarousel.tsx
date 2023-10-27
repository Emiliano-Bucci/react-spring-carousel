import { a, config, useTransition } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

import { useThumbsModule } from './modules'
import { useEventsModule } from './modules/useEventsModule'
import {
  ItemWithThumb,
  SlideActionType,
  TransitionSlideMode,
  UseTransitionCarouselProps,
  UseTransitionCarouselReturnProps,
} from './types'

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

function useTransitionCarousel({
  init = true,
  disableGestures = false,
  items,
  springConfig = config.default,
  exitBeforeEnter = false,
  trail,
  withLoop = false,
  activeItem: externalActiveItem,
  toPrevItemSpringProps = defaultAnimationProps,
  toNextItemSpringProps = defaultAnimationProps,
  draggingSlideTreshold = 50,
  thumbsSlideAxis = 'x',
}: UseTransitionCarouselProps): UseTransitionCarouselReturnProps {
  const slideActionType = useRef<SlideActionType>('next')
  const slideModeType = useRef<TransitionSlideMode>('initial')
  const mainCarouselWrapperRef = useRef<HTMLDivElement | null>(null)
  const [activeItem, setActiveItem] = useState(externalActiveItem ?? 0)
  const { emitEvent, useListenToCustomEvent } = useEventsModule<'use-transition'>()
  const { handleScroll, thumbsFragment } = useThumbsModule<'use-transition'>({
    thumbsSlideAxis,
    items: items as ItemWithThumb<'use-transition'>[],
    renderThumbFnProps: {
      getIsNextItem,
      getIsPrevItem,
      useListenToCustomEvent,
      activeItem: {
        index: activeItem,
        id: items[activeItem].id,
      },
    },
  })

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

  type SlideToItem = {
    to: number
    slideType: SlideActionType
    slideMode: TransitionSlideMode
  }

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
    handleScroll(activeItem)
  }

  function slideToPrevItem(slideMode: TransitionSlideMode) {
    if (!init) return
    const isFirstItem = activeItem === 0

    if (!withLoop && isFirstItem) return

    if (withLoop && isFirstItem) {
      slideToItem({
        to: items.length - 1,
        slideType: 'prev',
        slideMode,
      })
    } else {
      slideToItem({
        to: activeItem - 1,
        slideType: 'prev',
        slideMode,
      })
    }
  }
  function slideToNextItem(slideMode: TransitionSlideMode) {
    if (!init) return
    const isLastItem = activeItem === items.length - 1

    if (!withLoop && isLastItem) return

    if (withLoop && isLastItem) {
      slideToItem({
        to: 0,
        slideType: 'next',
        slideMode,
      })
    } else {
      slideToItem({
        to: activeItem + 1,
        slideType: 'next',
        slideMode,
      })
    }
  }

  const transitions = useTransition(activeItem, {
    config: springConfig,
    key: null,
    trail,
    exitBeforeEnter,
    ...getConfig(),
    onRest(value, _, index) {
      if (value.finished && index === activeItem) {
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

  const bindSwipe = useDrag(
    ({ last, movement: [mx] }) => {
      if (last) {
        const prevItemTreshold = mx > draggingSlideTreshold
        const nextItemTreshold = mx < -draggingSlideTreshold
        const isFirstItem = activeItem === 0
        const isLastItem = activeItem === items.length - 1

        if (nextItemTreshold) {
          if (!withLoop && isLastItem) return

          emitEvent({
            eventName: 'onLeftSwipe',
          })
          slideToNextItem('swipe')
        } else if (prevItemTreshold) {
          if (!withLoop && isFirstItem) return

          emitEvent({
            eventName: 'onRightSwipe',
          })
          slideToPrevItem('swipe')
        }
      }
    },
    {
      enabled: !disableGestures,
    },
  )

  function findItemIndex(id: string | number, error?: string) {
    let itemIndex = 0

    if (typeof id === 'string') {
      itemIndex = items.findIndex((item) => item.id === id)
    } else {
      itemIndex = id
    }
    if (itemIndex < 0 || itemIndex >= items.length) {
      if (error) {
        throw new Error(error)
      }
      console.error(`The item doesn't exist; check that the id provided - ${id} - is correct.`)
      itemIndex = -1
    }

    return itemIndex
  }
  function getIsNextItem(id: string | number) {
    const itemIndex = findItemIndex(id, "The item doesn't exist; check the provided id.")
    const _activeItem = activeItem
    if (withLoop && _activeItem === items.length - 1) {
      return itemIndex === 0
    }
    return itemIndex === _activeItem + 1
  }
  function getIsPrevItem(id: string | number) {
    const itemIndex = findItemIndex(id, "The item doesn't exist; check the provided id.")
    const _activeItem = activeItem
    if (withLoop && _activeItem === 0) {
      return itemIndex === items.length - 1
    }
    return itemIndex === _activeItem - 1
  }

  const itemsFragment = transitions((styles, item, _, indx) => {
    const renderItem = items[item].renderItem
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
        {typeof renderItem === 'function'
          ? renderItem({
              useListenToCustomEvent,
              getIsNextItem,
              getIsPrevItem,
              activeItem: {
                index: activeItem,
                id: items[activeItem].id,
              },
            })
          : renderItem}
      </a.div>
    )
  })

  function getTouchAction() {
    if (disableGestures) {
      return 'unset'
    }
    return 'pan-y'
  }

  const result = {
    useListenToCustomEvent,
    slideToPrevItem: () => slideToPrevItem('click'),
    slideToNextItem: () => slideToNextItem('click'),
    activeItem,
  }

  const _thumbsFragment = <Context.Provider value={result}>{thumbsFragment}</Context.Provider>
  const carouselFragment = (
    <Context.Provider value={result}>
      <div
        className="use-transition-carousel-wrapper"
        ref={mainCarouselWrapperRef}
        {...bindSwipe()}
        style={{
          display: 'flex',
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          touchAction: getTouchAction(),
        }}
      >
        {itemsFragment}
      </div>
    </Context.Provider>
  )

  return {
    ...result,
    carouselFragment,
    thumbsFragment: _thumbsFragment,
  }
}

type ContextProps = Omit<UseTransitionCarouselReturnProps, 'carouselFragment' | 'thumbsFragment'>

const Context = createContext<ContextProps | undefined>(undefined)

function useTransitionCarouselContext() {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useTransitionCarouselContext must be used within the carousel.')
  }
  return context
}

export { useTransitionCarousel, useTransitionCarouselContext }
