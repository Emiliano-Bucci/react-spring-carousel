import { useRef, createContext, useContext, useEffect } from 'react'
import { useSpring, config, animated } from 'react-spring'
import { useDrag } from '@use-gesture/react'
import { useCustomEventsModule, useFullscreenModule, useThumbsModule } from '../modules'
import {
  SlideToItemFnProps,
  SlideActionType,
  UseSpringFixedSlideTypeReturnProps,
  SlideMode,
} from '../types'
import { useIsomorphicLayoutEffect, useIsomorphicMount } from '../utils'
import {
  UseSpringCarouselProps,
  ReactSpringCarouselItemWithThumbs,
  UseSpringFluidSlideTypeReturnProps,
  UseSpringCarouselBaseProps,
  UseSpringCarouselWithThumbs,
  UseSpringCarouselFluidType,
  DisableGesturesProps,
  WithLoopProps,
  UseSpringCarouselWithNoThumbs,
  EnableGesturesProps,
  WithNoLoop,
  UseSpringCarouselFixedSlideType,
} from '../types/useSpringCarousel'

type ReturnType<T> = T extends 'fixed'
  ? UseSpringFixedSlideTypeReturnProps
  : UseSpringFluidSlideTypeReturnProps
type ContextTypes<T> = Omit<ReturnType<T>, 'carouselFragment' | 'thumbsFragment'>

const Context = createContext<ContextTypes<'fixed' | 'fluid'> | undefined>(undefined)

const defaultDragSpringConfig = {
  ...config.default,
  mass: 1,
  velocity: 0,
}

function useSpringCarousel(
  props: UseSpringCarouselBaseProps &
    UseSpringCarouselFluidType &
    (UseSpringCarouselWithThumbs | UseSpringCarouselWithNoThumbs) &
    (DisableGesturesProps | EnableGesturesProps) &
    (WithLoopProps | WithNoLoop),
): ReturnType<'fluid'>
function useSpringCarousel(
  props: UseSpringCarouselBaseProps &
    UseSpringCarouselFixedSlideType &
    (UseSpringCarouselWithThumbs | UseSpringCarouselWithNoThumbs) &
    (DisableGesturesProps | EnableGesturesProps) &
    (WithLoopProps | WithNoLoop),
): ReturnType<'fixed'>

