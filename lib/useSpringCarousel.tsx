import { useSpring, useSpringRef } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { useEffect, useRef, useState } from "react";

import {
  Item,
  Props,
  ResponsiveItemsPerSlideItem,
  SlideActionType,
} from "./types";
import { useEventsModule } from "./useEventsModule";
import { minifyCSS } from "./utils";

type AnimateItem = {
  shouldAnimate?: boolean;
  type: "prev" | "next" | "resize";
  toIndex?: number;
  actionType: SlideActionType;
};

type ExtendedGroupedItem = Item & { isClonedItem: boolean };

export function useSpringCarousel({
  init = true,
  items,
  withLoop = false,
  id,
  gutter = [{ breakpoint: 0, gutter: 0, startEndGutter: 0 }],
  itemsPerSlide = [{ breakpoint: 0, itemsPerSlide: 1 }],
  carouselAxis = "x",
  startingPosition = "start",
  enableGestures = true,
  slideWhenDragThresholdIsReached = true,
  onInit,
  slideType = "item",
  initialActiveItem = 0,
}: Props) {
  const [initialized, setInitialized] = useState(false);

  const carouselIsInitialized = useRef(init);

  const carouselContainerRef = useRef<HTMLDivElement | null>(null);
  const carouselTrackRef = useRef<HTMLDivElement | null>(null);

  const totalScrolledAmount = useRef(0);
  const scrollAmountValue = useRef(0);

  const startReached = useRef<boolean | undefined>(withLoop ? false : true);
  const endReached = useRef<boolean | undefined>(false);
  const dragThreshold = useRef(0);

  const activeItem = useRef(0);

  const setSpring = useSpringRef();
  const spring = useSpring({
    value: 0,
    ref: setSpring,
    onChange({ value }) {
      const translate =
        carouselAxis === "x"
          ? `translate3d(calc(${value.value}px + var(--${id}-offset-modifier)), 0px, 0px)`
          : `translate3d(0px, calc(${value.value}px + var(--${id}-offset-modifier)), 0px)`;
      carouselTrackRef.current!.style.transform = translate;
    },
  });

  const groupedItems = (
    withLoop
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

  function getGutter() {
    const { totalGutterCssVar } = getCssVars();
    return totalGutterCssVar;
  }

  function getItemsPerSlide() {
    if (carouselContainerRef.current) {
      const computedStyle = window.getComputedStyle(
        carouselContainerRef.current,
      );
      const itemsPerSlideCssVar = computedStyle
        .getPropertyValue(`--${id}-items-per-slide`)
        .trim();

      return Number(itemsPerSlideCssVar) || 1;
    }
    return 1;
  }

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

    if (type === "next") {
      const totalAvailable = getTotalScrollAvailableSpace(
        withLoop ? scrollAmountValue.current * (items.length * 2) : 0,
      );

      toValue = -(activeItem.current * scrollAmountValue.current);

      if (withLoop && activeItem.current === items.length) {
        activeItem.current = 0;
        fromValue = fromValue + scrollAmountValue.current * items.length;
        toValue = 0;
      }

      if (
        !withLoop &&
        (Math.abs(toValue) >= totalAvailable ||
          activeItem.current === items.length - 1)
      ) {
        endReached.current = true;
        toValue = -totalAvailable;
      }
    }
    if (type === "prev") {
      toValue = -(activeItem.current * scrollAmountValue.current);

      if (activeItem.current === items.length - 1) {
        fromValue = fromValue - items.length * scrollAmountValue.current;
      }

      if (!withLoop && toValue >= 0) {
        startReached.current = true;
        toValue = 0;
      }
    }

    totalScrolledAmount.current = toValue;

    if (actionType === "resize") {
      toValue = -(activeItem.current * scrollAmountValue.current);
      emitEvent({
        eventName: "onResize",
        sliceActionType: actionType,
        slideDirection: type,
        currentItem: {
          index: activeItem.current,
          id: items.at(activeItem.current)?.id ?? "",
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
          id: items.at(activeItem.current)?.id ?? "",
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
      onChange({ value }) {
        const translate =
          carouselAxis === "x"
            ? `translate3d(calc(${value.value}px + var(--${id}-offset-modifier)), 0px, 0px)`
            : `translate3d(0px, calc(${value.value}px + var(--${id}-offset-modifier)), 0px)`;
        carouselTrackRef.current!.style.transform = translate;
      },
      onRest({ finished }) {
        if (finished) {
          emitEvent({
            eventName: "onSlideChangeComplete",
            sliceActionType: actionType,
            slideDirection: type,
            currentItem: {
              index: activeItem.current,
              id: items.at(activeItem.current)?.id ?? "",
              startReached: startReached.current,
              endReached: endReached.current,
            },
          });
        }
      },
    });
  }

  function getScrollAmountValue() {
    const container = carouselTrackRef.current!;
    let total = 0;

    if (slideType === "item") {
      total =
        container.children[0].getBoundingClientRect()[
          carouselAxis === "x" ? "width" : "height"
        ] + getGutter();
    } else {
      total =
        container.getBoundingClientRect()[
          carouselAxis === "x" ? "width" : "height"
        ] + getGutter();
    }

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
  function getCssVars() {
    let totalStartEndGutterCssVar = 0;
    let totalGutterCssVar = 0;

    if (carouselContainerRef.current) {
      const computedStyle = window.getComputedStyle(
        carouselContainerRef.current,
      );

      const startEndGutterCssVar = computedStyle
        .getPropertyValue(`--${id}-start-end-gutter`)
        .trim();

      if (startEndGutterCssVar.includes("px")) {
        totalStartEndGutterCssVar = Number(
          startEndGutterCssVar.replace("px", ""),
        );
      }

      const gutterCssVar = computedStyle
        .getPropertyValue(`--${id}-gutter`)
        .trim();

      if (gutterCssVar.includes("px")) {
        totalGutterCssVar = Number(gutterCssVar.replace("px", ""));
      }
    }

    return { totalStartEndGutterCssVar, totalGutterCssVar };
  }

  useEffect(() => {
    function getIndexModifier(
      choice: "start" | "middle-start" | "center" | "middle-end" | "end",
    ): number {
      const currentItemsPerSlide = getItemsPerSlide();

      switch (choice) {
        case "start":
          return 0;
        case "middle-start":
          return Math.floor((currentItemsPerSlide - 1) * 0.25);
        case "center":
          return Math.floor((currentItemsPerSlide - 1) * 0.5);
        case "middle-end":
          return Math.floor((currentItemsPerSlide - 1) * 0.75);
        case "end":
          return currentItemsPerSlide - 1;
        default:
          return 0;
      }
    }
    function setValues() {
      scrollAmountValue.current = getScrollAmountValue();

      console.log("scrollAmountValue", scrollAmountValue.current);
      dragThreshold.current = scrollAmountValue.current / 4;

      const { totalStartEndGutterCssVar } = getCssVars();

      let offset = 0;

      if (withLoop) {
        offset = scrollAmountValue.current * items.length;
      }

      offset -= scrollAmountValue.current * getIndexModifier(startingPosition);

      offset -= totalStartEndGutterCssVar / 2;
      console.log({
        mod1: scrollAmountValue.current * items.length,
        mod2: scrollAmountValue.current * getIndexModifier(startingPosition),
        mod3: totalStartEndGutterCssVar / 2,
      });

      carouselContainerRef.current!.style.setProperty(
        `--${id}-offset-modifier`,
        `${-offset}px`,
      );
    }
    function handleInitCarousel(_onInit?: () => void) {
      if (carouselContainerRef.current) {
        setValues();
        setInitialized(true);
        if (_onInit) {
          _onInit();
        }
      }
    }
    function handleResize() {
      handleInitCarousel();
      animateItem({
        type: "resize",
        toIndex: activeItem.current,
        shouldAnimate: false,
        actionType: "resize",
      });
    }

    if (init) {
      carouselIsInitialized.current = true;
      handleInitCarousel(onInit);
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [init, withLoop, id, carouselAxis, gutter, startingPosition]);

  useEffect(() => {
    if (init && initialActiveItem !== activeItem.current) {
      animateItem({
        type: "next",
        toIndex: initialActiveItem,
        actionType: "resize",
        shouldAnimate: false,
      });
    }
  }, [init, initialActiveItem]);

  const shouldEnableGestures = enableGestures;

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
          onChange({ value }) {
            const translate =
              carouselAxis === "x"
                ? `translate3d(calc(${value.value}px + var(--${id}-offset-modifier)), 0px, 0px)`
                : `translate3d(0px, calc(${value.value}px + var(--${id}-offset-modifier)), 0px)`;
            carouselTrackRef.current!.style.transform = translate;
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
          state.cancel();
        } else if (nextItemTresholdReached) {
          animateItem({
            actionType: "drag",
            type: "next",
          });
          state.cancel();
        } else {
          setSpring.start({
            value: totalScrolledAmount.current,
            config: {
              velocity,
            },
            onChange({ value }) {
              const translate =
                carouselAxis === "x"
                  ? `translate3d(calc(${value.value}px + var(--${id}-offset-modifier)), 0px, 0px)`
                  : `translate3d(0px, calc(${value.value}px + var(--${id}-offset-modifier)), 0px)`;
              carouselTrackRef.current!.style.transform = translate;
            },
          });
          state.cancel();
        }
      }
    },
    {
      enabled: shouldEnableGestures,
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

  function handleIsActiveItem(itemId: string | number) {
    return typeof itemId === "number"
      ? activeItem.current === itemId
      : items.find((i) => i.id === itemId)?.id ===
          items[activeItem.current]?.id;
  }

  const carouselFragment = (
    <div
      ref={carouselContainerRef}
      className="ReactSpringCarouselContainer"
      data-part="Container"
      data-part-internal={`${id}-Container`}
      {...bindDrag()}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: minifyCSS(`
            [data-part-internal="${id}-Container"] {
              display: flex;
              width: 100%;
              height: 100%;
              overflow: hidden;
              --${id}-items-per-slide: 1;
              --${id}-offset-position: 0px;
              --${id}-offset-modifier: 0px;
              --${id}-scroll-x-value: ${carouselAxis === "x" ? `calc(var(--${id}-offset-position) + var(--${id}-offset-modifier))` : "0px"};
              --${id}-scroll-y-value: ${carouselAxis === "y" ? `calc(var(--${id}-offset-position) + var(--${id}-offset-modifier))` : "0px"};
              --${id}-gutter: 0px;
              --${id}-start-end-gutter: 0px;
              touch-action: ${!shouldEnableGestures ? "auto" : carouselAxis === "x" ? "pan-y" : "pan-x"};
            }
            [data-part-internal="${id}-Track"] {
              display: flex;
              position: relative;
              --initial-offset-modifier: calc(calc(-100% - var(--${id}-gutter) + calc(var(--${id}-start-end-gutter) / 2 / ${items.length} * var(--${id}-items-per-slide)) + var(--${id}-start-end-gutter)) * ${items.length} / var(--${id}-items-per-slide));
              left: ${withLoop && carouselAxis === "x" && !initialized ? "var(--initial-offset-modifier)" : "0px"};
              top: ${withLoop && carouselAxis === "y" && !initialized ? "var(--initial-offset-modifier)" : "0px"};
              flex-direction: ${carouselAxis === "x" ? "row" : "column"};
              width: 100%;
              height: 100%;
              gap: var(--${id}-gutter);
              transform: translate3d(var(--${id}-scroll-x-value), var(--${id}-scroll-y-value), 0px);
            }
            [data-part-internal="${id}-Item"] {
              display: flex;
              flex: 1 0 calc(100% / var(--${id}-items-per-slide) - calc(var(--${id}-gutter) * (var(--${id}-items-per-slide) - 1)) / var(--${id}-items-per-slide) - calc(var(--${id}-start-end-gutter) / var(--${id}-items-per-slide)));
            }
            ${
              gutter && gutter.length > 0
                ? gutter
                    .sort((a, b) => a.breakpoint - b.breakpoint)
                    .map(
                      (item) => `
                  @media ${item.media || `(min-width: ${item.breakpoint}px)`} {
                    [data-part-internal="${id}-Container"] {
                      --${id}-gutter: ${item.gutter || 0}px;
                      --${id}-start-end-gutter: ${(item.startEndGutter || 0) * 2}px;
                    }
                  }
                `,
                    )
                    .join("")
                : ""
            }
            ${
              itemsPerSlide && itemsPerSlide.length > 0
                ? itemsPerSlide
                    .sort((a, b) => a.breakpoint - b.breakpoint)
                    .map(
                      (item: ResponsiveItemsPerSlideItem) => `
                  @media ${item.media || `(min-width: ${item.breakpoint}px)`} {
                    [data-part-internal="${id}-Container"] {
                      --${id}-items-per-slide: ${item.itemsPerSlide || 1};
                    }
                  }
                `,
                    )
                    .join("")
                : ""
            }
          `),
        }}
      />
      <div
        ref={carouselTrackRef}
        className="ReactSpringCarouselTrack"
        data-part="Track"
        data-part-internal={`${id}-Track`}
        onScroll={() => {
          startReached.current = false;
          endReached.current = false;
        }}
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
                    isActiveItem: handleIsActiveItem,
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
