import { config, useSpring } from "@react-spring/web";
import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { SpringCarouselBaseProps } from "./types/useSpringCarousel";
import { SlideActionType, SlideMode } from "./types/common";
import { useEventsModule } from "./modules/useEventsModule";
import { useDrag } from "@use-gesture/react";

export function useSpringCarousel({
  items,
  init = true,
  withThumbs,
  itemsPerSlide = 1,
  slideType = "fixed",
  gutter = 0,
  withLoop = false,
  startEndGutter = 0,
  carouselSlideAxis = "x",
  draggingSlideTreshold: _draggingSlideTreshold = 0,
  slideWhenThresholdIsReached = false,
}: SpringCarouselBaseProps) {
  const draggingSlideTreshold = useRef(_draggingSlideTreshold);
  const slideActionType = useRef<SlideActionType>("initial");
  const slideModeType = useRef<SlideMode>("initial");
  const prevSlidedValue = useRef(0);
  const [spring, setSpring] = useSpring(() => ({
    val: 0,
    pause: !init,
    onChange({ value }) {
      if (carouselTrackWrapperRef.current) {
        if (carouselSlideAxis === "x") {
          carouselTrackWrapperRef.current.style.transform = `translate3d(${value.val}px, 0px,0px)`;
        } else {
          carouselTrackWrapperRef.current.style.transform = `translate3d(0px,${value.val}px,0px)`;
        }
      }
    },
  }));
  const activeItem = useRef(0);
  const firstItemReached = useRef(false);
  const lastItemReached = useRef(false);

  const getItems = useCallback(() => {
    if (withLoop) {
      return [
        ...items.map((i) => ({
          ...i,
          id: `prev-repeated-item-${i.id}`,
        })),
        ...items,
        ...items.map((i) => ({
          ...i,
          id: `next-repeated-item-${i.id}`,
        })),
      ];
    }
    return [...items];
  }, [items, withLoop]);

  const { emitEvent, useListenToCustomEvent } = useEventsModule();

  function getItemStyles() {
    if (slideType === "fixed") {
      return {
        ...{ marginRight: `${gutter}px` },
        flex: `1 0 calc(100% / ${itemsPerSlide} - ${
          (gutter * (itemsPerSlide - 1)) / itemsPerSlide
        }px)`,
      };
    }
    return {
      ...{ marginRight: `${gutter}px` },
    };
  }

  const mainCarouselWrapperRef = useRef<HTMLDivElement | null>(null);
  const carouselTrackWrapperRef = useRef<HTMLDivElement | null>(null);
  const internalItems = getItems();

  function getSlideValue() {
    const carouselItem = mainCarouselWrapperRef.current?.querySelector(
      ".use-spring-carousel-item"
    );

    if (!carouselItem) {
      throw Error("No carousel items available!");
    }

    return (
      carouselItem.getBoundingClientRect()[
        carouselSlideAxis === "x" ? "width" : "height"
      ] + gutter
    );
  }

  type SlideToItem = {
    from: number;
    to: number;
    nextActiveItem?: number;
    immediate?: boolean;
    slideMode: "click" | "drag";
  };

  function slideToItem({
    from,
    to,
    nextActiveItem,
    immediate = false,
    slideMode,
  }: SlideToItem) {
    slideModeType.current = slideMode;

    if (typeof nextActiveItem === "number") {
      activeItem.current = nextActiveItem;
      emitEvent({
        eventName: "onSlideStartChange",
        slideActionType: slideActionType.current,
        slideMode: slideModeType.current,
        nextItem: {
          index: activeItem.current,
          startReached: firstItemReached.current,
          endReached: lastItemReached.current,
          id: items[activeItem.current].id,
        },
      });
    }

    prevSlidedValue.current = to;
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
            eventName: "onSlideChange",
            slideActionType: slideActionType.current,
            slideMode: slideModeType.current,
            currentItem: {
              index: activeItem.current,
              startReached: firstItemReached.current,
              endReached: lastItemReached.current,
              id: items[activeItem.current].id,
            },
          });
        }
      },
    });
  }

  function getTotalScrollValue() {
    if (withLoop) {
      return getSlideValue() * items.length;
    }
    return Math.round(
      Number(
        carouselTrackWrapperRef.current?.[
          carouselSlideAxis === "x" ? "scrollWidth" : "scrollHeight"
        ]
      ) -
        carouselTrackWrapperRef.current!.getBoundingClientRect()[
          carouselSlideAxis === "x" ? "width" : "height"
        ] -
        gutter -
        startEndGutter
    );
  }
  function getAnimatedWrapperStyles() {
    const percentValue = `calc(100% - ${startEndGutter * 2}px)`;
    return {
      width: carouselSlideAxis === "x" ? percentValue : "100%",
      height: carouselSlideAxis === "y" ? percentValue : "100%",
    };
  }
  function getInitialStyles() {
    const totalValue = (items.length / itemsPerSlide) * 100;
    const singleItemValue = 100 / itemsPerSlide;
    const cssProp = carouselSlideAxis === "x" ? "left" : "y";
    const quantityToMove = Math.floor(50 / singleItemValue);

    // if (slideType === 'fixed') {
    //   if (initialStartingPositionRef.current === 'center') {
    //     return {
    //       [cssProp]: `calc(-${totalValue}% + ${singleItemValue * quantityToMove}%)`,
    //     }
    //   }
    //   if (initialStartingPositionRef.current === 'end') {
    //     return {
    //       [cssProp]: `calc(-${totalValue}% + ${singleItemValue * (quantityToMove * 2)}%)`,
    //     }
    //   }
    // }
    return {
      [cssProp]: `0px`,
    };
  }

  function getCarouselItemWidth() {
    const carouselItem = carouselTrackWrapperRef.current?.querySelector(
      ".use-spring-carousel-item"
    );
    if (!carouselItem) {
      throw Error("No carousel items available!");
    }
    return (
      carouselItem.getBoundingClientRect()[
        carouselSlideAxis === "x" ? "width" : "height"
      ] + gutter
    );
  }
  function adjustCarouselWrapperPosition(resize = false) {
    const positionProperty = carouselSlideAxis === "x" ? "left" : "top";

    function setPosition(v: number) {
      const ref = carouselTrackWrapperRef.current;
      if (!ref) return;

      if (withLoop) {
        ref.style.top = "0px";
        ref.style[positionProperty] = `-${v - startEndGutter}px`;
      } else {
        ref.style.left = "0px";
        ref.style.top = "0px";
        // if (_initialActiveItem && isFirstMount.current) {
        //   ref.style[positionProperty] = `calc(-${_initialActiveItem} * 100%)`
        // }
      }
    }

    if (slideType === "fixed") {
      setPosition(getCarouselItemWidth() * items.length);
    }

    if (resize) {
      setSpring.start({
        immediate: true,
        val: -(getSlideValue() * activeItem.current),
      });
    }
  }

  function slideToPrevItem(type: Exclude<SlideMode, "initial"> = "click") {
    if (!init || (firstItemReached.current && !withLoop)) return;

    slideActionType.current = "prev";
    firstItemReached.current = false;
    lastItemReached.current = false;

    const nextItemWillEceed = withLoop
      ? (activeItem.current - 1) * getSlideValue() < 0
      : (activeItem.current - 1) * (getSlideValue() - getSlideValue() / 2) < 0;
    const nextItem = activeItem.current - 1;

    if (nextItemWillEceed) {
      if (withLoop) {
        slideToItem({
          slideMode: type,
          from: spring.val.get() - getSlideValue() * items.length,
          to: -(getSlideValue() * items.length) + getSlideValue(),
          nextActiveItem: items.length - 1,
        });
      } else {
        firstItemReached.current = true;
        slideToItem({
          slideMode: type,
          from: spring.val.get(),
          to: 0,
          nextActiveItem: 0,
        });
      }
    } else {
      if (nextItem === 0) {
        firstItemReached.current = true;
      }
      slideToItem({
        slideMode: type,
        from: spring.val.get(),
        to: -(nextItem * getSlideValue()),
        nextActiveItem: nextItem,
      });
    }
  }
  function slideToNextItem(type: Exclude<SlideMode, "initial"> = "click") {
    if (!init || (lastItemReached.current && !withLoop)) return;

    slideActionType.current = "next";
    firstItemReached.current = false;
    lastItemReached.current = false;

    const nextItem = activeItem.current + 1;
    const nextItemWillExceed = withLoop
      ? (activeItem.current + 1) * getSlideValue() >= getTotalScrollValue()
      : (activeItem.current + 1) * (getSlideValue() + getSlideValue() / 2) >=
        getTotalScrollValue();

    if (nextItemWillExceed) {
      if (withLoop) {
        slideToItem({
          slideMode: type,
          from: spring.val.get() + getSlideValue() * items.length,
          to: 0,
          nextActiveItem: 0,
        });
      } else {
        lastItemReached.current = true;
        slideToItem({
          slideMode: type,
          from: spring.val.get(),
          to: -getTotalScrollValue(),
          nextActiveItem: nextItem,
        });
      }
    } else {
      if (nextItem === items.length - 1) {
        lastItemReached.current = true;
      }
      slideToItem({
        slideMode: type,
        from: spring.val.get(),
        to: -(nextItem * getSlideValue()),
        nextActiveItem: nextItem,
      });
    }
  }

  useLayoutEffect(() => {
    /**
     * Set initial track position
     */
    if (withLoop && carouselTrackWrapperRef.current) {
      carouselTrackWrapperRef.current.style.left = `${-(
        getSlideValue() * items.length
      )}px`;
    }

    adjustCarouselWrapperPosition();
  }, []);

  useEffect(() => {
    if (_draggingSlideTreshold) {
      draggingSlideTreshold.current = _draggingSlideTreshold;
    } else {
      draggingSlideTreshold.current = Math.floor(getSlideValue() / 2 / 2);
    }
  }, [_draggingSlideTreshold]);

  useEffect(() => {
    function handleResize() {
      adjustCarouselWrapperPosition(true);
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const bindDrag = useDrag(
    (state) => {
      const isDragging = state.dragging;
      const movement = state.offset[carouselSlideAxis === "x" ? 0 : 1];
      const currentMovement = state.movement[carouselSlideAxis === "x" ? 0 : 1];
      const direction = state.direction[carouselSlideAxis === "x" ? 0 : 1];

      const prevItemTreshold = currentMovement > draggingSlideTreshold.current;
      const nextItemTreshold = currentMovement < -draggingSlideTreshold.current;

      if (isDragging) {
        if (direction > 0) {
          slideActionType.current = "prev";
        } else {
          slideActionType.current = "next";
        }

        emitEvent({
          ...state,
          eventName: "onDrag",
          slideActionType: slideActionType.current,
        });

        setSpring.start({
          val: movement,
          config: {
            velocity: state.velocity,
            friction: 50,
            tension: 1000,
          },
        });

        if (slideWhenThresholdIsReached && nextItemTreshold) {
          slideToNextItem("drag");
          state.cancel();
        } else if (slideWhenThresholdIsReached && prevItemTreshold) {
          slideToPrevItem("drag");
          state.cancel();
        }
        return;
      }

      if (state.last && !state.canceled) {
        if (nextItemTreshold) {
          slideToNextItem("drag");
        } else if (prevItemTreshold) {
          slideToPrevItem("drag");
        } else {
          setSpring.start({
            val: prevSlidedValue.current,
            config: {
              ...config.default,
              velocity: state.velocity,
            },
          });
        }
      }
    },
    {
      // enabled: init && !disableGestures,
      axis: carouselSlideAxis,
      from: () => {
        if (carouselSlideAxis === "x") {
          return [spring.val.get(), spring.val.get()];
        }
        return [spring.val.get(), spring.val.get()];
      },
    }
  );

  const carouselFragment = (
    <div
      ref={mainCarouselWrapperRef}
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <div
        ref={carouselTrackWrapperRef}
        {...bindDrag()}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: carouselSlideAxis === "x" ? "row" : "column",
          touchAction: "none",
          ...getAnimatedWrapperStyles(),
          ...getInitialStyles(),
        }}
      >
        {internalItems.map((item, index) => {
          return (
            <div
              key={`${item.id}-${index}`}
              className="use-spring-carousel-item"
              data-testid="use-spring-carousel-item-wrapper"
              style={{
                display: "flex",
                position: "relative",
                flex: "1",
                ...getItemStyles(),
              }}
            >
              {item.renderItem}
            </div>
          );
        })}
      </div>
    </div>
  );

  return {
    carouselFragment,
    slideToPrevItem() {
      slideToPrevItem();
    },
    slideToNextItem() {
      slideToNextItem();
    },
    useListenToCustomEvent,
  };
}