function useSpringCarousel({
  items,
  withLoop = false,
  draggingSlideTreshold,
  springConfig = config.default,
  shouldResizeOnWindowResize = true,
  withThumbs = false,
  enableThumbsWrapperScroll = true,
  slideWhenThresholdIsReached = true,
  carouselSlideAxis = 'x',
  thumbsSlideAxis = 'x',
  prepareThumbsData,
  initialActiveItem = 0,
  initialStartingPosition,
  disableGestures = false,
  gutter = 0,
  startEndGutter = 0,
  touchAction,
  slideAmount,
  freeScroll = false,
  enableFreeScrollDrag,
  itemsPerSlide = 1,
  slideType = 'fixed',
  init = true,
}: UseSpringCarouselProps): ReturnType<'fixed' | 'fluid'> {
  function getItems() {
    if (withLoop) {
      if (items.length === itemsPerSlide) {
        return [...items, ...items, ...items, ...items, ...items]
      }
      return [...items, ...items, ...items, ...items]
    }
    return items
  }

  const isFirstMount = useRef(true)
  const slideActionType = useRef<SlideActionType>('initial' as SlideActionType)
  const internalItems = getItems()
  const activeItem = useRef(initialActiveItem)
  const mainCarouselWrapperRef = useRef<HTMLDivElement | null>(null)
  const carouselTrackWrapperRef = useRef<HTMLDivElement | null>(null)
  const isDragging = useRef(false)
  const isAnimating = useRef(false)
  const windowIsHidden = useRef(false)
  const fluidTotalWrapperScrollValue = useRef(0)
  const slideStartReached = useRef(initialActiveItem === 0)
  const slideEndReached = useRef(false)
  const currentWindowWidth = useRef(0)
  const initialWindowWidth = useRef(0)
  const prevSlidedValue = useRef(0)
  const prevItems = useRef(items)

  /**
   * Instead of raw values, we store it in
   * useRef for performances reasons during external rerenders
   */
  const draggingSlideTresholdRef = useRef<number>(draggingSlideTreshold ?? 0)
  const itemsPerSlideRef = useRef(itemsPerSlide)
  const gutterRef = useRef(gutter)
  const startEndGutterRef = useRef(startEndGutter)
  const initialActiveItemRef = useRef(initialActiveItem)
  const initialStartingPositionRef = useRef(initialStartingPosition)
  const carouselSlideAxisRef = useRef(carouselSlideAxis)

  /**
   * Update inner values during external rerenders!
   */
  itemsPerSlideRef.current = itemsPerSlide
  gutterRef.current = gutter
  startEndGutterRef.current = startEndGutter
  initialActiveItemRef.current = initialActiveItem
  initialStartingPositionRef.current = initialStartingPosition
  carouselSlideAxisRef.current = carouselSlideAxis

  const [carouselStyles, setCarouselStyles] = useSpring(() => ({
    y: 0,
    x: 0,
    pause: !init,
    onChange: ({ value }) => {
      if (mainCarouselWrapperRef.current && freeScroll) {
        mainCarouselWrapperRef.current[
          carouselSlideAxisRef.current === 'x' ? 'scrollLeft' : 'scrollTop'
        ] = Math.abs(value[carouselSlideAxisRef.current])
      }
    },
  }))

  useEffect(() => {
    if (draggingSlideTreshold) {
      draggingSlideTresholdRef.current = draggingSlideTreshold
    } else {
      draggingSlideTresholdRef.current = Math.floor(getSlideValue() / 2 / 2)
    }

    resize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draggingSlideTreshold,
    itemsPerSlide,
    gutter,
    startEndGutter,
    initialActiveItem,
    initialStartingPosition,
    carouselSlideAxis,
    thumbsSlideAxis,
  ])

  function getCarouselItem() {
    return carouselTrackWrapperRef.current?.querySelector('.use-spring-carousel-item')
  }
  function getMainCarouselWrapperWidth() {
    if (!mainCarouselWrapperRef.current) {
      throw new Error('mainCarouselWrapperRef is not available')
    }
    return mainCarouselWrapperRef.current.getBoundingClientRect()[
      carouselSlideAxisRef.current === 'x' ? 'width' : 'height'
    ]
  }
  function getCarouselItemWidth() {
    const carouselItem = getCarouselItem()
    if (!carouselItem) {
      throw Error('No carousel items available!')
    }
    return (
      carouselItem.getBoundingClientRect()[
        carouselSlideAxisRef.current === 'x' ? 'width' : 'height'
      ] + gutterRef.current
    )
  }
  function getCurrentSlidedValue() {
    return carouselStyles[carouselSlideAxisRef.current].get()
  }
  function getIfItemsNotFillTheCarousel() {
    return getCarouselItemWidth() * items.length < getMainCarouselWrapperWidth()
  }
  function getFluidWrapperScrollValue() {
    return Math.round(
      Number(
        carouselTrackWrapperRef.current?.[
          carouselSlideAxisRef.current === 'x' ? 'scrollWidth' : 'scrollHeight'
        ],
      ) -
        carouselTrackWrapperRef.current!.getBoundingClientRect()[
          carouselSlideAxisRef.current === 'x' ? 'width' : 'height'
        ],
    )
  }
  function getIsFirstItem() {
    return getCurrentActiveItem() === 0
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function getSlideValue() {
    if (!carouselTrackWrapperRef.current) {
      return 0
    }
    const itemVal = getCarouselItemWidth()

    if (slideType === 'fluid' && typeof slideAmount === 'number') {
      if (slideAmount < itemVal) {
        throw new Error('slideAmount must be greater than the width of a single item.')
      }
      return slideAmount
    }
    return itemVal
  }
  function adjustCarouselWrapperPosition(
    ref: HTMLDivElement,
    _initialActiveItem?: number,
  ) {
    const positionProperty = carouselSlideAxisRef.current === 'x' ? 'left' : 'top'
    function getDefaultPositionValue() {
      return getCarouselItemWidth() * items.length
    }
    function setPosition(v: number) {
      if (withLoop) {
        ref.style.top = '0px'
        ref.style[positionProperty] = `-${v - startEndGutterRef.current}px`
      } else {
        ref.style.left = '0px'
        ref.style.top = '0px'
        if (_initialActiveItem && isFirstMount.current) {
          ref.style[positionProperty] = `calc(-${_initialActiveItem} * 100%)`
        }
      }
    }
    function setStartPosition() {
      setPosition(getDefaultPositionValue())
    }

    if (slideType === 'fixed') {
      function setCenterPosition(i: number) {
        setPosition(
          getDefaultPositionValue() -
            getSlideValue() * Math.round(((i as number) - 1) / 2),
        )
      }
      function setEndPosition(i: number) {
        setPosition(
          getDefaultPositionValue() - getSlideValue() * Math.round((i as number) - 1),
        )
      }

      if (itemsPerSlideRef.current > 1) {
        switch (initialStartingPositionRef.current) {
          default:
          case 'start': {
            setStartPosition()
            break
          }
          case 'center': {
            setCenterPosition(itemsPerSlideRef.current)
            break
          }
          case 'end': {
            setEndPosition(itemsPerSlideRef.current)
            break
          }
        }
      } else {
        setStartPosition()
      }
    } else {
      setStartPosition()
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function resize() {
    if (!init) return
    currentWindowWidth.current = window.innerWidth

    if (slideType === 'fluid') {
      if (getIfItemsNotFillTheCarousel()) {
        setCarouselStyles.start({
          immediate: true,
          [carouselSlideAxisRef.current]: 0,
        })
        return
      }
      fluidTotalWrapperScrollValue.current = getFluidWrapperScrollValue()

      if (slideEndReached.current) {
        const nextValue = -fluidTotalWrapperScrollValue.current
        setCarouselStyles.start({
          immediate: true,
          [carouselSlideAxisRef.current]: nextValue,
        })
      }

      initialWindowWidth.current = window.innerWidth
      prevSlidedValue.current = getCurrentSlidedValue()
    } else {
      setCarouselStyles.start({
        immediate: true,
        [carouselSlideAxisRef.current]: -(getSlideValue() * getCurrentActiveItem()),
      })
    }

    fluidTotalWrapperScrollValue.current = getFluidWrapperScrollValue()
    adjustCarouselWrapperPosition(carouselTrackWrapperRef.current!)
  }
  function handleResize() {
    if (window.innerWidth === currentWindowWidth.current || freeScroll || !init) {
      return
    }
    resize()
  }
  // Custom modules
  const { useListenToCustomEvent, emitObservable } = useCustomEventsModule<'use-spring'>()
  const { enterFullscreen, exitFullscreen, getIsFullscreen } =
    useFullscreenModule<'use-spring'>({
      mainCarouselWrapperRef,
      emitObservable,
      handleResize,
    })
  const { thumbsFragment: _thumbsFragment, handleThumbsScroll } = useThumbsModule({
    withThumbs,
    items: items as ReactSpringCarouselItemWithThumbs[],
    thumbsSlideAxis,
    springConfig,
    prepareThumbsData,
    slideType,
    getFluidWrapperScrollValue,
    getSlideValue,
  })

  function getWrapperScrollDirection() {
    if (!mainCarouselWrapperRef.current) {
      throw new Error('Missing mainCarouselWrapperRef.current')
    }
    return mainCarouselWrapperRef.current[
      carouselSlideAxisRef.current === 'x' ? 'scrollLeft' : 'scrollTop'
    ]
  }
  function getIfShouldEnableFluidDrag() {
    if (typeof enableFreeScrollDrag === 'boolean') {
      return enableFreeScrollDrag
    } else if (typeof enableFreeScrollDrag === 'function') {
      return enableFreeScrollDrag()
    }
    return false
  }

  const bindDrag = useDrag(
    props => {
      const isDragging = props.dragging
      const movement = props.offset[carouselSlideAxisRef.current === 'x' ? 0 : 1]
      const currentMovement = props.movement[carouselSlideAxisRef.current === 'x' ? 0 : 1]
      const prevItemTreshold = currentMovement > draggingSlideTresholdRef.current
      const nextItemTreshold = currentMovement < -draggingSlideTresholdRef.current
      const direction = props.direction[carouselSlideAxisRef.current === 'x' ? 0 : 1]
      function cancelDrag() {
        props.cancel()
      }
      function setDragDirection() {
        if (direction > 0) {
          setSlideActionType('prev')
        } else {
          setSlideActionType('next')
        }
      }
      function emitDragObservable() {
        emitObservable({
          eventName: 'onDrag',
          slideActionType: getSlideActionType(),
          ...props,
        })
      }
      function resetAnimation() {
        if (slideType === 'fluid') {
          if (
            getIfItemsNotFillTheCarousel() ||
            (getIsFirstItem() && getSlideActionType() === 'prev')
          ) {
            setCarouselStyles.start({
              [carouselSlideAxisRef.current]: 0,
              ...getSpringConfig(props.velocity),
            })
          } else if (slideEndReached.current && getSlideActionType() === 'next') {
            setCarouselStyles.start({
              [carouselSlideAxisRef.current]: -fluidTotalWrapperScrollValue.current,
              ...getSpringConfig(props.velocity),
            })
          } else {
            setCarouselStyles.start({
              [carouselSlideAxisRef.current]: prevSlidedValue.current,
              ...getSpringConfig(props.velocity),
            })
          }
        } else {
          setCarouselStyles.start({
            [carouselSlideAxisRef.current]: -(getCurrentActiveItem() * getSlideValue()),
            ...getSpringConfig(props.velocity),
          })
        }
      }
      function checkBounds() {
        const nextItemWillExceed =
          Math.abs(getCurrentSlidedValue()) + 100 >= fluidTotalWrapperScrollValue.current

        if (nextItemWillExceed && getSlideActionType() === 'next') {
          slideEndReached.current = true
        }
        if (getSlideActionType() === 'prev') {
          slideEndReached.current = false
        }
      }

      if (freeScroll && getIfShouldEnableFluidDrag()) {
        if (isDragging) {
          if (!getIsDragging()) {
            setIsDragging(true)
          }

          setDragDirection()
          emitDragObservable()
          checkBounds()
        }

        setCarouselStyles.start({
          from: {
            [carouselSlideAxisRef.current]: getWrapperScrollDirection(),
          },
          to: {
            [carouselSlideAxisRef.current]: -movement,
          },
          config: {
            velocity: props.velocity,
            friction: 50,
            tension: 1400,
          },
        })

        if (getWrapperScrollDirection() === 0 && getSlideActionType() === 'prev') {
          cancelDrag()
          return
        }
        if (props.last) {
          if (getSlideActionType() === 'prev') {
            slideToPrevItem(props.velocity, 'drag')
          } else {
            slideToNextItem(props.velocity, 'drag')
          }
          setIsDragging(false)
        }
        return
      }

      if (isDragging) {
        if (!getIsDragging()) {
          setIsDragging(true)
        }

        emitDragObservable()
        setDragDirection()
        checkBounds()

        if (freeScroll) {
          if (getIfShouldEnableFluidDrag()) {
            if (getWrapperScrollDirection() === 0 && getSlideActionType() === 'prev') {
              cancelDrag()
              return
            } else {
              setCarouselStyles.start({
                config: {
                  velocity: props.velocity,
                  friction: 50,
                  tension: 1400,
                },
                from: {
                  [carouselSlideAxisRef.current]: getWrapperScrollDirection(),
                },
                to: {
                  [carouselSlideAxisRef.current]: -movement,
                },
              })
            }
          }
          return
        } else {
          setCarouselStyles.start({
            [carouselSlideAxisRef.current]: movement,
            config: {
              velocity: props.velocity,
              friction: 50,
              tension: 1000,
            },
          })
        }

        if (
          (prevItemTreshold || nextItemTreshold) &&
          getIfItemsNotFillTheCarousel() &&
          slideType === 'fluid'
        ) {
          cancelDrag()
          resetAnimation()
        } else if (
          slideEndReached.current &&
          getSlideActionType() === 'next' &&
          nextItemTreshold &&
          !withLoop
        ) {
          cancelDrag()
          setCarouselStyles.start({
            [carouselSlideAxisRef.current]: -fluidTotalWrapperScrollValue.current,
            ...getSpringConfig(props.velocity),
          })
        } else if (
          slideStartReached.current &&
          getSlideActionType() === 'prev' &&
          prevItemTreshold &&
          !withLoop
        ) {
          cancelDrag()
          setCarouselStyles.start({
            [carouselSlideAxisRef.current]: 0,
            ...getSpringConfig(props.velocity),
          })
        } else if (slideWhenThresholdIsReached) {
          if (nextItemTreshold) {
            cancelDrag()
            if (!withLoop && getIsLastItem()) {
              resetAnimation()
            } else {
              slideToNextItem(props.velocity, 'drag')
            }
            return
          } else if (prevItemTreshold) {
            cancelDrag()
            if (!withLoop && getIsFirstItem()) {
              resetAnimation()
            } else {
              slideToPrevItem(props.velocity, 'drag')
            }
            return
          }
        }
      }

      if (
        props.last &&
        !slideWhenThresholdIsReached &&
        (nextItemTreshold || prevItemTreshold) &&
        !freeScroll
      ) {
        setIsDragging(false)
        if (nextItemTreshold) {
          if (!withLoop && getIsLastItem()) {
            resetAnimation()
          } else {
            slideToNextItem(props.velocity, 'drag')
          }
        } else if (prevItemTreshold) {
          if (!withLoop && getIsFirstItem()) {
            resetAnimation()
          } else {
            slideToPrevItem(props.velocity, 'drag')
          }
        }
        return
      }

      if (props.last && !nextItemTreshold && !prevItemTreshold) {
        if (!freeScroll) {
          resetAnimation()
          emitObservable({
            eventName: 'onDrag',
            slideActionType: getSlideActionType(),
            ...props,
          })
        }
      }
    },
    {
      enabled: init && !disableGestures,
      axis: carouselSlideAxisRef.current,
      from: () => {
        if (freeScroll) {
          if (carouselSlideAxisRef.current === 'x') {
            return [-getWrapperScrollDirection(), 0]
          }
          return [0, -getWrapperScrollDirection()]
        }
        return [carouselStyles.x.get(), carouselStyles.y.get()]
      },
    },
  )

  function setSlideActionType(type: SlideActionType) {
    slideActionType.current = type
  }
  function getSlideActionType() {
    return slideActionType.current
  }
  function setActiveItem(newItem: number) {
    activeItem.current = newItem
  }
  function getCurrentActiveItem() {
    return activeItem.current
  }
  function getIsAnimating() {
    return isAnimating.current
  }
  function setIsAnimating(val: boolean) {
    isAnimating.current = val
  }
  function setIsDragging(val: boolean) {
    isDragging.current = val
  }
  function getIsDragging() {
    return isDragging.current
  }
  function getPrevItem() {
    const currentActiveItem = getCurrentActiveItem()
    if (currentActiveItem === 0) {
      return items.length - 1
    }
    return currentActiveItem - 1
  }
  function getNextItem() {
    const currentActiveItem = getCurrentActiveItem()
    if (currentActiveItem === items.length - 1) {
      return 0
    }
    return currentActiveItem + 1
  }
  function getIsNextItem(id: string) {
    const itemIndex = findItemIndex(id)
    const activeItem = getCurrentActiveItem()
    if (withLoop && activeItem === items.length - 1) {
      return itemIndex === 0
    }
    return itemIndex === activeItem + 1
  }
  function getIsPrevItem(id: string) {
    const itemIndex = findItemIndex(id)
    const activeItem = getCurrentActiveItem()
    if (withLoop && activeItem === 0) {
      return itemIndex === items.length - 1
    }
    return itemIndex === activeItem - 1
  }
  function findItemIndex(id: string) {
    return items.findIndex(item => item.id === id)
  }
  function getFromValue(from: SlideToItemFnProps['from']) {
    if (typeof from === 'number') {
      return {
        from: {
          [carouselSlideAxisRef.current]: from,
        },
      }
    }
    return {}
  }
  function getToValue(
    customTo: SlideToItemFnProps['customTo'],
    to: SlideToItemFnProps['to'],
  ) {
    if (typeof customTo === 'number') {
      return {
        [carouselSlideAxisRef.current]: customTo,
      }
    }
    if (typeof to !== 'number') {
      throw new Error(`to values is not a number!`)
    }
    return {
      [carouselSlideAxisRef.current]: -(getSlideValue() * to!),
    }
  }
  function getSpringConfig(velocity?: number[]) {
    if (velocity) {
      return {
        config: {
          ...defaultDragSpringConfig,
          velocity,
          friction: undefined,
          tension: undefined,
        },
      }
    }
    return {
      config: {
        velocity: 0,
        ...springConfig,
      },
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function slideToItem({
    from,
    to = -1,
    customTo,
    immediate = false,
    onRest = () => {},
    velocity,
    startReached: _startReached = false,
    endReached: _endReached = false,
    mode,
  }: SlideToItemFnProps) {
    if (!init) return

    const startReached = withLoop ? false : _startReached
    const endReached = withLoop ? false : _endReached

    slideStartReached.current = startReached
    slideEndReached.current = endReached

    if (!immediate) {
      setActiveItem(to)
      setIsAnimating(true)
      emitObservable({
        eventName: 'onSlideStartChange',
        slideActionType: getSlideActionType(),
        slideMode: mode,
        nextItem: {
          index: to,
          id: items[to].id,
          startReached,
          endReached,
        },
      })
    }

    prevSlidedValue.current = getToValue(customTo, to)[carouselSlideAxis]
    setCarouselStyles.start({
      ...getFromValue(from),
      to: getToValue(customTo, to),
      ...getSpringConfig(velocity),
      immediate,
      pause: !init,
      onRest: val => {
        if (val.finished) {
          setIsDragging(false)
          setIsAnimating(false)
          onRest()
          if (!immediate) {
            emitObservable({
              eventName: 'onSlideChange',
              slideActionType: getSlideActionType(),
              slideMode: mode,
              currentItem: {
                index: getCurrentActiveItem(),
                id: items[getCurrentActiveItem()].id,
                startReached,
                endReached,
              },
            })
          }
        }
      },
    })
    if (enableThumbsWrapperScroll && withThumbs && !immediate) {
      handleThumbsScroll(to, getSlideActionType())
    }
  }
  function getIsLastItem() {
    return getCurrentActiveItem() === items.length - 1
  }
  function slideToPrevItem(velocity: number[] | undefined = undefined, mode: SlideMode) {
    if (!init) return
    setSlideActionType('prev')
    slideEndReached.current = false

    if (slideType === 'fluid') {
      slideEndReached.current = false

      if (getIfItemsNotFillTheCarousel()) {
        return
      }
      const nextPrevValue = getCurrentSlidedValue() + getSlideValue() + 200

      if (freeScroll) {
        const nextValue = mainCarouselWrapperRef.current!.scrollLeft - getSlideValue()
        slideToItem({
          to: getPrevItem(),
          customTo: nextValue < 0 ? 0 : nextValue,
          from: mainCarouselWrapperRef.current!.scrollLeft,
          velocity,
          endReached: false,
          startReached: false,
          mode,
        })
      } else if (nextPrevValue >= 0) {
        if (withLoop) {
          slideToItem({
            to: getPrevItem(),
            from: getCurrentSlidedValue() - getCarouselItemWidth() * items.length,
            velocity,
            endReached: false,
            startReached: false,
            mode,
            customTo:
              prevSlidedValue.current -
              getCarouselItemWidth() * items.length +
              getSlideValue(),
          })
        } else if (getCurrentSlidedValue() !== 0) {
          slideStartReached.current = true
          slideToItem({
            to: getPrevItem(),
            customTo: 0,
            velocity,
            endReached: false,
            startReached: true,
            mode,
          })
        }
      } else {
        slideToItem({
          to: getPrevItem(),
          velocity,
          endReached: false,
          startReached: false,
          mode,
        })
      }
    } else {
      if ((!withLoop && getCurrentActiveItem() === 0) || windowIsHidden.current) {
        return
      }

      if (getIsFirstItem()) {
        slideToItem({
          to: items.length - 1,
          from: getCurrentSlidedValue() - getSlideValue() * items.length,
          velocity,
          endReached: false,
          startReached: false,
          mode,
        })
      } else {
        slideToItem({
          to: getPrevItem(),
          velocity,
          endReached: false,
          startReached: getPrevItem() === 0,
          mode,
        })
      }
    }
  }
  function slideToNextItem(velocity: number[] | undefined = undefined, mode: SlideMode) {
    if (!init) return
    setSlideActionType('next')
    slideStartReached.current = false

    if (slideType === 'fluid') {
      if (getIfItemsNotFillTheCarousel()) {
        return
      }

      const nextItemWillExceed =
        Math.abs(getCurrentSlidedValue() - getSlideValue()) + 100 >=
        fluidTotalWrapperScrollValue.current

      if (freeScroll) {
        const nextValue = mainCarouselWrapperRef.current!.scrollLeft + getSlideValue()
        const willExceed = nextValue > fluidTotalWrapperScrollValue.current
        const val = mainCarouselWrapperRef.current!.scrollLeft + getSlideValue()

        if (willExceed) {
          slideEndReached.current = true
        }

        slideToItem({
          to: getNextItem(),
          velocity,
          customTo: willExceed ? fluidTotalWrapperScrollValue.current : val,
          from: mainCarouselWrapperRef.current!.scrollLeft,
          startReached: false,
          endReached: willExceed,
          mode,
        })
      } else if (
        withLoop &&
        Math.abs(getCurrentSlidedValue() - getSlideValue()) >=
          items.length * getCarouselItemWidth()
      ) {
        const currentWidth = getCarouselItemWidth() * items.length
        slideToItem({
          to: getNextItem(),
          from: getCurrentSlidedValue() + currentWidth,
          customTo: prevSlidedValue.current + currentWidth - getSlideValue(),
          velocity,
          startReached: false,
          endReached: false,
          mode,
        })
      } else if (slideEndReached.current) {
        return
      } else if (nextItemWillExceed) {
        slideEndReached.current = true
        slideToItem({
          to: getNextItem(),
          customTo: -fluidTotalWrapperScrollValue.current,
          velocity,
          startReached: false,
          endReached: true,
          mode,
        })
      } else {
        slideToItem({
          to: getNextItem(),
          customTo: prevSlidedValue.current - getSlideValue(),
          velocity,
          startReached: false,
          endReached: false,
          mode,
        })
      }
    } else {
      if (
        (!withLoop && getCurrentActiveItem() === internalItems.length - 1) ||
        windowIsHidden.current
      ) {
        return
      }

      const nextItemWillExceed =
        Math.abs(getCurrentSlidedValue() - getSlideValue() + 25) >
        fluidTotalWrapperScrollValue.current

      if (
        (nextItemWillExceed && !getIsDragging()) ||
        getNextItem() === items.length - 1
      ) {
        slideEndReached.current = true
      }

      if (slideEndReached.current) {
        slideToItem({
          to: items.length - itemsPerSlideRef.current,
          velocity,
          startReached: false,
          endReached: true,
          mode,
        })
      } else if (getIsLastItem()) {
        slideToItem({
          from: getCurrentSlidedValue() + getSlideValue() * items.length,
          to: 0,
          velocity,
          startReached: false,
          endReached: false,
          mode,
        })
      } else {
        slideToItem({
          to: getNextItem(),
          velocity,
          startReached: false,
          endReached: slideEndReached.current,
          mode,
        })
      }
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function _slideToItem(item: string | number) {
    if (!init) return
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

    if (
      itemIndex === getCurrentActiveItem() ||
      (items.length !== prevItems.current.length && getCurrentActiveItem() < items.length)
    ) {
      return
    }

    const currentItem = findItemIndex(prevItems.current[getCurrentActiveItem()].id)
    const newActiveItem = findItemIndex(items[itemIndex].id)

    if (newActiveItem > currentItem) {
      setSlideActionType('next')
    } else {
      setSlideActionType('prev')
    }

    const nextItemWillExceed =
      Math.abs(itemIndex * -getSlideValue()) + 100 >= fluidTotalWrapperScrollValue.current

    slideToItem({
      to: itemIndex,
      ...(nextItemWillExceed ? { customTo: -fluidTotalWrapperScrollValue.current } : {}),
      startReached: itemIndex === 0,
      endReached: itemIndex === items.length - 1 || nextItemWillExceed,
      mode: 'click',
    })
  }
  function getItemStyles(_itemsPerSlide: number) {
    if (slideType === 'fixed') {
      return {
        ...(carouselSlideAxisRef.current === 'x'
          ? { marginRight: `${gutterRef.current}px` }
          : { marginBottom: `${gutterRef.current}px` }),
        flex: `1 0 calc(100% / ${_itemsPerSlide} - ${
          (gutterRef.current * (_itemsPerSlide - 1)) / _itemsPerSlide
        }px)`,
      }
    }
    return {
      ...(carouselSlideAxisRef.current === 'x'
        ? { marginRight: `${gutterRef.current}px` }
        : { marginBottom: `${gutterRef.current}px` }),
    }
  }
  function getAnimatedWrapperStyles() {
    const percentValue = `calc(100% - ${startEndGutterRef.current * 2}px)`
    return {
      width: carouselSlideAxisRef.current === 'x' ? percentValue : '100%',
      height: carouselSlideAxisRef.current === 'y' ? percentValue : '100%',
    }
  }
  function getOverflowStyles() {
    if (freeScroll) {
      if (carouselSlideAxisRef.current === 'x') {
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
  function getWheelEvent() {
    if (freeScroll) {
      return {
        onWheel() {
          carouselStyles[carouselSlideAxisRef.current].stop()
        },
      }
    }
    return {}
  }
  function getTouchAction() {
    if (disableGestures) {
      return 'unset'
    } else if (!touchAction) {
      if (carouselSlideAxisRef.current === 'x') {
        return 'pan-y'
      }
      return 'pan-x'
    }
    return touchAction
  }
  // Perform some check when carousel should be initialized
  useEffect(() => {
    if (init) {
      if (itemsPerSlide % 2 === 0 && initialStartingPositionRef.current) {
        throw new Error(
          `initialStartingPosition can be only used if itemsPerSlide is an even value.`,
        )
      }
      if (draggingSlideTresholdRef.current < 0) {
        throw new Error('draggingSlideTreshold must be greater than 0')
      }
      if (draggingSlideTresholdRef.current > getSlideValue() / 2) {
        throw new Error(
          `draggingSlideTreshold must be equal or less than the half of the width of an item, which is ${Math.floor(
            getSlideValue() / 2,
          )}`,
        )
      }
      if (itemsPerSlideRef.current < 1) {
        throw new Error(`The itemsPerSlide prop can't be less than 1.`)
      }
      if (itemsPerSlideRef.current > items.length) {
        throw new Error(
          `The itemsPerSlide prop can't be greater than the total length of the items you provide.`,
        )
      }
      if (initialActiveItemRef.current < 0) {
        throw new Error('The initialActiveItem cannot be less than 0.')
      }
      if (initialActiveItemRef.current > items.length) {
        throw new Error(
          'The initialActiveItem cannot be greater than the total length of the items you provide.',
        )
      }
      if (!shouldResizeOnWindowResize) {
        console.warn(
          'You set shouldResizeOnWindowResize={false}; be aware that the carousel could behave in a strange way if you also use the fullscreen functionality or if you change the mobile orientation.',
        )
      }
    }
  }, [getSlideValue, init, items.length, itemsPerSlide, shouldResizeOnWindowResize])
  useIsomorphicLayoutEffect(() => {
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
  useIsomorphicMount(() => {
    if (!init) return
    isFirstMount.current = false
    fluidTotalWrapperScrollValue.current = getFluidWrapperScrollValue()
    initialWindowWidth.current = window.innerWidth
    currentWindowWidth.current = window.innerWidth

    if (initialActiveItem > 0) {
      slideToItem({
        to: initialActiveItem,
        immediate: true,
        startReached: initialActiveItem === 0,
        endReached: initialActiveItem === items.length - 1,
        mode: 'click',
      })
      setActiveItem(initialActiveItem)
      if (!withLoop && carouselTrackWrapperRef.current) {
        carouselTrackWrapperRef.current.style.top = '0px'
        carouselTrackWrapperRef.current.style.left = '0px'
      }
    }
  })
  useEffect(() => {
    if (!init) return
    if (initialActiveItem < items.length && initialActiveItem !== activeItem.current) {
      slideToItem({
        to: initialActiveItem,
        immediate: true,
        startReached: initialActiveItem === 0,
        endReached: initialActiveItem === items.length - 1,
        mode: 'click',
      })
      setActiveItem(initialActiveItem)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialActiveItem])
  useEffect(() => {
    if (!init) return
    if (shouldResizeOnWindowResize) {
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
    if (!init && carouselTrackWrapperRef.current) {
      carouselTrackWrapperRef.current.style.left = '0px'
      carouselTrackWrapperRef.current.style.top = '0px'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldResizeOnWindowResize, init])
  useEffect(() => {
    if (!init) return
    if (carouselTrackWrapperRef.current) {
      if (carouselSlideAxisRef.current === 'x') {
        carouselTrackWrapperRef.current.style.top = '0px'
      }
      if (carouselSlideAxisRef.current === 'y') {
        carouselTrackWrapperRef.current.style.left = '0px'
      }
    }
  }, [carouselSlideAxis, init])
  useEffect(() => {
    if (!init) return
    fluidTotalWrapperScrollValue.current = getFluidWrapperScrollValue()
    const itemsAreEqual = items.length === prevItems.current.length

    if (!itemsAreEqual && items.length < prevItems.current.length) {
      _slideToItem(items.length - 1)
    }

    prevItems.current = items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getFluidWrapperScrollValue, items, init])

  const contextProps = {
    useListenToCustomEvent,
    getIsFullscreen,
    enterFullscreen,
    exitFullscreen,
    getIsAnimating,
    getIsDragging,
    getIsNextItem,
    getIsPrevItem,
    slideToPrevItem() {
      slideToPrevItem(undefined, 'click')
    },
    slideToNextItem() {
      slideToNextItem(undefined, 'click')
    },
    ...(slideType === 'fixed'
      ? {
          getIsActiveItem: (id: string) => {
            return findItemIndex(id) === getCurrentActiveItem()
          },
          getCurrentActiveItem: () => ({
            id: items[getCurrentActiveItem()].id,
            index: getCurrentActiveItem(),
          }),
        }
      : {}),
    slideToItem: _slideToItem,
  }

  const handleCarouselFragmentRef = (ref: HTMLDivElement | null) => {
    if (ref) {
      carouselTrackWrapperRef.current = ref
      adjustCarouselWrapperPosition(ref, initialActiveItemRef.current)
    }
  }

  function getInitialStyles() {
    const totalValue = (items.length / itemsPerSlide) * 100
    const singleItemValue = 100 / itemsPerSlide
    const cssProp = carouselSlideAxisRef.current === 'x' ? 'left' : 'y'
    const quantityToMove = Math.floor(50 / singleItemValue)

    if (slideType === 'fixed') {
      if (initialStartingPositionRef.current === 'center') {
        return {
          [cssProp]: `calc(-${totalValue}% + ${singleItemValue * quantityToMove}%)`,
        }
      }
      if (initialStartingPositionRef.current === 'end') {
        return {
          [cssProp]: `calc(-${totalValue}% + ${singleItemValue * (quantityToMove * 2)}%)`,
        }
      }
    }
    return {
      [cssProp]: `0px`,
    }
  }

  const carouselFragment = (
    <Context.Provider value={contextProps}>
      <div
        ref={mainCarouselWrapperRef}
        className="use-spring-carousel-main-wrapper"
        data-testid="use-spring-carousel-wrapper"
        {...getWheelEvent()}
        // @ts-ignore
        style={{
          display: 'flex',
          position: 'relative',
          width: '100%',
          height: '100%',
          ...getOverflowStyles(),
        }}
      >
        <animated.div
          {...bindDrag()}
          className="use-spring-carousel-track-wrapper"
          data-testid="use-spring-carousel-animated-wrapper"
          ref={handleCarouselFragmentRef}
          style={{
            display: 'flex',
            position: 'relative',
            touchAction: getTouchAction(),
            flexDirection: carouselSlideAxisRef.current === 'x' ? 'row' : 'column',
            ...getAnimatedWrapperStyles(),
            ...getInitialStyles(),
            ...(freeScroll ? {} : carouselStyles),
          }}
        >
          {internalItems.map(({ id, renderItem }, index) => {
            return (
              <div
                key={`${id}-${index}`}
                className="use-spring-carousel-item"
                data-testid="use-spring-carousel-item-wrapper"
                style={{
                  display: 'flex',
                  position: 'relative',
                  ...getItemStyles(itemsPerSlideRef.current),
                }}
              >
                {renderItem}
              </div>
            )
          })}
        </animated.div>
      </div>
    </Context.Provider>
  )
  const thumbsFragment = (
    <Context.Provider value={contextProps}>{_thumbsFragment}</Context.Provider>
  )

  return {
    ...contextProps,
    carouselFragment,
    thumbsFragment,
  }
}

function useSpringCarouselContext<T = 'fixed' | 'fluid'>() {
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'useSpringCarouselContext must be used only inside a component that is rendered inside the Carousel.',
    )
  }
  return context as ContextTypes<T>
}

export { useSpringCarousel, useSpringCarouselContext }
