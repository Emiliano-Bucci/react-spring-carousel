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
import ResizeObserver from 'resize-observer-polyfill'

import {
  SlideActionType,
  SlideMode,
  UseSpringCarouselComplete,
  UseSpringCarouselWithFreeScroll,
  UseSpringCarouselWithThumbs,
  UseSpringCarouselWithNoThumbs,
  UseSpringCarouselWithNoFixedItems,
  UseSpringCarouselWithFixedItems,
  UseSpringFreeScrollReturnType,
  UseSpringReturnType,
  SlideType,
  ItemWithThumb,
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
  getControllerRef,
}: UseSpringCarouselComplete): ReturnType<typeof freeScroll> {
  const itemsPerSlide = _itemsPerSlide > items.length ? items.length : _itemsPerSlide

  const resizeByPropChange = useRef(false)
  const draggingSlideTreshold = useRef(_draggingSlideTreshold ?? 0)
  const slideActionType = useRef<SlideActionType>('initial')
  const slideModeType = useRef<SlideMode>('initial')

  /**
   * After the user hits start/end edges of the carousel,
   * we check where the user is going. This is useful
   * to correctly resize the carousel when the carousel is going
   * backward after reaching the last item in fluid slide mode
   */
  const directionAfterReachingEdges = useRef<'forward' | 'backward' | 'initial'>(
    'initial',
  )

  const activeItem = useRef(initialActiveItem)
  const firstItemReached = useRef(initialActiveItem === 0)
  const lastItemReached = useRef(
    slideType === 'fixed' && initialActiveItem === items.length - 1,
  )
  const mainCarouselWrapperRef = useRef<HTMLDivElement | null>(null)
  const carouselTrackWrapperRef = useRef<HTMLDivElement | null>(null)

  const isFirstMount = useRef(true)

  const prevTotalScrollValue = useRef(0)
  const prevWindowWidth = useRef(0)
  const prevSlidedValue = useRef(0)
  const prevWithLoop = useRef(withLoop)
  const prevSlideType = useRef(slideType)
  const prevFreeScroll = useRef(freeScroll)
  const windowIsHidden = useRef(false)

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

  const [spring, setSpring] = useSpring(
    () => ({
      val: 0,
      pause: !init,
      onChange: ({ value }) => {
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
    }),
    [freeScroll],
  )
  const { emitEvent, useListenToCustomEvent } = useEventsModule<'use-spring'>()
  const { thumbsFragment, handleScroll } = useThumbsModule<'use-spring'>({
    withThumbs: !!withThumbs,
    thumbsSlideAxis,
    prepareThumbsData,
    items: items as ItemWithThumb<'use-spring'>[],
    renderThumbFnProps: {
      getIsActiveItem,
      getIsPrevItem,
      useListenToCustomEvent,
      getIsNextItem,
    },
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
    slideMode: SlideMode
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        startEndGutter * 2,
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (slideType === 'fixed' && withLoop) {
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
    }

    if (slideType === 'fluid') {
      /**
       * User reached the last item and now is resizing the container that becomes smaller/bigger.
       * Example: on mobile devices the user rotates the device
       */
      if (
        lastItemReached.current &&
        getTotalScrollValue() !== Math.abs(prevSlidedValue.current) &&
        !withLoop
      ) {
        const newVal = -getTotalScrollValue()
        prevSlidedValue.current = newVal
        setSpring.start({
          immediate: true,
          val: prevSlidedValue.current,
        })
        return
      }

      if (
        Math.abs(prevSlidedValue.current) > 0 &&
        getTotalScrollValue() !== Math.abs(prevSlidedValue.current) &&
        !withLoop &&
        !freeScroll &&
        directionAfterReachingEdges.current === 'backward'
      ) {
        const diff = prevTotalScrollValue.current - getTotalScrollValue()
        const next = prevSlidedValue.current + diff

        setSpring.start({
          immediate: true,
          val: next,
        })

        return () => {
          prevSlidedValue.current = next
        }
      }

      return
    }

    if (!freeScroll && slideType === 'fixed') {
      const nextValue = -(getSlideValue() * activeItem.current)

      /**
       * Here we make sure to always show the latest item as the
       * latest item visible in the carousel viewport.
       */
      if (Math.abs(nextValue) > getTotalScrollValue() && !withLoop) {
        const val = -getTotalScrollValue()
        lastItemReached.current = true
        prevSlidedValue.current = val
        setSpring.start({
          immediate: true,
          val: prevSlidedValue.current,
        })
      } else {
        prevSlidedValue.current = nextValue
        setSpring.start({
          immediate: true,
          val: nextValue,
        })
      }

      setTimeout(() => {
        resizeByPropChange.current = false
      }, 0)
    }
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

  type SlideToPrevNextItem = {
    type: SlideMode
    index?: number
    immediate?: boolean
  }
  function slideToPrevItem({ type, index, immediate }: SlideToPrevNextItem) {
    if (!init || windowIsHidden.current || (firstItemReached.current && !withLoop)) return

    if (lastItemReached.current) {
      directionAfterReachingEdges.current = 'backward'
    }

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
  function slideToNextItem({ type, index, immediate }: SlideToPrevNextItem) {
    if (!init || windowIsHidden.current || (lastItemReached.current && !withLoop)) return

    if (firstItemReached.current) {
      directionAfterReachingEdges.current = 'forward'
    }

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
  function getDraggingSliderTreshold() {
    if (_draggingSlideTreshold) {
      draggingSlideTreshold.current = _draggingSlideTreshold
    } else {
      draggingSlideTreshold.current = Math.floor(getSlideValue() / 2 / 2)
    }
    return draggingSlideTreshold.current
  }

  useEffect(() => {
    if (activeItem.current !== initialActiveItem) {
      internalSlideToItem({
        id: initialActiveItem,
        immediate: !animateWhenActiveItemChange,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialActiveItem])
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
    prevTotalScrollValue.current = getTotalScrollValue()
    if (!isFirstMount.current) {
      resizeByPropChange.current = true
      adjustCarouselWrapperPosition()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialStartingPosition,
    itemsPerSlide,
    startEndGutter,
    gutter,
    init,
    getTotalScrollValue,
  ])
  useEffect(() => {
    /**
     * When these props change we reset the carousel
     */
    if (
      withLoop !== prevWithLoop.current ||
      slideType !== prevSlideType.current ||
      freeScroll !== prevFreeScroll.current
    ) {
      prevWithLoop.current = withLoop
      prevSlideType.current = slideType
      prevFreeScroll.current = freeScroll

      if (carouselTrackWrapperRef.current) {
        carouselTrackWrapperRef.current.style.transform = `translate3d(0px, 0px,0px)`
        setSpring.start({
          val: 0,
          immediate: true,
        })
      }

      internalSlideToItem({ id: 0, immediate: true, shouldReset: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withLoop, slideType, freeScroll])
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
    /**
     * When itemsPerSlide change we need to update the draggingSlideTreshold.current,
     * since it's default value is based on the calculation of the
     * width of a single item
     */
    getDraggingSliderTreshold()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_draggingSlideTreshold, itemsPerSlide, slideType])
  useEffect(() => {
    if (mainCarouselWrapperRef.current) {
      let timer: NodeJS.Timeout
      const observer = new ResizeObserver(() => {
        if (isFirstMount.current) {
          isFirstMount.current = false
          return
        }

        if (windowIsHidden.current) return
        if (!resizeByPropChange.current) {
          prevWindowWidth.current = window.innerWidth
          const cb = adjustCarouselWrapperPosition()
          window.clearTimeout(timer)

          timer = setTimeout(() => {
            prevTotalScrollValue.current = getTotalScrollValue()
            if (typeof cb === 'function') {
              cb()
            }
          }, 100)
        }
      })
      observer.observe(mainCarouselWrapperRef.current)
      return () => {
        observer.disconnect()
      }
    }
  }, [adjustCarouselWrapperPosition, getTotalScrollValue])
  useEffect(() => {
    if (!init) return
    function handleVisibilityChange() {
      if (document.hidden) {
        windowIsHidden.current = true
      } else {
        windowIsHidden.current = false
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [init])

  const bindDrag = useDrag(
    state => {
      const isDragging = state.dragging
      const movement = state.offset[carouselSlideAxis === 'x' ? 0 : 1]
      const currentMovement = state.movement[carouselSlideAxis === 'x' ? 0 : 1]
      const direction = state.direction[carouselSlideAxis === 'x' ? 0 : 1]

      const prevItemTreshold = currentMovement > getDraggingSliderTreshold()
      const nextItemTreshold = currentMovement < -getDraggingSliderTreshold()
      const tot = getTotalScrollValue()

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
          if (movement > 0) {
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
            state.cancel()
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
          slideToNextItem({ type: 'drag' })
          state.cancel()
        } else if (slideWhenThresholdIsReached && prevItemTreshold) {
          slideToPrevItem({ type: 'drag' })
          state.cancel()
        }

        const res = tot - Math.abs(movement)

        if (res < -(getSlideValue() * 2)) {
          state.cancel()
        }

        return
      }

      if (state.last && freeScroll && movement > 0) {
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
      if (state.last && !state.canceled && freeScroll) {
        if (slideActionType.current === 'prev') {
          slideToPrevItem({ type: 'drag' })
        }
        if (slideActionType.current === 'next') {
          slideToNextItem({ type: 'drag' })
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
            slideToNextItem({ type: 'drag' })
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
            slideToPrevItem({ type: 'drag' })
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
  type InternalSlideToItem = {
    id: string | number
    immediate?: boolean
    shouldReset?: boolean
    type?: SlideType
  }
  function internalSlideToItem({
    id,
    immediate,
    shouldReset,
    type,
  }: InternalSlideToItem) {
    if (!init || windowIsHidden.current) return

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
      slideToNextItem({
        type: type || shouldReset ? 'initial' : 'click',
        index: newActiveItem,
        immediate,
      })
    } else {
      slideToPrevItem({
        type: type || shouldReset ? 'initial' : 'click',
        index: newActiveItem,
        immediate,
      })
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
        slideToPrevItem: (animate = true) => {
          slideToPrevItem({
            type: 'click',
            immediate: !animate,
          })
        },
        slideToNextItem: (animate = true) => {
          slideToNextItem({
            type: 'click',
            immediate: !animate,
          })
        },
      }
    : {
        useListenToCustomEvent,
        enterFullscreen,
        exitFullscreen,
        getIsFullscreen,
        slideToPrevItem: (animate = true) => {
          slideToPrevItem({
            type: 'click',
            immediate: !animate,
          })
        },
        slideToNextItem: (animate = true) => {
          slideToNextItem({
            type: 'click',
            immediate: !animate,
          })
        },
        slideToItem: (id: string | number, animate = true) => {
          internalSlideToItem({ id, immediate: !animate })
        },
        getIsNextItem,
        getIsPrevItem,
        getIsActiveItem,
      }

  useEffect(() => {
    if (getControllerRef) {
      getControllerRef({
        slideToNextItem: res.slideToNextItem,
        slideToPrevItem: res.slideToPrevItem,
        slideToItem: res?.slideToItem,
      })
    }
  }, [getControllerRef, res.slideToItem, res.slideToNextItem, res.slideToPrevItem])

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
          {(freeScroll || !withLoop) && startEndGutter ? (
            <div
              style={{
                flexShrink: 0,
                width: '1px',
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

const Context = createContext<ContextProps | ContextProps<'free-scroll'> | undefined>(
  undefined,
)

function useSpringCarouselContext<T>() {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useSpringCarouselContext must be used within the carousel.')
  }
  return context as ContextProps<T>
}

export { useSpringCarousel, useSpringCarouselContext }
