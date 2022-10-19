import { config, useSpring } from '@react-spring/web'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react'

import { useEventsModule } from './modules/useEventsModule'
import { useDrag } from '@use-gesture/react'
import { useFullscreenModule } from './modules/useFullscreenModule'
import { useThumbsModule } from './modules/useThumbsModule'
import {
  SlideActionType,
  SlideMode,
  UseSpringCarouselComplete,
  SpringCarouselWithThumbs,
  UseSpringCarouselWithFreeScroll,
  UseSpringCarouselWithThumbs,
  UseSpringCarouselWithNoThumbs,
  UseSpringCarouselWithNoFixedItems,
  UseSpringCarouselWithFixedItems,
  UseSpringFreeScrollReturnType,
  UseSpringReturnType,
} from './types'

type ReturnType<T> = T extends true ? UseSpringFreeScrollReturnType : UseSpringReturnType

/**
 * With free scroll
 */
function useSpringCarousel(props: UseSpringCarouselWithFreeScroll): ReturnType<true>
function useSpringCarousel(props: UseSpringCarouselWithThumbs<true>): ReturnType<true>
function useSpringCarousel(props: UseSpringCarouselWithNoThumbs<true>): ReturnType<true>
/**
 * No free scroll
 */
function useSpringCarousel(props: UseSpringCarouselWithThumbs<false>): ReturnType<false>
function useSpringCarousel(props: UseSpringCarouselWithNoThumbs<false>): ReturnType<false>
function useSpringCarousel(
  props: UseSpringCarouselWithFixedItems<false>,
): ReturnType<false>
function useSpringCarousel(
  props: UseSpringCarouselWithNoFixedItems<false>,
): ReturnType<false>

