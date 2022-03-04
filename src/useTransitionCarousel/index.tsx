import { createContext, useRef, useState, useContext } from 'react'
import { useTransition, animated, config } from 'react-spring'
import { useDrag } from '@use-gesture/react'
import { useCustomEventsModule, useThumbsModule, useFullscreenModule } from '../modules'
import { SlideActionType } from '../types'
import {
  UseTransitionCarouselContextProps,
  UseTransitionCarouselProps,
} from '../types/useTransitionCarousel'
import { ReactSpringCarouselItemWithThumbs } from '../types/useSpringCarousel'

const UseTransitionCarouselContext = createContext<
  UseTransitionCarouselContextProps | undefined
>(undefined)

function useTransitionCarouselContext() {
  const context = useContext(UseTransitionCarouselContext)

  if (!context) {
    throw new Error(`useTransitionCarouselContext isn't being used within the useTransitionCarousel context; 
    use the context only inside a component that is rendered within the Carousel.`)
  }

  return context
}

function useTransitionCarousel({
  items,
  withLoop = false,
  withThumbs = false,
  springConfig = config.default,
  thumbsSlideAxis = 'x',
  enableThumbsWrapperScroll = true,
  draggingSlideTreshold = 50,
  prepareThumbsData,
  toPrevItemSpringProps,
  toNextItemSpringProps,
  disableGestures = false,
  CustomThumbsWrapperComponent,
  trail,
  exitBeforeEnter = false,
  springAnimationProps = {
    initial: {
      opacity: 1,
      position: 'absolute',
    },
    from: {
      opacity: 0,
      position: 'absolute',
    },
    enter: {
      opacity: 1,
      position: 'absolute',
    },
    leave: {
      opacity: 0,
      position: 'absolute',
    },
  },
}: UseTransitionCarouselProps) {
  const slideActionType = useRef<SlideActionType>('next')
  const mainCarouselWrapperRef = useRef<HTMLDivElement | null>(null)
  const isAnimating = useRef(false)
  const [activeItem, setActiveItem] = useState(0)

  const { emitObservable, useListenToCustomEvent } = useCustomEventsModule()
  const { enterFullscreen, exitFullscreen, getIsFullscreen } = useFullscreenModule({
    emitObservable,
    mainCarouselWrapperRef,
  })
  const { thumbsFragment: _thumbsFragment, handleThumbsScroll } = useThumbsModule({
    items: items as ReactSpringCarouselItemWithThumbs[],
    withThumbs,
    thumbsSlideAxis,
    springConfig,
    prepareThumbsData,
    CustomThumbsWrapperComponent,
    slideType: 'fixed',
  })

  const bindSwipe = useDrag(
    ({ last, movement: [mx] }) => {
      if (getIsAnimating()) {
        return
      }

      if (last) {
        const prevItemTreshold = mx > draggingSlideTreshold
        const nextItemTreshold = mx < -draggingSlideTreshold
        const isFirstItem = activeItem === 0
        const isLastItem = activeItem === items.length - 1

        if (nextItemTreshold) {
          if (!withLoop && isLastItem) {
            return
          }

          slideToNextItem()
          emitObservable({
            eventName: 'onLeftSwipe',
          })
        } else if (prevItemTreshold) {
          if (!withLoop && isFirstItem) {
            return
          }

          slideToPrevItem()
          emitObservable({
            eventName: 'onRightSwipe',
          })
        }
      }
    },
    {
      enabled: !disableGestures,
    },
  )

  function getTransitionConfig() {
    const slideActionType = getSlideActionType()

    if (slideActionType === 'prev' && toPrevItemSpringProps) {
      return {
        initial: {
          ...springAnimationProps.initial,
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

    if (slideActionType === 'next' && toNextItemSpringProps) {
      return {
        initial: {
          ...springAnimationProps.initial,
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
        ...springAnimationProps.initial,
      },
      from: {
        ...springAnimationProps.from,
      },
      enter: {
        ...springAnimationProps.enter,
      },
      leave: {
        ...springAnimationProps.leave,
      },
    }
  }

  const transitions = useTransition(activeItem, {
    config: springConfig,
    ...getTransitionConfig(),
    onStart: () => setIsAnimating(true),
    trail,
    exitBeforeEnter,
    key: items[activeItem].id,
    onRest: val => {
      if (val.finished) {
        setIsAnimating(false)
        emitObservable({
          eventName: 'onSlideChange',
          slideActionType: getSlideActionType(),
          currentItem: {
            index: activeItem,
            id: items[activeItem].id,
          },
        })
      }
    },
  })
  const itemsFragment = transitions((styles, item) => (
    <animated.div
      style={{
        ...styles,
        flex: '1 0 100%',
        width: '100%',
        height: '100%',
      }}
    >
      {items[item].renderItem}
    </animated.div>
  ))

  function getIsAnimating() {
    return isAnimating.current
  }
  function setIsAnimating(val: boolean) {
    isAnimating.current = val
  }
  function setSlideActionType(type: SlideActionType) {
    slideActionType.current = type
  }
  function getSlideActionType() {
    return slideActionType.current
  }
  function slideToItem(item: string | number) {
    let itemIndex = 0

    if (typeof item === 'string') {
      itemIndex = items.findIndex(_item => _item.id === item)
    } else {
      itemIndex = item
    }

    if (itemIndex >= items.length) {
      throw Error(
        `The item you want to slide to doesn't exist. This could be due to the fact that 
        you provide a wrong id or a higher numeric index.`,
      )
    }

    if (itemIndex === activeItem) {
      return
    }

    const currentItem = findItemIndex(items[activeItem].id)
    const newActiveItem = findItemIndex(items[itemIndex].id)

    emitObservable({
      eventName: 'onSlideStartChange',
      slideActionType: getSlideActionType(),
      nextItem: {
        index: newActiveItem,
        id: items[itemIndex].id,
      },
    })

    if (newActiveItem > currentItem) {
      setSlideActionType('next')
    } else {
      setSlideActionType('prev')
    }

    setActiveItem(itemIndex)

    if (enableThumbsWrapperScroll && withThumbs) {
      handleThumbsScroll(itemIndex)
    }
  }
  function slideToNextItem() {
    const isLastItem = activeItem === items.length - 1

    if (withLoop) {
      setSlideActionType('next')
      if (isLastItem) {
        emitObservable({
          eventName: 'onSlideStartChange',
          slideActionType: getSlideActionType(),
          nextItem: {
            index: 0,
            id: items[0].id,
          },
        })
        setActiveItem(0)
      } else {
        emitObservable({
          eventName: 'onSlideStartChange',
          slideActionType: getSlideActionType(),
          nextItem: {
            index: activeItem + 1,
            id: items[activeItem + 1].id,
          },
        })
        setActiveItem(activeItem + 1)
      }
    } else {
      if (!isLastItem) {
        emitObservable({
          eventName: 'onSlideStartChange',
          slideActionType: getSlideActionType(),
          nextItem: {
            index: activeItem + 1,
            id: items[activeItem + 1].id,
          },
        })
        setSlideActionType('next')
        setActiveItem(activeItem + 1)
      }
    }
  }
  function slideToPrevItem() {
    const isFirstItem = activeItem === 0

    if (withLoop) {
      setSlideActionType('prev')
      if (isFirstItem) {
        emitObservable({
          eventName: 'onSlideStartChange',
          slideActionType: getSlideActionType(),
          nextItem: {
            index: activeItem - 1,
            id: items[activeItem - 1].id,
          },
        })
        setActiveItem(items.length - 1)
      } else {
        emitObservable({
          eventName: 'onSlideStartChange',
          slideActionType: getSlideActionType(),
          nextItem: {
            index: activeItem - 1,
            id: items[activeItem - 1].id,
          },
        })
        setActiveItem(activeItem - 1)
      }
    } else {
      if (!isFirstItem) {
        setSlideActionType('prev')
        emitObservable({
          eventName: 'onSlideStartChange',
          slideActionType: getSlideActionType(),
          nextItem: {
            index: activeItem - 1,
            id: items[activeItem - 1].id,
          },
        })
        setActiveItem(activeItem - 1)
      }
    }
  }
  function findItemIndex(id: string) {
    return items.findIndex(item => item.id === id)
  }
  function getIsNextItem(id: string) {
    const itemIndex = findItemIndex(id)

    if (withLoop && activeItem === items.length - 1) {
      return itemIndex === 0
    }

    return itemIndex === activeItem + 1
  }
  function getIsPrevItem(id: string) {
    const itemIndex = findItemIndex(id)

    if (withLoop && activeItem === 0) {
      return itemIndex === items.length - 1
    }

    return itemIndex === activeItem - 1
  }

  const contextProps: UseTransitionCarouselContextProps = {
    activeItem,
    slideToItem,
    slideToNextItem,
    slideToPrevItem,
    enterFullscreen,
    exitFullscreen,
    useListenToCustomEvent,
    getIsNextItem,
    getIsPrevItem,
    getIsAnimating,
    getIsFullscreen,
    getIsActiveItem: id => {
      return findItemIndex(id) === activeItem
    },
    getCurrentActiveItem: () => ({
      id: items[activeItem].id,
      index: activeItem,
    }),
  }

  const carouselFragment = (
    <UseTransitionCarouselContext.Provider value={contextProps}>
      <div
        ref={mainCarouselWrapperRef}
        {...bindSwipe()}
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
    </UseTransitionCarouselContext.Provider>
  )

  const thumbsFragment = (
    <UseTransitionCarouselContext.Provider value={contextProps}>
      {_thumbsFragment}
    </UseTransitionCarouselContext.Provider>
  )

  return {
    carouselFragment,
    thumbsFragment,
    ...contextProps,
  }
}

export { useTransitionCarouselContext, useTransitionCarousel }
