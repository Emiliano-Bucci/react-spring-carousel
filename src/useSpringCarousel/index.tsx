import { useRef, createContext, useContext } from 'react'
import { useSpring, config, animated } from 'react-spring'
import { useDrag } from '@use-gesture/react'
import { useCustomEventsModule, useFullscreenModule, useThumbsModule } from '../modules'
import {
  SlideToItemFnProps,
  SlideActionType,
  UseSpringDafaultTypeReturnProps,
} from '../types'
import { useIsomorphicLayoutEffect, useIsomorphicMount } from '../utils'
import {
  UseSpringCarouselProps,
  ReactSpringCarouselItemWithThumbs,
} from '../types/useSpringCarousel'
import { UseSpringFluidTypeReturnProps } from 'react-spring-carousel'

const UseSpringCarouselContext = createContext<
  (UseSpringFluidTypeReturnProps | UseSpringDafaultTypeReturnProps) | undefined
>(undefined)

function useSpringCarousel({
  items,
  withLoop = false,
  draggingSlideTreshold,
  springConfig = config.default,
  shouldResizeOnWindowResize = true,
  withThumbs = false,
  enableThumbsWrapperScroll = true,
  carouselSlideAxis = 'x',
  thumbsSlideAxis = 'x',
  prepareThumbsData,
  initialActiveItem = 0,
  initialStartingPosition = 'start',
  disableGestures = false,
  gutter = 0,
  startEndGutter = 0,
  touchAction,
  slideAmount,
  freeScroll = false,
  CustomThumbsWrapperComponent,
  enableFreeScrollDrag,
  itemsPerSlide = 1,
  slideType = 'fixed',
}: UseSpringCarouselProps) {
  function getItems() {
    if (withLoop) {
      if (items.length === itemsPerSlide) {
        return [...items, ...items, ...items, ...items, ...items]
      }
      return [...items, ...items, ...items]
    }
    return items
  }

  const isFirstMount = useRef(true)
  const slideActionType = useRef<SlideActionType>('initial')
  const internalItems = getItems()
  const activeItem = useRef(initialActiveItem)
  const mainCarouselWrapperRef = useRef<HTMLDivElement | null>(null)
  const carouselTrackWrapperRef = useRef<HTMLDivElement | null>(null)
  const isDragging = useRef(false)
  const isAnimating = useRef(false)
  const windowIsHidden = useRef(false)
  const fluidTotalWrapperScrollValue = useRef(0)
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
    config: springConfig,
    onChange: ({ value }) => {
      if (mainCarouselWrapperRef.current && freeScroll) {
        mainCarouselWrapperRef.current[
          carouselSlideAxisRef.current === 'x' ? 'scrollLeft' : 'scrollTop'
        ] = Math.abs(value[carouselSlideAxisRef.current])
      }
    },
  }))

  useIsomorphicLayoutEffect(() => {
    if (draggingSlideTreshold) {
      draggingSlideTresholdRef.current = draggingSlideTreshold
    } else {
      draggingSlideTresholdRef.current = Math.floor(getSlideValue() / 2 / 2)
    }

    resize()
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
    if (window.innerWidth === currentWindowWidth.current || freeScroll) {
      return
    }
    resize()
  }
  // Custom modules
  const { useListenToCustomEvent, emitObservable } = useCustomEventsModule<'use-spring'>()
  const { enterFullscreen, exitFullscreen, getIsFullscreen } = useFullscreenModule({
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
    CustomThumbsWrapperComponent,
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
      function resetAnimation() {
        if (slideType === 'fluid') {
          if (
            getIfItemsNotFillTheCarousel() ||
            (getIsFirstItem() && getSlideActionType() === 'prev')
          ) {
            setCarouselStyles.start({
              [carouselSlideAxisRef.current]: 0,
            })
          } else if (slideEndReached.current && getSlideActionType() === 'next') {
            setCarouselStyles.start({
              [carouselSlideAxisRef.current]: -fluidTotalWrapperScrollValue.current,
            })
          } else {
            setCarouselStyles.start({
              [carouselSlideAxisRef.current]: prevSlidedValue.current,
            })
          }
        } else {
          setCarouselStyles.start({
            [carouselSlideAxisRef.current]: -(getCurrentActiveItem() * getSlideValue()),
          })
        }
      }

      if (isDragging) {
        if (!getIsDragging()) {
          setIsDragging(true)
        }

        emitObservable({
          eventName: 'onDrag',
          slideActionType: getSlideActionType(),
          ...props,
        })

        if (direction > 0) {
          setSlideActionType('prev')
        } else {
          setSlideActionType('next')
        }

        const nextItemWillExceed =
          Math.abs(getCurrentSlidedValue()) + 100 >= fluidTotalWrapperScrollValue.current

        if (nextItemWillExceed && getSlideActionType() === 'next') {
          slideEndReached.current = true
        }
        if (getSlideActionType() === 'prev') {
          slideEndReached.current = false
        }

        if (freeScroll) {
          if (getIfShouldEnableFluidDrag()) {
            if (getWrapperScrollDirection() === 0 && getSlideActionType() === 'prev') {
              cancelDrag()
              return
            } else {
              setCarouselStyles.start({
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
          nextItemTreshold
        ) {
          slideEndReached.current = false
          cancelDrag()
          setCarouselStyles.start({
            [carouselSlideAxisRef.current]: -fluidTotalWrapperScrollValue.current,
          })
        } else if (nextItemTreshold) {
          cancelDrag()
          if (!withLoop && getIsLastItem()) {
            resetAnimation()
          } else {
            slideToNextItem()
          }
          return
        } else if (prevItemTreshold) {
          cancelDrag()
          if (!withLoop && getIsFirstItem()) {
            resetAnimation()
          } else {
            slideToPrevItem()
          }
          return
        }
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
      enabled: !disableGestures,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function slideToItem({
    from,
    to = -1,
    customTo,
    immediate = false,
    onRest = () => {},
  }: SlideToItemFnProps) {
    if (!immediate) {
      setActiveItem(to)
      setIsAnimating(true)
      emitObservable({
        eventName: 'onSlideStartChange',
        slideActionType: getSlideActionType(),
        nextItem: {
          index: slideType === 'fluid' ? -1 : to,
          id: slideType === 'fluid' ? '' : items[to].id,
        },
      })
    }

    prevSlidedValue.current = getToValue(customTo, to)[carouselSlideAxis]
    setCarouselStyles.start({
      ...getFromValue(from),
      to: getToValue(customTo, to),
      immediate,
      onRest: val => {
        if (val.finished) {
          setIsDragging(false)
          setIsAnimating(false)
          onRest()
          if (!immediate) {
            emitObservable({
              eventName: 'onSlideChange',
              slideActionType: getSlideActionType(),
              currentItem: {
                index: slideType === 'fluid' ? -1 : getCurrentActiveItem(),
                id: slideType === 'fluid' ? '' : items[getCurrentActiveItem()].id,
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
  function slideToPrevItem() {
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
          customTo: nextValue < 0 ? 0 : nextValue,
          from: mainCarouselWrapperRef.current!.scrollLeft,
        })
      } else if (nextPrevValue >= 0) {
        if (withLoop) {
          slideToItem({
            from: getCurrentSlidedValue() - getCarouselItemWidth() * items.length,
            customTo:
              getCurrentSlidedValue() -
              getCarouselItemWidth() * items.length +
              getSlideValue(),
          })
        } else {
          slideToItem({
            customTo: 0,
          })
        }
      } else {
        slideToItem({
          customTo: getCurrentSlidedValue() + getSlideValue(),
        })
      }
    } else {
      if ((!withLoop && getCurrentActiveItem() === 0) || windowIsHidden.current) {
        return
      }

      if (getIsFirstItem()) {
        slideToItem({
          from: getCurrentSlidedValue() - getSlideValue() * items.length,
          to: items.length - 1,
        })
      } else {
        slideToItem({
          to: getPrevItem(),
        })
      }
    }
  }
  function slideToNextItem() {
    setSlideActionType('next')

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

        slideToItem({
          customTo: willExceed ? fluidTotalWrapperScrollValue.current : val,
          from: mainCarouselWrapperRef.current!.scrollLeft,
        })
      } else if (
        withLoop &&
        Math.abs(getCurrentSlidedValue() - getSlideValue()) >=
          items.length * getCarouselItemWidth()
      ) {
        const currentWidth = getCarouselItemWidth() * items.length
        slideToItem({
          from: getCurrentSlidedValue() + currentWidth,
          customTo: getCurrentSlidedValue() + currentWidth - getSlideValue(),
        })
      } else if (slideEndReached.current) {
        return
      } else if (nextItemWillExceed) {
        slideEndReached.current = true
        slideToItem({
          customTo: -fluidTotalWrapperScrollValue.current,
        })
      } else {
        slideToItem({
          customTo: getCurrentSlidedValue() - getSlideValue(),
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

      if (nextItemWillExceed && !getIsDragging()) {
        slideEndReached.current = true
      } else if (slideEndReached.current) {
        slideToItem({
          to: items.length - itemsPerSlideRef.current,
        })
      } else if (getIsLastItem()) {
        slideToItem({
          from: getCurrentSlidedValue() + getSlideValue() * items.length,
          to: 0,
        })
      } else {
        slideToItem({
          to: getNextItem(),
        })
      }
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function _slideToItem(item: string | number) {
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

    slideToItem({
      to: itemIndex,
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
  // Perform some check on first mount
  useIsomorphicMount(() => {
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
  })
  useIsomorphicMount(() => {
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
  })
  useIsomorphicMount(() => {
    isFirstMount.current = false
    fluidTotalWrapperScrollValue.current = getFluidWrapperScrollValue()
    initialWindowWidth.current = window.innerWidth
    currentWindowWidth.current = window.innerWidth

    if (initialActiveItem > 0) {
      slideToItem({
        to: initialActiveItem,
        immediate: true,
      })
      setActiveItem(initialActiveItem)
      if (!withLoop && carouselTrackWrapperRef.current) {
        carouselTrackWrapperRef.current.style.top = '0px'
        carouselTrackWrapperRef.current.style.left = '0px'
      }
    }
  })
  useIsomorphicLayoutEffect(() => {
    if (
      initialActiveItemRef.current < items.length &&
      initialActiveItemRef.current !== activeItem.current
    ) {
      slideToItem({
        to: initialActiveItemRef.current,
        immediate: true,
      })
      setActiveItem(initialActiveItemRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useIsomorphicLayoutEffect(() => {
    if (shouldResizeOnWindowResize) {
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldResizeOnWindowResize])
  useIsomorphicLayoutEffect(() => {
    if (carouselTrackWrapperRef.current) {
      if (carouselSlideAxisRef.current === 'x') {
        carouselTrackWrapperRef.current.style.top = '0px'
      }
      if (carouselSlideAxisRef.current === 'y') {
        carouselTrackWrapperRef.current.style.left = '0px'
      }
    }
  }, [carouselSlideAxis])
  useIsomorphicLayoutEffect(() => {
    fluidTotalWrapperScrollValue.current = getFluidWrapperScrollValue()
    const itemsAreEqual = items.length === prevItems.current.length

    if (!itemsAreEqual && items.length < prevItems.current.length) {
      _slideToItem(items.length - 1)
    }

    prevItems.current = items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getFluidWrapperScrollValue, items])

  const contextProps = {
    useListenToCustomEvent,
    getIsFullscreen,
    enterFullscreen,
    exitFullscreen,
    getIsAnimating,
    getIsDragging,
    getIsNextItem,
    getIsPrevItem,
    slideToPrevItem,
    slideToNextItem,
    ...(slideType === 'fixed'
      ? {
          slideToItem: _slideToItem,
          getIsActiveItem: (id: string) => {
            return findItemIndex(id) === getCurrentActiveItem()
          },
          getCurrentActiveItem: () => ({
            id: items[getCurrentActiveItem()].id,
            index: getCurrentActiveItem(),
          }),
        }
      : {}),
  }

  const handleCarouselFragmentRef = (ref: HTMLDivElement | null) => {
    itemsPerSlideRef.current = itemsPerSlide
    if (ref) {
      carouselTrackWrapperRef.current = ref
      adjustCarouselWrapperPosition(ref, initialActiveItemRef.current)
    }
  }

  const carouselFragment = (
    <UseSpringCarouselContext.Provider value={contextProps}>
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
    </UseSpringCarouselContext.Provider>
  )
  const thumbsFragment = (
    <UseSpringCarouselContext.Provider value={contextProps}>
      {_thumbsFragment}
    </UseSpringCarouselContext.Provider>
  )

  return {
    ...contextProps,
    carouselFragment,
    thumbsFragment,
  }
}

function useSpringCarouselContext() {
  const context = useContext(UseSpringCarouselContext)
  if (!context) {
    throw new Error(
      'useSpringCarouselContext must be used only inside a component that is rendered inside the Carousel.',
    )
  }
  return context
}

export { useSpringCarousel, useSpringCarouselContext }