function useSpringCarousel({
  items,
  init = true,
  withThumbs,
  thumbsSlideAxis = 'x',
  itemsPerSlide: _itemsPerSlide = 1,
  slideType = 'fixed',
  gutter = 0,
  withLoop = false,
  startEndGutter = 0,
  carouselSlideAxis = 'x',
  disableGestures = false,
  draggingSlideTreshold: _draggingSlideTreshold,
  slideWhenThresholdIsReached = false,
  freeScroll,
  enableFreeScrollDrag,
  initialStartingPosition,
  prepareThumbsData,
  initialActiveItem = 0,
  animateWhenActiveItemChange = true,
}: UseSpringCarouselComplete): ReturnType<typeof freeScroll> {
  const resizeByPropChange = useRef(false)
  const itemsPerSlide = _itemsPerSlide > items.length ? items.length : _itemsPerSlide
  const prevWindowWidth = useRef(0)
  const draggingSlideTreshold = useRef(_draggingSlideTreshold ?? 0)
  const slideActionType = useRef<SlideActionType>('initial')
  const slideModeType = useRef<SlideMode>('initial')
  const prevSlidedValue = useRef(0)
  const [spring, setSpring] = useSpring(() => ({
    val: 0,
    pause: !init,
    onChange({ value }) {
      if (freeScroll && mainCarouselWrapperRef.current) {
        if (carouselSlideAxis === 'x') {
          mainCarouselWrapperRef.current.scrollLeft = Math.abs(value.val)
        } else {
          mainCarouselWrapperRef.current.scrollTop = Math.abs(value.val)
        }
        setStartEndItemReachedOnFreeScroll()
      } else if (carouselTrackWrapperRef.current) {
        if (carouselSlideAxis === 'x') {
          carouselTrackWrapperRef.current.style.transform = `translate3d(${value.val}px, 0px,0px)`
        } else {
          carouselTrackWrapperRef.current.style.transform = `translate3d(0px,${value.val}px,0px)`
        }
      }
    },
  }))
  const activeItem = useRef(initialActiveItem)
  const firstItemReached = useRef(initialActiveItem === 0)
  const lastItemReached = useRef(false)
  const mainCarouselWrapperRef = useRef<HTMLDivElement | null>(null)
  const carouselTrackWrapperRef = useRef<HTMLDivElement | null>(null)

  const prevWithLoop = useRef(withLoop)

  const getItems = useCallback(() => {
    if (withLoop) {
      return [
        ...items.map(i => ({
          ...i,
          id: `prev-repeated-item-${i.id}`,
        })),
        ...items,
        ...items.map(i => ({
          ...i,
          id: `next-repeated-item-${i.id}`,
        })),
      ]
    }
    return [...items]
  }, [items, withLoop])
  const internalItems = getItems()

  const { emitEvent, useListenToCustomEvent } = useEventsModule<'use-spring'>()
  const { thumbsFragment, handleScroll } = useThumbsModule({
    withThumbs: !!withThumbs,
    thumbsSlideAxis,
    prepareThumbsData,
    items: items as SpringCarouselWithThumbs['items'],
  })
  const { enterFullscreen, exitFullscreen, getIsFullscreen } = useFullscreenModule({
    mainCarouselWrapperRef,
    handleResize: () => adjustCarouselWrapperPosition(),
    onFullScreenChange: val => {
      emitEvent({
        eventName: 'onFullscreenChange',
        isFullscreen: val,
      })
    },
  })

  function getItemStyles(isLastItem: boolean) {
    if (slideType === 'fixed' && !freeScroll) {
      return {
        marginRight: `${isLastItem ? 0 : gutter}px`,
        flex: `1 0 calc(100% / ${itemsPerSlide} - ${
          (gutter * (itemsPerSlide - 1)) / itemsPerSlide
        }px)`,
      }
    }
    return {
      ...{ marginRight: `${isLastItem ? 0 : gutter}px` },
    }
  }

  function getSlideValue() {
    const carouselItem = mainCarouselWrapperRef.current?.querySelector(
      '.use-spring-carousel-item',
    )

    if (!carouselItem) {
      throw Error('No carousel items available!')
    }

    return (
      carouselItem.getBoundingClientRect()[
        carouselSlideAxis === 'x' ? 'width' : 'height'
      ] + gutter
    )
  }

  type SlideToItem = {
    from: number
    to: number
    nextActiveItem?: number
    immediate?: boolean
    slideMode: 'click' | 'drag'
  }

  function slideToItem({
    from,
    to,
    nextActiveItem,
    immediate = false,
    slideMode,
  }: SlideToItem) {
    slideModeType.current = slideMode

    if (typeof nextActiveItem === 'number') {
      if (!freeScroll) {
        activeItem.current = nextActiveItem
      }
      emitEvent({
        eventName: 'onSlideStartChange',
        slideActionType: slideActionType.current,
        slideMode: slideModeType.current,
        nextItem: {
          startReached: firstItemReached.current,
          endReached: lastItemReached.current,
          index: freeScroll ? -1 : activeItem.current,
          id: freeScroll ? '' : items[activeItem.current].id,
        },
      })
    }

    prevSlidedValue.current = to
    setSpring.start({
      immediate,
      from: {
        val: from,
      },
      to: {
        val: to,
      },
      config: {
        ...config.default,
        velocity: spring.val.velocity,
      },
      onRest(value) {
        if (!immediate && value.finished) {
          emitEvent({
            eventName: 'onSlideChange',
            slideActionType: slideActionType.current,
            slideMode: slideModeType.current,
            currentItem: {
              startReached: firstItemReached.current,
              endReached: lastItemReached.current,
              index: freeScroll ? -1 : activeItem.current,
              id: freeScroll ? '' : items[activeItem.current].id,
            },
          })
        }
      },
    })
    if (withThumbs && !immediate) {
      handleScroll(activeItem.current)
    }
  }
  function getTotalScrollValue() {
    if (withLoop) {
      return getSlideValue() * items.length
    }
    return Math.round(
      Number(
        carouselTrackWrapperRef.current?.[
          carouselSlideAxis === 'x' ? 'scrollWidth' : 'scrollHeight'
        ],
      ) -
        carouselTrackWrapperRef.current!.getBoundingClientRect()[
          carouselSlideAxis === 'x' ? 'width' : 'height'
        ] -
        startEndGutter,
    )
  }
  function getAnimatedWrapperStyles() {
    const percentValue = `calc(100% - ${startEndGutter * 2}px)`
    return {
      width: carouselSlideAxis === 'x' ? percentValue : '100%',
      height: carouselSlideAxis === 'y' ? percentValue : '100%',
    }
  }

  function getCarouselItemWidth() {
    const carouselItem = carouselTrackWrapperRef.current?.querySelector(
      '.use-spring-carousel-item',
    )
    if (!carouselItem) {
      throw Error('No carousel items available!')
    }
    return (
      carouselItem.getBoundingClientRect()[
        carouselSlideAxis === 'x' ? 'width' : 'height'
      ] + gutter
    )
  }
  function adjustCarouselWrapperPosition() {
    const positionProperty = carouselSlideAxis === 'x' ? 'left' : 'top'

    function setPosition(v: number) {
      const ref = carouselTrackWrapperRef.current
      if (!ref) return

      if (withLoop) {
        ref.style.top = '0px'
        ref.style.left = '0px'
        ref.style[positionProperty] = `-${v - startEndGutter}px`

        firstItemReached.current = false
        lastItemReached.current = false
      } else {
        ref.style.left = '0px'
        ref.style.top = '0px'
      }
    }

    const currentFromValue = Math.abs(getFromValue())

    if (initialStartingPosition === 'center') {
      setPosition(
        getCarouselItemWidth() * items.length -
          getSlideValue() * Math.round((itemsPerSlide - 1) / 2),
      )
    } else if (initialStartingPosition === 'end') {
      setPosition(
        getCarouselItemWidth() * items.length -
          getSlideValue() * Math.round(itemsPerSlide - 1),
      )
    } else {
      setPosition(getCarouselItemWidth() * items.length)
    }

    if (
      currentFromValue < getTotalScrollValue() &&
      slideType === 'fluid' &&
      lastItemReached.current &&
      !withLoop
    ) {
      lastItemReached.current = false
    }
    if (currentFromValue > getTotalScrollValue() && !withLoop) {
      const val = -getTotalScrollValue()
      lastItemReached.current = true
      prevSlidedValue.current = val
      setSpring.start({
        immediate: true,
        val: prevSlidedValue.current,
      })
      setTimeout(() => {
        resizeByPropChange.current = false
      }, 0)
    }

    if (!freeScroll && slideType === 'fixed') {
      const val = -(getSlideValue() * activeItem.current)
      prevSlidedValue.current = val
      setSpring.start({
        immediate: true,
        val,
      })
    }

    setTimeout(() => {
      resizeByPropChange.current = false
    }, 0)
  }

  function getFromValue() {
    if (freeScroll && mainCarouselWrapperRef.current) {
      return mainCarouselWrapperRef.current[
        carouselSlideAxis === 'x' ? 'scrollLeft' : 'scrollTop'
      ]
    }
    return spring.val.get()
  }
  function getToValue(type: 'next' | 'prev', index?: number) {
    if (freeScroll && type === 'next') {
      const next = prevSlidedValue.current + getSlideValue()
      if (next > getTotalScrollValue()) {
        return getTotalScrollValue()
      }
      return next
    }

    if (freeScroll && type === 'prev') {
      const next = prevSlidedValue.current - getSlideValue()
      if (next < 0) {
        return 0
      }
      return next
    }

    if (type === 'next') {
      if (typeof index === 'number') {
        return -(index * getSlideValue())
      }
      return prevSlidedValue.current - getSlideValue()
    }

    if (typeof index === 'number') {
      return -(index * getSlideValue())
    }
    return prevSlidedValue.current + getSlideValue()
  }
  function slideToPrevItem(
    type: Exclude<SlideMode, 'initial'> = 'click',
    index?: number,
    immediate?: boolean,
  ) {
    if (!init || (firstItemReached.current && !withLoop)) return

    slideActionType.current = 'prev'
    lastItemReached.current = false

    const nextItem = typeof index === 'number' ? index : activeItem.current - 1

    if (!withLoop) {
      const nextItemWillExceed = freeScroll
        ? getToValue('prev', index) - getSlideValue() / 3 < 0
        : getToValue('prev', index) + getSlideValue() / 3 > 0

      if (firstItemReached.current) return
      if (nextItemWillExceed) {
        firstItemReached.current = true
        lastItemReached.current = false

        slideToItem({
          slideMode: type,
          from: getFromValue(),
          to: 0,
          nextActiveItem: 0,
          immediate,
        })
        return
      }
    }
    if (withLoop && (firstItemReached.current || nextItem < 0)) {
      firstItemReached.current = false
      lastItemReached.current = true
      slideToItem({
        slideMode: type,
        from: getFromValue() - getSlideValue() * items.length,
        to: -(getSlideValue() * items.length) + getSlideValue(),
        nextActiveItem: items.length - 1,
        immediate,
      })
      return
    }
    if (nextItem === 0) {
      firstItemReached.current = true
    }
    if (nextItem === items.length - 1 || nextItem === -1) {
      lastItemReached.current = true
    }
    slideToItem({
      slideMode: type,
      from: getFromValue(),
      to: getToValue('prev', index),
      nextActiveItem: nextItem,
      immediate,
    })
  }
  function slideToNextItem(
    type: Exclude<SlideMode, 'initial'> = 'click',
    index?: number,
    immediate?: boolean,
  ) {
    if (!init || (lastItemReached.current && !withLoop)) return

    slideActionType.current = 'next'
    firstItemReached.current = false

    const nextItem = index || activeItem.current + 1

    if (!withLoop) {
      const nextItemWillExceed =
        Math.abs(getToValue('next', index)) > getTotalScrollValue() - getSlideValue() / 3

      if (lastItemReached.current) return
      if (nextItemWillExceed) {
        firstItemReached.current = false
        lastItemReached.current = true

        slideToItem({
          slideMode: type,
          from: getFromValue(),
          to: freeScroll ? getTotalScrollValue() : -getTotalScrollValue(),
          nextActiveItem: nextItem,
          immediate,
        })
        return
      }
    }
    if (withLoop && (lastItemReached.current || nextItem > items.length - 1)) {
      lastItemReached.current = false
      firstItemReached.current = true
      slideToItem({
        slideMode: type,
        from: getFromValue() + getSlideValue() * items.length,
        to: 0,
        nextActiveItem: 0,
        immediate,
      })
      return
    }
    if (nextItem === 0) {
      firstItemReached.current = true
    }
    if (nextItem === items.length - 1) {
      lastItemReached.current = true
    }
    slideToItem({
      slideMode: type,
      from: getFromValue(),
      to: getToValue('next', index),
      nextActiveItem: nextItem,
      immediate,
    })
  }

  useEffect(() => {
    if (activeItem.current !== initialActiveItem) {
      internalSlideToItem(initialActiveItem, !animateWhenActiveItemChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialActiveItem, animateWhenActiveItemChange])
  useEffect(() => {
    if (init) {
      if (initialActiveItem > items.length - 1) {
        throw new Error(
          `initialActiveItem (${initialActiveItem}) is greater than the total quantity available items (${items.length}).`,
        )
      }
      if (itemsPerSlide > items.length) {
        console.warn(
          `itemsPerSlide (${itemsPerSlide}) is greater than the total quantity available items (${items.length}). Fallback to ${items.length})`,
        )
      }
    }
  }, [initialActiveItem, items, itemsPerSlide, init])
  useEffect(() => {
    prevWindowWidth.current = window.innerWidth
  }, [])
  useEffect(() => {
    resizeByPropChange.current = true
    adjustCarouselWrapperPosition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialStartingPosition,
    itemsPerSlide,
    startEndGutter,
    gutter,
    freeScroll,
    slideType,
    init,
  ])
  useEffect(() => {
    if (withLoop !== prevWithLoop.current) {
      prevWithLoop.current = withLoop
      internalSlideToItem(0, true, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withLoop])
  useLayoutEffect(() => {
    /**
     * Set initial track position
     */
    if (carouselTrackWrapperRef.current) {
      adjustCarouselWrapperPosition()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (_draggingSlideTreshold) {
      draggingSlideTreshold.current = _draggingSlideTreshold
    } else {
      draggingSlideTreshold.current = Math.floor(getSlideValue() / 2 / 2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_draggingSlideTreshold])
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth === prevWindowWidth.current) return
      prevWindowWidth.current = window.innerWidth
      adjustCarouselWrapperPosition()
    }
    if ('ResizeObserver' in window && mainCarouselWrapperRef.current) {
      const observer = new ResizeObserver(() => {
        if (!resizeByPropChange.current) {
          prevWindowWidth.current = window.innerWidth
          adjustCarouselWrapperPosition()
        }
      })
      observer.observe(mainCarouselWrapperRef.current)
      return () => {
        observer.disconnect()
      }
    } else {
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    carouselSlideAxis,
    initialStartingPosition,
    itemsPerSlide,
    withLoop,
    startEndGutter,
    gutter,
    freeScroll,
    slideType,
    init,
  ])

  const bindDrag = useDrag(
    state => {
      const isDragging = state.dragging
      const movement = state.offset[carouselSlideAxis === 'x' ? 0 : 1]
      const currentMovement = state.movement[carouselSlideAxis === 'x' ? 0 : 1]
      const direction = state.direction[carouselSlideAxis === 'x' ? 0 : 1]

      const prevItemTreshold = currentMovement > draggingSlideTreshold.current
      const nextItemTreshold = currentMovement < -draggingSlideTreshold.current

      if (isDragging) {
        if (direction > 0) {
          slideActionType.current = 'prev'
        } else {
          slideActionType.current = 'next'
        }

        emitEvent({
          ...state,
          eventName: 'onDrag',
          slideActionType: slideActionType.current,
        })

        if (freeScroll) {
          if (slideActionType.current === 'prev' && movement > 0) {
            state.cancel()
            setSpring.start({
              from: {
                val: getFromValue(),
              },
              to: {
                val: 0,
              },
              config: {
                velocity: state.velocity,
                friction: 50,
                tension: 1000,
              },
            })
            return
          }

          setSpring.start({
            from: {
              val: getFromValue(),
            },
            to: {
              val: -movement,
            },
            config: {
              velocity: state.velocity,
              friction: 50,
              tension: 1000,
            },
          })
          return
        }

        setSpring.start({
          val: movement,
          config: {
            velocity: state.velocity,
            friction: 50,
            tension: 1000,
          },
        })

        if (slideWhenThresholdIsReached && nextItemTreshold) {
          slideToNextItem('drag')
          state.cancel()
        } else if (slideWhenThresholdIsReached && prevItemTreshold) {
          slideToPrevItem('drag')
          state.cancel()
        }
        return
      }

      if (state.last && !state.canceled && freeScroll) {
        if (slideActionType.current === 'prev') {
          slideToPrevItem('drag')
        }
        if (slideActionType.current === 'next') {
          slideToNextItem('drag')
        }
      }

      if (state.last && !state.canceled && !freeScroll) {
        if (nextItemTreshold) {
          if (!withLoop && lastItemReached.current) {
            setSpring.start({
              val: -getTotalScrollValue(),
              config: {
                ...config.default,
                velocity: state.velocity,
              },
            })
          } else {
            slideToNextItem('drag')
          }
        } else if (prevItemTreshold) {
          if (!withLoop && firstItemReached.current) {
            setSpring.start({
              val: 0,
              config: {
                ...config.default,
                velocity: state.velocity,
              },
            })
          } else {
            slideToPrevItem('drag')
          }
        } else {
          setSpring.start({
            val: prevSlidedValue.current,
            config: {
              ...config.default,
              velocity: state.velocity,
            },
          })
        }
      }
      if (state.last && state.canceled) {
        setSpring.start({
          val: prevSlidedValue.current,
          config: {
            ...config.default,
            velocity: state.velocity,
          },
        })
      }
    },
    {
      enabled:
        (init && !disableGestures && !freeScroll) ||
        (!!freeScroll && !!enableFreeScrollDrag),
      axis: carouselSlideAxis,
      from: () => {
        if (freeScroll && mainCarouselWrapperRef.current) {
          return [
            -mainCarouselWrapperRef.current.scrollLeft,
            -mainCarouselWrapperRef.current.scrollTop,
          ]
        }
        if (carouselSlideAxis === 'x') {
          return [spring.val.get(), spring.val.get()]
        }
        return [spring.val.get(), spring.val.get()]
      },
    },
  )

  function getWrapperOverflowStyles() {
    if (freeScroll) {
      if (carouselSlideAxis === 'x') {
        return {
          overflowX: 'auto',
        }
      }
      return {
        overflowY: 'auto',
      }
    }
    return {}
  }

  function setStartEndItemReachedOnFreeScroll() {
    if (mainCarouselWrapperRef.current) {
      prevSlidedValue.current =
        mainCarouselWrapperRef.current[
          carouselSlideAxis === 'x' ? 'scrollLeft' : 'scrollTop'
        ]
      if (
        mainCarouselWrapperRef.current[
          carouselSlideAxis === 'x' ? 'scrollLeft' : 'scrollTop'
        ] === 0
      ) {
        firstItemReached.current = true
        lastItemReached.current = false
      }
      if (
        mainCarouselWrapperRef.current[
          carouselSlideAxis === 'x' ? 'scrollLeft' : 'scrollTop'
        ] > 0 &&
        mainCarouselWrapperRef.current[
          carouselSlideAxis === 'x' ? 'scrollLeft' : 'scrollTop'
        ] < getTotalScrollValue()
      ) {
        firstItemReached.current = false
        lastItemReached.current = false
      }

      if (
        mainCarouselWrapperRef.current[
          carouselSlideAxis === 'x' ? 'scrollLeft' : 'scrollTop'
        ] === getTotalScrollValue()
      ) {
        firstItemReached.current = false
        lastItemReached.current = true
      }
    }
  }
  function getScrollHandlers() {
    if (freeScroll) {
      return {
        onWheel() {
          spring.val.stop()
          setStartEndItemReachedOnFreeScroll()
        },
      }
    }
    return {}
  }

  function findItemIndex(id: string | number, error?: string) {
    let itemIndex = 0

    if (typeof id === 'string') {
      itemIndex = items.findIndex(item => item.id === id)
    } else {
      itemIndex = id
    }
    if (itemIndex < 0 || itemIndex >= items.length) {
      if (error) {
        throw new Error(error)
      }
      console.error(
        `The item doesn't exist; check that the id provided - ${id} - is correct.`,
      )
      itemIndex = -1
    }

    return itemIndex
  }
  function internalSlideToItem(
    id: string | number,
    immediate = false,
    shouldReset = false,
  ) {
    if (!init) return

    firstItemReached.current = false
    lastItemReached.current = false

    const itemIndex = findItemIndex(
      id,
      "The item you want to slide to doesn't exist; check the provided id.",
    )

    if (itemIndex === activeItem.current && !shouldReset) {
      return
    }

    const currentItem = findItemIndex(items[activeItem.current].id)
    const newActiveItem = findItemIndex(items[itemIndex].id)

    if (newActiveItem > currentItem) {
      slideToNextItem('click', newActiveItem, immediate)
    } else {
      slideToPrevItem('click', newActiveItem, immediate)
    }
  }
  function getIsNextItem(id: string | number) {
    const itemIndex = findItemIndex(id, "The item doesn't exist; check the provided id.")
    const _activeItem = activeItem.current
    if (withLoop && _activeItem === items.length - 1) {
      return itemIndex === 0
    }
    return itemIndex === _activeItem + 1
  }
  function getIsPrevItem(id: string | number) {
    const itemIndex = findItemIndex(id, "The item doesn't exist; check the provided id.")
    const _activeItem = activeItem.current
    if (withLoop && _activeItem === 0) {
      return itemIndex === items.length - 1
    }
    return itemIndex === _activeItem - 1
  }
  function getIsActiveItem(id: string | number) {
    return (
      findItemIndex(
        id,
        "The item you want to check doesn't exist; check the provided id.",
      ) === activeItem.current
    )
  }

  const res = freeScroll
    ? {
        useListenToCustomEvent,
        enterFullscreen,
        exitFullscreen,
        getIsFullscreen,
        slideToPrevItem: () => slideToPrevItem(),
        slideToNextItem: () => slideToNextItem(),
      }
    : {
        useListenToCustomEvent,
        enterFullscreen,
        exitFullscreen,
        getIsFullscreen,
        slideToPrevItem: () => slideToPrevItem(),
        slideToNextItem: () => slideToNextItem(),
        slideToItem: (id: string | number) => internalSlideToItem(id),
        getIsNextItem,
        getIsPrevItem,
        getIsActiveItem,
      }

  const _thumbsFragment = (
    <Context.Provider value={res}>{thumbsFragment}</Context.Provider>
  )
  const carouselFragment = (
    <Context.Provider value={res}>
      <div
        className="use-spring-carousel-main-wrapper"
        ref={mainCarouselWrapperRef}
        {...getScrollHandlers()}
        style={{
          display: 'flex',
          position: 'relative',
          width: '100%',
          height: '100%',
          ...(getWrapperOverflowStyles() as React.CSSProperties),
        }}
      >
        <div
          className="use-spring-carousel-track-wrapper"
          ref={carouselTrackWrapperRef}
          {...bindDrag()}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: carouselSlideAxis === 'x' ? 'row' : 'column',
            touchAction: 'none',
            ...getAnimatedWrapperStyles(),
          }}
        >
          {(freeScroll || !withLoop) && startEndGutter ? (
            <div
              style={{
                flexShrink: 0,
                width: startEndGutter,
              }}
            />
          ) : null}
          {internalItems.map((item, index) => {
            return (
              <div
                key={`${item.id}-${index}`}
                className="use-spring-carousel-item"
                data-testid="use-spring-carousel-item-wrapper"
                style={{
                  display: 'flex',
                  position: 'relative',
                  flex: '1',
                  ...getItemStyles(!!freeScroll && index === items.length - 1),
                }}
              >
                {typeof item.renderItem === 'function'
                  ? item.renderItem({
                      getIsActiveItem,
                      getIsNextItem,
                      getIsPrevItem,
                      useListenToCustomEvent,
                    })
                  : item.renderItem}
              </div>
            )
          })}
          {freeScroll && startEndGutter ? (
            <div
              style={{
                flexShrink: 0,
                width: startEndGutter,
              }}
            />
          ) : null}
        </div>
      </div>
    </Context.Provider>
  )

  return { ...res, carouselFragment, thumbsFragment: _thumbsFragment }
}

type ContextProps<T = undefined> = Omit<
  ReturnType<T extends 'free-scroll' ? true : false>,
  'carouselFragment' | 'thumbsFragment'
>

const Context =
  createContext<ContextProps | ContextProps<'free-scroll'> | undefined>(undefined)

function useSpringCarouselContext<T>() {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useSpringCarouselContext must be used within the carousel.')
  }
  return context as ContextProps<T>
}

export { useSpringCarousel, useSpringCarouselContext }
