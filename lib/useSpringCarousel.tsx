import { useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { useEffect, useRef } from "react";

import { Item, Props, SlideActionType } from "./types";
import { useEventsModule } from "./useEventsModule";

type AnimateItem = {
  shouldAnimate?: boolean;
  type: "prev" | "next";
  toIndex?: number;
  actionType: SlideActionType;
};

type ExtendedGroupedItem = Item & { isClonedItem: boolean };

export function useSpringCarousel({
  init = true,
  items,
  withLoop = false,
  id,
  itemsPerSlide = 1,
  gutter = 0,
  startEndGutter = 0,
  carouselAxis = "x",
  slideType = "fixed",
  startingPosition = "start",
  enableGestures = true,
  slideWhenDragThresholdIsReached = true,
  onInit,
}: Props) {
  const carouselIsInitialized = useRef(init);

  const carouselContainerRef = useRef<HTMLDivElement | null>(null);
  const carouselTrackRef = useRef<HTMLDivElement | null>(null);
  const totalScrolledAmount = useRef(0);

  const startReached = useRef<boolean | undefined>(withLoop ? false : true);
  const endReached = useRef<boolean | undefined>(false);
  const dragThreshold = useRef(0);

  const activeItem = useRef(0);

  const [spring, setSpring] = useSpring(
    () => ({
      value: 0,
      onChange({ value }) {
        if (slideType === "fixed" || slideType === "fluid") {
          carouselContainerRef.current!.style.setProperty(
            `--${id}-offset-position`,
            `${value.value}px`,
          );
        }
        if (slideType === "freeScroll") {
          carouselTrackRef.current![
            carouselAxis === "x" ? "scrollLeft" : "scrollTop"
          ] = Math.abs(value.value);
        }
      },
    }),
    [carouselAxis],
  );

  const groupedItems = (
    slideType !== "freeScroll" && withLoop
      ? [
          ...items.map((i) => ({
            ...i,
            id: `prev-repeated-item-${i.id}`,
            isClonedItem: true,
          })),
          ...items,
          ...items.map((i) => ({
            ...i,
            id: `next-repeated-item-${i.id}`,
            isClonedItem: true,
          })),
        ]
      : items
  ) as ExtendedGroupedItem[];

  const { useListenToCustomEvent, emitEvent } = useEventsModule();

  function handleSlideToNextItem(toIndex?: number) {
    if (!carouselIsInitialized.current) return;
    if (endReached.current) return;
    animateItem({
      type: "next",
      toIndex,
      actionType: "click",
    });
  }
  function handleSlideToPrevItem(toIndex?: number) {
    if (!carouselIsInitialized.current) return;
    if (startReached.current) return;
    animateItem({
      type: "prev",
      toIndex,
      actionType: "click",
    });
  }
  function animateItem({
    type,
    shouldAnimate = true,
    toIndex,
    actionType,
  }: AnimateItem) {
    const scrollAmountValue = getScrollAmountValue();
    const immediate = !shouldAnimate;

    startReached.current = false;
    endReached.current = false;

    let fromValue = spring.value.get();
    let toValue = 0;

    if (type === "next") {
      activeItem.current += 1;
    }
    if (type === "prev") {
      if (activeItem.current === 0) {
        activeItem.current = items.length - 1;
      } else {
        activeItem.current -= 1;
      }
    }
    if (toIndex !== undefined) {
      activeItem.current = toIndex;
    }

    if (slideType !== "freeScroll" && type === "next") {
      const totalAvailable = getTotalScrollAvailableSpace(
        withLoop ? scrollAmountValue * (items.length * 2) : 0,
      );

      toValue = -(activeItem.current * scrollAmountValue);

      if (
        totalAvailable - Math.abs(toValue) < scrollAmountValue / 1.2 &&
        slideType === "fluid" &&
        !withLoop
      ) {
        toValue = -totalAvailable;
      }
      if (!withLoop && Math.abs(toValue) >= totalAvailable) {
        endReached.current = true;
        toValue = -totalAvailable;
      }

      if (withLoop && activeItem.current === items.length) {
        activeItem.current = 0;
        fromValue = fromValue + scrollAmountValue * items.length;
        toValue = 0;
      }
    }
    if (slideType !== "freeScroll" && type === "prev") {
      toValue = -(activeItem.current * scrollAmountValue);

      if (activeItem.current === items.length - 1) {
        fromValue = fromValue - items.length * scrollAmountValue;
      }

      if (!withLoop && toValue >= 0) {
        startReached.current = true;
        toValue = 0;
      }
    }

    if (slideType === "freeScroll" && type === "next") {
      const scrollValue =
        carouselTrackRef.current![
          carouselAxis === "x" ? "scrollLeft" : "scrollTop"
        ];
      fromValue = scrollValue;
      toValue = scrollValue + scrollAmountValue;
    }
    if (slideType === "freeScroll" && type === "prev") {
      const scrollValue =
        carouselTrackRef.current![
          carouselAxis === "x" ? "scrollLeft" : "scrollTop"
        ];
      fromValue = scrollValue;
      toValue = scrollValue - scrollAmountValue;
    }

    totalScrolledAmount.current = toValue;

    if (actionType === "resize") {
      emitEvent({
        eventName: "onResize",
        sliceActionType: actionType,
        slideDirection: type,
        currentItem: {
          index: activeItem.current,
          id: items.at(activeItem.current)!.id,
          startReached: startReached.current,
          endReached: endReached.current,
        },
      });
    } else {
      emitEvent({
        eventName: "onSlideStartChange",
        sliceActionType: actionType,
        slideDirection: type,
        nextItem: {
          index: activeItem.current,
          id: items.at(activeItem.current)!.id,
          startReached: startReached.current,
          endReached: endReached.current,
        },
      });
    }

    setSpring.start({
      immediate,
      from: {
        value: fromValue,
      },
      to: {
        value: toValue,
      },
      onRest({ finished }) {
        if (finished && slideType === "fixed") {
          emitEvent({
            eventName: "onSlideChangeComplete",
            sliceActionType: actionType,
            slideDirection: type,
            currentItem: {
              index: activeItem.current,
              id: items.at(activeItem.current)!.id,
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

  function getScrollAmountValue() {
    const firstItem = carouselTrackRef.current!.children[0] as HTMLElement;
    let total = 0;

    total =
      firstItem.getBoundingClientRect()[
        carouselAxis === "x" ? "width" : "height"
      ] + gutter;

    return total;
  }
  function getTotalScrollAvailableSpace(modifier: number) {
    const container = carouselTrackRef.current!;
    const total =
      container[carouselAxis === "x" ? "scrollWidth" : "scrollHeight"] -
      container.getBoundingClientRect()[
        carouselAxis === "x" ? "width" : "height"
      ] -
      modifier;

    return total;
  }

  useEffect(() => {
    function getIndexModifier(
      choice: "start" | "middle-start" | "center" | "middle-end" | "end",
      itemsPerSlide: number,
    ): number {
      switch (choice) {
        case "start":
          return 0;
        case "middle-start":
          return Math.floor((itemsPerSlide - 1) * 0.25);
        case "center":
          return Math.floor((itemsPerSlide - 1) * 0.5);
        case "middle-end":
          return Math.floor((itemsPerSlide - 1) * 0.75);
        case "end":
          return itemsPerSlide - 1;
        default:
          return 0;
      }
    }
    function handleResizeContainer(_onInit?: () => void) {
      if (carouselContainerRef.current) {
        let offset = 0;

        if (withLoop) {
          offset = getScrollAmountValue() * items.length;
        }

        offset -=
          getScrollAmountValue() *
          getIndexModifier(startingPosition, itemsPerSlide);

        offset -= startEndGutter;

        carouselContainerRef.current.style.setProperty(
          `--${id}-offset-modifier`,
          `${-offset}px`,
        );

        if (_onInit) {
          _onInit();
        }
      }
    }

    function handleResize() {
      handleResizeContainer();
      animateItem({
        type: "next",
        toIndex: activeItem.current,
        shouldAnimate: false,
        actionType: "resize",
      });
    }

    if (init) {
      dragThreshold.current = getScrollAmountValue() / 4;
    }

    if (init && slideType === "fixed") {
      handleResizeContainer(onInit);
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [init, withLoop, id, carouselAxis, gutter, startingPosition, slideType]);

  const bindDrag = useDrag(
    (state) => {
      if (!carouselIsInitialized.current) {
        return;
      }

      const isDragging = state.dragging;
      const movement = state.offset[carouselAxis === "x" ? 0 : 1];
      const currentMovement = state.movement[carouselAxis === "x" ? 0 : 1];

      const prevItemTresholdReached = currentMovement > dragThreshold.current;
      const nextItemTresholdReached = currentMovement < -dragThreshold.current;

      const velocity = state.velocity;

      if (isDragging) {
        emitEvent({
          ...state,
          eventName: "onDrag",
          slideActionType: "drag",
        });

        setSpring.start({
          value: movement,
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
          animateItem({
            actionType: "drag",
            type: "prev",
          });
        } else if (nextItemTresholdReached) {
          animateItem({
            actionType: "drag",
            type: "next",
          });
        } else {
          setSpring.start({
            value: totalScrolledAmount.current,
            config: {
              velocity,
            },
          });
        }
      }
    },
    {
      enabled: enableGestures && slideType !== "freeScroll",
      axis: carouselAxis,
      rubberband: !withLoop,
      ...(!withLoop
        ? {
            bounds: () => {
              return {
                right: 0,
                left: -getTotalScrollAvailableSpace(0),
                top: -getTotalScrollAvailableSpace(0),
                bottom: 0,
              };
            },
          }
        : {}),
      from: () => {
        return [spring.value.get(), spring.value.get()];
      },
    },
  );

  const carouselFragment = (
    <div
      ref={carouselContainerRef}
      className="ReactSpringCarouselContainer"
      data-part="Container"
      data-part-internal={`${id}-Container`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            [data-part-internal="${id}-Container"] {
              display: flex;
              width: 100%;
              height: 100%;
              overflow: hidden;
              --${id}-gutter: ${gutter}px;
              --${id}-items-per-slide: ${itemsPerSlide};
              --${id}-offset-position: 0px;
              --${id}-offset-modifier: 0px;
              --${id}-scroll-x-value: ${slideType !== "freeScroll" && carouselAxis === "x" ? `calc(var(--${id}-offset-position) + var(--${id}-offset-modifier))` : "0px"};
              --${id}-scroll-y-value: ${slideType !== "freeScroll" && carouselAxis === "y" ? `calc(var(--${id}-offset-position) + var(--${id}-offset-modifier))` : "0px"};
              --${id}-start-end-gutter: ${startEndGutter * 2}px;
            }
            [data-part-internal="${id}-Track"] {
              display: flex;
              flex-direction: ${carouselAxis === "x" ? "row" : "column"};
              width: 100%;
              height: 100%;
              gap: var(--${id}-gutter);
              transform: translate3d(var(--${id}-scroll-x-value), var(--${id}-scroll-y-value), 0px);
              overflow-x: ${slideType === "freeScroll" ? "auto" : "visible"};
              touch-action: ${
                !enableGestures
                  ? "auto"
                  : carouselAxis === "x"
                    ? "pan-y"
                    : "pan-x"
              };
            }
            [data-part-internal="${id}-Item"] {
              display: flex;
              flex: ${slideType === "fixed" ? `1 0 calc(100% / var(--${id}-items-per-slide) - calc(var(--${id}-gutter) * (var(--${id}-items-per-slide) - 1)) / var(--${id}-items-per-slide) - calc(var(--${id}-start-end-gutter) / var(--${id}-items-per-slide)))` : "1"};
            }
          `,
        }}
      />
      <div
        ref={carouselTrackRef}
        className="ReactSpringCarouselTrack"
        data-part="Track"
        data-part-internal={`${id}-Track`}
        {...bindDrag()}
        {...(slideType === "freeScroll"
          ? {
              onWheel() {
                spring.value.stop();
              },
            }
          : {})}
      >
        {groupedItems.map((item, index) => {
          return (
            <div
              className="ReactSpringCarouselItem"
              data-part="Item"
              key={`${item.id}-${index}`}
              data-part-internal={`${id}-Item`}
              data-id={item.id}
            >
              {typeof item.renderItem === "function"
                ? item.renderItem({
                    useListenToCustomEvent,
                    index,
                    isClonedItem: Boolean(item.isClonedItem),
                  })
                : item.renderItem}
            </div>
          );
        })}
      </div>
    </div>
  );

  return {
    carouselFragment,
    useListenToCustomEvent,
    slideToNextItem: () => handleSlideToNextItem(),
    slideToPrevItem: () => handleSlideToPrevItem(),
    slideToItem: (id: string | number) => {
      if (typeof id === "number") {
        const existingItem = items[id];

        if (!existingItem) {
          console.warn(
            `The item you're trying to slide doesn't exist. index: ${id}`,
          );
          return;
        }

        if (id > activeItem.current) {
          handleSlideToNextItem(id);
        } else {
          handleSlideToPrevItem(id);
        }
      }
      if (typeof id === "string") {
        const index = items.findIndex((i) => i.id === id);

        if (index < 0) {
          console.warn(
            `The item you're trying to slide doesn't exist. id: ${id}`,
          );
          return;
        }

        if (index > activeItem.current) {
          handleSlideToNextItem(index);
        } else {
          handleSlideToPrevItem(index);
        }
      }
    },
  };
}
