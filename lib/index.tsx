import { ElementRef, useEffect, useId, useRef } from "react";
import { Props } from "./types";
import { useSpring } from "@react-spring/web";
import { useEventsModule } from "./useEventsModule";
import { useDrag } from "@use-gesture/react";
import { SlideActionType } from "./events";

function pFloat(v: number) {
  return parseFloat(v.toFixed(2));
}

export function useSpringCarousel({
  init = true,
  items: _items,
  slideType = "fixed",
  scrollAmount: _scrollAmount,
  withLoop = false,
  enableGestures = true,
  carouselAxis = "x",
  slideWhenDragThresholdIsReached = true,
  itemsPerSlide = 1,
  scrollAmountType = "slide",
}: Props) {
  const items = withLoop
    ? [
        ..._items.map((i) => ({
          ...i,
          id: `prev-repeated-item-${i.id}`,
        })),
        ..._items,
        ..._items.map((i) => ({
          ...i,
          id: `next-repeated-item-${i.id}`,
        })),
      ]
    : _items;

  const scrollAmount = useRef(_scrollAmount);
  const dragTreshold = useRef(0);
  const carouselId = useId().replace(/:/g, "");
  const carouselContainerRef = useRef<ElementRef<"div">>(null);
  const carouselTrackRef = useRef<ElementRef<"div">>(null);
  const currentSlidedValue = useRef(0);

  const startReached = useRef<boolean | undefined>(true);
  const endReached = useRef<boolean | undefined>(false);

  const activeItem = useRef(0);

  const [spring, setSpring] = useSpring(() => ({
    x: 0,
    y: 0,
    onChange({ value }) {
      carouselTrackRef.current!.style.transform = `translateX(${value.x}px)`;
    },
  }));

  const { useListenToCustomEvent, emitEvent } = useEventsModule();

  /**
   * Internal utility helpers
   */
  function getScrollAmount() {
    return pFloat(scrollAmount.current ?? 0);
  }
  function getTotalScrollWidth() {
    return (
      carouselTrackRef.current!.scrollWidth -
      carouselContainerRef.current!.getBoundingClientRect().width
    );
  }

  type SlideToItemProps = {
    total: number;
    type: "prev" | "next";
    actionType: SlideActionType;
  };
  function slideToItemValue({
    total: _total,
    type,
    actionType,
  }: SlideToItemProps) {
    let total = _total;
    let from = spring.x.get();

    startReached.current = false;
    endReached.current = false;

    if (slideType === "fixed") {
      const currentActiveItemIndex = activeItem.current;

      if (type === "prev") {
        activeItem.current = activeItem.current - 1;
      }
      if (type === "next") {
        activeItem.current = activeItem.current + 1;
      }

      if (withLoop) {
        if (type === "next") {
          if (scrollAmountType === "group") {
            const totalGroups = _items.length / itemsPerSlide;
            const nextGroupIsLastGroup =
              Math.round(totalGroups) - 1 === activeItem.current;
            const nextGroupIsFirstGroup =
              Math.round(totalGroups) === activeItem.current;

            if (nextGroupIsLastGroup) {
              endReached.current = true;
            }

            if (nextGroupIsFirstGroup) {
              activeItem.current = 0;

              from = spring.x.get() + getScrollAmount() * totalGroups;
              total = 0;

              endReached.current = false;
              startReached.current = true;
            }
          } else {
            const currentItemIsLastItem =
              _items[activeItem.current]?.id === _items[_items.length - 1].id;
            const nextItemIsRepeatedItem =
              items[_items.length + activeItem.current].id.includes(
                "repeated-item"
              );

            if (currentItemIsLastItem) {
              endReached.current = true;
            }
            if (nextItemIsRepeatedItem) {
              activeItem.current = 0;

              from = spring.x.get() + getScrollAmount() * _items.length;
              total = 0;

              endReached.current = false;
              startReached.current = true;
            }
          }
        }
        if (type === "prev") {
          if (scrollAmountType === "group") {
            const totalGroups = _items.length / itemsPerSlide;
            const nextGroupIsRepeatedLastGroup = activeItem.current === -1;

            if (nextGroupIsRepeatedLastGroup) {
              startReached.current = false;
              endReached.current = true;
              activeItem.current = totalGroups - 1;

              from = spring.x.get() - getScrollAmount() * totalGroups;
              total = -(getScrollAmount() * totalGroups - getScrollAmount());
            }
          } else {
            const currentItemIndex = items.findIndex(
              (i) => i.id === _items[currentActiveItemIndex].id
            );
            const currentItemIsFirstItem =
              _items[activeItem.current]?.id === _items[0].id;
            const nextItemIsRepeatedItem =
              items[currentItemIndex - 1].id.includes("repeated-item");

            if (currentItemIsFirstItem) {
              startReached.current = true;
            }
            if (nextItemIsRepeatedItem) {
              startReached.current = false;
              endReached.current = true;
              activeItem.current = _items.length - 1;

              from = spring.x.get() - getScrollAmount() * _items.length;
              total = -(getScrollAmount() * _items.length - getScrollAmount());
            }
          }
        }
      } else {
        if (activeItem.current === items.length - 1) {
          endReached.current = true;
        } else if (activeItem.current === 0) {
          startReached.current = true;
        } else {
          startReached.current = false;
          endReached.current = false;
        }
        if (scrollAmountType === "group") {
          const totalGroups = _items.length / itemsPerSlide;
          const lastGroupIsNotFilled = 2 % totalGroups !== 0;
          const nextGroupIsLastGroup =
            Math.floor(totalGroups) === activeItem.current;

          if (nextGroupIsLastGroup) {
            endReached.current = true;
            if (lastGroupIsNotFilled) {
              total = -getTotalScrollWidth();
            }
          }
        }
      }

      emitEvent({
        eventName: "onSlideStartChange",
        sliceActionType: actionType,
        slideDirection: type,
        nextItem: {
          index: activeItem.current,
          id: items[activeItem.current].id,
          startReached: startReached.current,
          endReached: endReached.current,
        },
      });
    }
    if (slideType === "fluid") {
      if (type === "next") {
        const nextItemWillExceed = Math.abs(total) > getTotalScrollWidth();

        if (withLoop) {
          const derivedNextActiveItem =
            Math.abs(activeItem.current) / getScrollAmount();
          const isDerivedNextActiveItemLastItem =
            _items[derivedNextActiveItem].id === _items[_items.length - 1].id;

          if (
            _items[derivedNextActiveItem + 1]?.id ===
            _items[_items.length - 1].id
          ) {
            endReached.current = true;
          }

          if (isDerivedNextActiveItemLastItem) {
            activeItem.current = 0;

            from = spring.x.get() + getScrollAmount() * _items.length;
            total = 0;

            endReached.current = false;
            startReached.current = true;
          } else {
            activeItem.current = total;
          }
        }
        if (!withLoop) {
          if (nextItemWillExceed) {
            endReached.current = true;
            total = -getTotalScrollWidth();
          } else {
            startReached.current = false;
            endReached.current = false;
          }
          activeItem.current = total;
        }
      }
      if (type === "prev") {
        const nextItemWillExceed = total > 0;

        const derivedNextActiveItem =
          Math.abs(activeItem.current) / getScrollAmount() - 1;
        const isDerivedNextActiveItemFirstItem = derivedNextActiveItem === -1;

        if (derivedNextActiveItem === 0) {
          startReached.current = true;
        }

        if (withLoop) {
          if (isDerivedNextActiveItemFirstItem) {
            from = spring.x.get() - getScrollAmount() * _items.length;
            total = -(getScrollAmount() * _items.length - getScrollAmount());

            startReached.current = false;
            endReached.current = true;
          }
          activeItem.current = total;
        } else {
          if (nextItemWillExceed) {
            total = 0;
            startReached.current = true;
          } else {
            startReached.current = false;
            endReached.current = false;
          }
          activeItem.current = total;
        }
      }

      emitEvent({
        eventName: "onSlideStartChange",
        sliceActionType: actionType,
        slideDirection: type,
        nextItem: {
          startReached: startReached.current,
          endReached: endReached.current,
          index: 0,
          id: "",
        },
      });
    }

    const parsedFrom = pFloat(from);
    const parsedTotal = pFloat(total);
    currentSlidedValue.current = parsedTotal;

    setSpring.start({
      from: {
        x: parsedFrom,
        y: 0,
      },
      to: {
        x: parsedTotal,
        y: 0,
      },
      onRest({ finished }) {
        if (finished && slideType === "fixed") {
          emitEvent({
            eventName: "onSlideChangeComplete",
            sliceActionType: actionType,
            slideDirection: type,
            currentItem: {
              index: activeItem.current,
              id: items[activeItem.current].id,
              startReached: startReached.current,
              endReached: endReached.current,
            },
          });
        }
        if (finished && slideType === "fluid") {
          emitEvent({
            eventName: "onSlideChangeComplete",
            sliceActionType: actionType,
            slideDirection: type,
            currentItem: {
              index: 0,
              id: "",
              startReached: startReached.current,
              endReached: endReached.current,
            },
          });
        }
      },
    });
  }
  function slideToNextItem(actionType: SlideActionType) {
    if (withLoop && slideType === "fixed") {
      slideToItemValue({
        total: -((activeItem.current + 1) * getScrollAmount()),
        type: "next",
        actionType,
      });
    } else if (slideType === "fixed" && !endReached.current) {
      slideToItemValue({
        total: -((activeItem.current + 1) * getScrollAmount()),
        type: "next",
        actionType,
      });
    } else if (slideType === "fluid") {
      slideToItemValue({
        total: activeItem.current - getScrollAmount(),
        type: "next",
        actionType,
      });
    }
  }
  function slideToPrevItem(actionType: SlideActionType) {
    if (withLoop && slideType === "fixed") {
      slideToItemValue({
        total: -((activeItem.current - 1) * getScrollAmount()),
        type: "prev",
        actionType,
      });
    } else if (slideType === "fixed" && !startReached.current) {
      slideToItemValue({
        total: -((activeItem.current - 1) * getScrollAmount()),
        type: "prev",
        actionType,
      });
    } else if (slideType === "fluid") {
      slideToItemValue({
        total: activeItem.current + getScrollAmount(),
        type: "prev",
        actionType,
      });
    }
  }
  function getCarouselItemWidth() {
    if (itemsPerSlide > 1) {
      return `calc(100% / ${itemsPerSlide}) !important`;
    }
    return "100% !important";
  }

  const bindDrag = useDrag(
    (state) => {
      const isDragging = state.dragging;
      const movement = state.offset[carouselAxis === "x" ? 0 : 1];
      const currentMovement = state.movement[carouselAxis === "x" ? 0 : 1];
      const direction = state.direction[carouselAxis === "x" ? 0 : 1];
      const distance = state.distance[carouselAxis === "x" ? 0 : 1];

      // const dragDirection = direction > 0 ? "next" : "prev";

      const prevItemTresholdReached = currentMovement > dragTreshold.current;
      const nextItemTresholdReached = currentMovement < -dragTreshold.current;

      const velocity = state.velocity;

      if (isDragging) {
        emitEvent({
          ...state,
          eventName: "onDrag",
          slideActionType: "drag",
        });

        setSpring.start({
          x: movement,
          y: 0,
          immediate: true,
          config: {
            velocity: velocity,
          },
        });

        if (
          slideWhenDragThresholdIsReached &&
          (prevItemTresholdReached || nextItemTresholdReached)
        ) {
          state.cancel();
        }
      }

      if (state.last) {
        if (prevItemTresholdReached) {
          slideToPrevItem("drag");
        } else if (nextItemTresholdReached) {
          slideToNextItem("drag");
        } else {
          setSpring.start({
            x: currentSlidedValue.current,
            y: 0,
            config: {
              velocity,
            },
          });
        }
      }
    },
    {
      enabled: enableGestures,
      axis: carouselAxis,
      from: () => {
        return [spring.x.get(), spring.y.get()];
      },
    }
  );

  useEffect(() => {
    function handleSetScrollAmount() {
      const firstItem = carouselTrackRef.current!.children[0] as HTMLElement;
      if (slideType === "fixed" && scrollAmountType === "group") {
        return pFloat(carouselTrackRef.current!.getBoundingClientRect().width);
      }

      return pFloat(firstItem.getBoundingClientRect().width);
    }
    function initCarousel() {
      /**
       * Initial checks
       */
      if (items.length === 0) {
        console.warn(
          "Init is true but no items are available; carousel will not be initialized"
        );
      }

      /**
       * Real carousel initialization
       */
      if (
        (slideType === "fluid" && scrollAmount === undefined) ||
        slideType === "fixed"
      ) {
        scrollAmount.current = handleSetScrollAmount();
      }

      if (withLoop) {
        /**
         * For loop option we set the initial
         * position of the carousel in the middle
         */
        scrollAmount.current = handleSetScrollAmount();

        if (slideType === "fixed" && scrollAmountType === "group") {
          const totalGroups = (_items.length * 3) / itemsPerSlide;
          carouselTrackRef.current!.style.left = `-${pFloat((scrollAmount.current * totalGroups) / 3)}px`;
        } else {
          carouselTrackRef.current!.style.left = `-${pFloat((scrollAmount.current * items.length) / 3)}px`;
        }
      }

      /**
       * Set drag treshold based on scroll amount
       */
      dragTreshold.current = getScrollAmount() / 4;
    }

    if (init) {
      initCarousel();
    }
  }, [scrollAmount, init, slideType, withLoop]);

  const carouselFragment = (
    <>
      <style
        id={`carousel-container-${carouselId}`}
        dangerouslySetInnerHTML={{
          __html: `
            .carousel-${carouselId} {
              display: flex;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            .carousel-${carouselId} .use-spring-carousel-track {
              position: relative;
              display: flex;
              width: 100%;
              touch-action: ${!enableGestures ? "auto" : carouselAxis === "x" ? "pan-y" : "pan-x"};
            }
            .carousel-${carouselId} .use-spring-carousel-item {
              position: relative;
              display: flex;
              flex: 1;
              min-width: ${slideType === "fixed" ? getCarouselItemWidth() : "auto"};
            }
          `.trim(),
        }}
      />
      <div
        className={`use-spring-carousel-container carousel-${carouselId}`}
        ref={carouselContainerRef}
      >
        <div
          className={`use-spring-carousel-track`}
          {...bindDrag()}
          ref={carouselTrackRef}
        >
          {items.map((item, index) => {
            return (
              <div
                key={`${item.id}-${index}`}
                className="use-spring-carousel-item"
                id={item.id}
              >
                {item.renderItem}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  return {
    carouselFragment,
    slideToNextItem: () => slideToNextItem("click"),
    slideToPrevItem: () => slideToPrevItem("click"),
    useListenToCustomEvent,
  };
}
