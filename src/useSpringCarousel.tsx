import { config, useSpring } from "@react-spring/web";
import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { SpringCarouselBaseProps } from "./types/useSpringCarousel";
import { SlideActionType, SlideMode } from "./types/common";
import { useEventsModule } from "./modules/useEventsModule";
import { useDrag } from "@use-gesture/react";
import { useFullscreenModule } from "./modules/useFullscreenModule";

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
  disableGestures = false,
  draggingSlideTreshold: _draggingSlideTreshold,
  slideWhenThresholdIsReached = false,
  freeScroll,
  enableFreeScrollDrag,
  initialStartingPosition,
}: SpringCarouselBaseProps) {
  const draggingSlideTreshold = useRef(_draggingSlideTreshold ?? 0);
  const slideActionType = useRef<SlideActionType>("initial");
  const slideModeType = useRef<SlideMode>("initial");
  const prevSlidedValue = useRef(0);
  const [spring, setSpring] = useSpring(() => ({
    val: 0,
    pause: !init,
    onChange({ value }) {
      if (freeScroll && mainCarouselWrapperRef.current) {
        setStartEndItemReachedOnFreeScroll();
        if (carouselSlideAxis === "x") {
          mainCarouselWrapperRef.current.scrollLeft = Math.abs(value.val);
        } else {
          mainCarouselWrapperRef.current.scrollTop = Math.abs(value.val);
        }
      } else if (carouselTrackWrapperRef.current) {
        if (carouselSlideAxis === "x") {
          carouselTrackWrapperRef.current.style.transform = `translate3d(${value.val}px, 0px,0px)`;
        } else {
          carouselTrackWrapperRef.current.style.transform = `translate3d(0px,${value.val}px,0px)`;
        }
      }
    },
  }));
  const activeItem = useRef(0);
  const firstItemReached = useRef(true);
  const lastItemReached = useRef(false);
  const mainCarouselWrapperRef = useRef<HTMLDivElement | null>(null);
  const carouselTrackWrapperRef = useRef<HTMLDivElement | null>(null);

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
  const internalItems = getItems();

  const { emitEvent, useListenToCustomEvent } = useEventsModule();
  const { enterFullscreen, exitFullscreen, getIsFullscreen } =
    useFullscreenModule({
      mainCarouselWrapperRef,
      emitEvent,
      handleResize: () => adjustCarouselWrapperPosition(),
    });

  function getItemStyles() {
    if (slideType === "fixed" && !freeScroll) {
      return {
        marginRight: `${gutter}px`,
        flex: `1 0 calc(100% / ${itemsPerSlide} - ${
          (gutter * (itemsPerSlide - 1)) / itemsPerSlide
        }px)`,
      };
    }
    return {
      ...{ marginRight: `${gutter}px` },
    };
  }

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
      if (!freeScroll) {
        activeItem.current = nextActiveItem;
      }
      emitEvent({
        eventName: "onSlideStartChange",
        slideActionType: slideActionType.current,
        slideMode: slideModeType.current,
        nextItem: {
          startReached: firstItemReached.current,
          endReached: lastItemReached.current,
          index: freeScroll ? -1 : activeItem.current,
          id: freeScroll ? "" : items[activeItem.current].id,
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
              startReached: firstItemReached.current,
              endReached: lastItemReached.current,
              index: freeScroll ? -1 : activeItem.current,
              id: freeScroll ? "" : items[activeItem.current].id,
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
        ]
    );
  }
  function getAnimatedWrapperStyles() {
    const percentValue = `calc(100% - ${startEndGutter * 2}px)`;
    return {
      width: carouselSlideAxis === "x" ? percentValue : "100%",
      height: carouselSlideAxis === "y" ? percentValue : "100%",
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
  function adjustCarouselWrapperPosition() {
    const positionProperty = carouselSlideAxis === "x" ? "left" : "top";

    function setPosition(v: number) {
      const ref = carouselTrackWrapperRef.current;
      if (!ref) return;

      if (withLoop) {
        ref.style.top = "0px";
        ref.style.left = "0px";
        ref.style[positionProperty] = `-${v - startEndGutter}px`;
      } else {
        ref.style.left = "0px";
        ref.style.top = "0px";
      }
    }

    if (initialStartingPosition === "center") {
      setPosition(
        getCarouselItemWidth() * items.length -
          getSlideValue() * Math.round((itemsPerSlide - 1) / 2)
      );
    } else if (initialStartingPosition === "end") {
      setPosition(
        getCarouselItemWidth() * items.length -
          getSlideValue() * Math.round(itemsPerSlide - 1)
      );
    } else {
      setPosition(getCarouselItemWidth() * items.length);
    }

    if (!freeScroll && slideType === "fixed") {
      const val = -(getSlideValue() * activeItem.current);
      prevSlidedValue.current = val;
      setSpring.start({
        immediate: true,
        val,
      });
    }
  }

  function getFromValue() {
    if (freeScroll && mainCarouselWrapperRef.current) {
      return mainCarouselWrapperRef.current[
        carouselSlideAxis === "x" ? "scrollLeft" : "scrollTop"
      ];
    }
    return spring.val.get();
  }
  function getToValue(type: "next" | "prev") {
    if (freeScroll && type === "next") {
      const next = prevSlidedValue.current + getSlideValue();
      if (next > getTotalScrollValue()) {
        return getTotalScrollValue();
      }
      return next;
    }

    if (freeScroll && type === "prev") {
      const next = prevSlidedValue.current - getSlideValue();
      if (next < 0) {
        return 0;
      }
      return next;
    }

    if (type === "next") {
      return prevSlidedValue.current - getSlideValue();
    }

    return prevSlidedValue.current + getSlideValue();
  }
  function slideToPrevItem(type: Exclude<SlideMode, "initial"> = "click") {
    if (!init || (firstItemReached.current && !withLoop)) return;

    slideActionType.current = "prev";
    lastItemReached.current = false;

    const nextItem = activeItem.current - 1;

    if (!withLoop) {
      const nextItemWillExceed = getToValue("prev") + getSlideValue() / 3 > 0;

      if (firstItemReached.current) return;
      if (nextItemWillExceed) {
        firstItemReached.current = true;
        lastItemReached.current = false;

        slideToItem({
          slideMode: type,
          from: getFromValue(),
          to: 0,
          nextActiveItem: 0,
        });
        return;
      }
    }

    if (withLoop && firstItemReached.current) {
      firstItemReached.current = false;
      lastItemReached.current = true;
      slideToItem({
        slideMode: type,
        from: getFromValue() - getSlideValue() * items.length,
        to: -(getSlideValue() * items.length) + getSlideValue(),
        nextActiveItem: items.length - 1,
      });
      return;
    }

    if (nextItem === 0) {
      firstItemReached.current = true;
    }
    if (nextItem === items.length - 1 || nextItem === -1) {
      lastItemReached.current = true;
    }
    slideToItem({
      slideMode: type,
      from: getFromValue(),
      to: getToValue("prev"),
      nextActiveItem: nextItem,
    });
  }
  function slideToNextItem(type: Exclude<SlideMode, "initial"> = "click") {
    if (!init || (lastItemReached.current && !withLoop)) return;

    slideActionType.current = "next";
    firstItemReached.current = false;

    const nextItem = activeItem.current + 1;

    if (!withLoop) {
      const nextItemWillExceed =
        Math.abs(getToValue("next")) >
        getTotalScrollValue() - getSlideValue() / 3;

      if (lastItemReached.current) return;
      if (nextItemWillExceed) {
        firstItemReached.current = false;
        lastItemReached.current = true;

        slideToItem({
          slideMode: type,
          from: getFromValue(),
          to: -getTotalScrollValue(),
          nextActiveItem: nextItem,
        });
        return;
      }
    }

    if (withLoop && lastItemReached.current) {
      lastItemReached.current = false;
      firstItemReached.current = true;
      slideToItem({
        slideMode: type,
        from: getFromValue() + getSlideValue() * items.length,
        to: 0,
        nextActiveItem: 0,
      });
      return;
    }

    if (nextItem === 0) {
      firstItemReached.current = true;
    }
    if (nextItem === items.length - 1) {
      lastItemReached.current = true;
    }
    slideToItem({
      slideMode: type,
      from: getFromValue(),
      to: getToValue("next"),
      nextActiveItem: nextItem,
    });
  }

  useEffect(() => {
    adjustCarouselWrapperPosition();
  }, [initialStartingPosition, itemsPerSlide, withLoop]);
  useLayoutEffect(() => {
    /**
     * Set initial track position
     */
    if (carouselTrackWrapperRef.current) {
      adjustCarouselWrapperPosition();
    }
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
      adjustCarouselWrapperPosition();
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

        if (freeScroll) {
          if (slideActionType.current === "prev" && movement > 0) {
            state.cancel();
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
            });
            return;
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
          });
          return;
        }

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

      if (state.last && !state.canceled && freeScroll) {
        if (slideActionType.current === "prev") {
          slideToPrevItem("drag");
        }
        if (slideActionType.current === "next") {
          slideToNextItem("drag");
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
            });
          } else {
            slideToNextItem("drag");
          }
        } else if (prevItemTreshold) {
          if (!withLoop && firstItemReached.current) {
            setSpring.start({
              val: 0,
              config: {
                ...config.default,
                velocity: state.velocity,
              },
            });
          } else {
            slideToPrevItem("drag");
          }
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
      enabled:
        (init && !disableGestures && !freeScroll) ||
        (freeScroll && !!enableFreeScrollDrag),
      axis: carouselSlideAxis,
      from: () => {
        if (freeScroll && mainCarouselWrapperRef.current) {
          return [
            -mainCarouselWrapperRef.current.scrollLeft,
            -mainCarouselWrapperRef.current.scrollTop,
          ];
        }
        if (carouselSlideAxis === "x") {
          return [spring.val.get(), spring.val.get()];
        }
        return [spring.val.get(), spring.val.get()];
      },
    }
  );

  function getWrapperOverflowStyles() {
    if (freeScroll) {
      if (carouselSlideAxis === "x") {
        return {
          overflowX: "auto",
        };
      }
      return {
        overflowY: "auto",
      };
    }
    return {};
  }

  function setStartEndItemReachedOnFreeScroll() {
    if (mainCarouselWrapperRef.current) {
      prevSlidedValue.current =
        mainCarouselWrapperRef.current[
          carouselSlideAxis === "x" ? "scrollLeft" : "scrollTop"
        ];
      if (
        mainCarouselWrapperRef.current[
          carouselSlideAxis === "x" ? "scrollLeft" : "scrollTop"
        ] === 0
      ) {
        firstItemReached.current = true;
        lastItemReached.current = false;
      }
      if (
        mainCarouselWrapperRef.current[
          carouselSlideAxis === "x" ? "scrollLeft" : "scrollTop"
        ] > 0 &&
        mainCarouselWrapperRef.current[
          carouselSlideAxis === "x" ? "scrollLeft" : "scrollTop"
        ] < getTotalScrollValue()
      ) {
        firstItemReached.current = false;
        lastItemReached.current = false;
      }
      if (
        mainCarouselWrapperRef.current[
          carouselSlideAxis === "x" ? "scrollLeft" : "scrollTop"
        ] === getTotalScrollValue()
      ) {
        firstItemReached.current = false;
        lastItemReached.current = true;
      }
    }
  }
  function getScrollHandlers() {
    if (freeScroll) {
      return {
        onWheel(e: React.WheelEvent<HTMLDivElement>) {
          spring.val.stop();
          setStartEndItemReachedOnFreeScroll();
        },
      };
    }
    return {};
  }

  const carouselFragment = (
    <div
      ref={mainCarouselWrapperRef}
      {...getScrollHandlers()}
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        ...(getWrapperOverflowStyles() as React.CSSProperties),
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
    useListenToCustomEvent,
    carouselFragment,
    enterFullscreen,
    exitFullscreen,
    getIsFullscreen,
    slideToPrevItem() {
      slideToPrevItem();
    },
    slideToNextItem() {
      slideToNextItem();
    },
  };
}
