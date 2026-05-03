import { useSpring, useSpringRef } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { computeAnimationTarget, getTrackTransform } from "./animation";
import {
  Props,
  ResponsiveItemsPerSlideItem,
  SlideActionType,
  SpringCarouselEvents,
} from "./types";
import { useEventsModule } from "./useEventsModule";

type AnimateItem = {
  shouldAnimate?: boolean;
  type: "prev" | "next" | "resize";
  toIndex?: number;
  actionType: SlideActionType;
};

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
  slideType = "item",
  initialActiveItem = 0,
  renderWindow,
  renderPlaceholder,
}: Props) {
  const [initialized, setInitialized] = useState(false);
  const [, setRenderTick] = useState(0);

  const carouselIsInitialized = useRef(init);

  const carouselContainerRef = useRef<HTMLDivElement | null>(null);
  const carouselTrackRef = useRef<HTMLDivElement | null>(null);

  const totalScrolledAmount = useRef(0);
  const scrollAmountValue = useRef(0);

  const startReached = useRef<boolean | undefined>(withLoop ? false : true);
  const endReached = useRef<boolean | undefined>(false);
  const dragThreshold = useRef(0);

  const activeItem = useRef(0);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const withLoopRef = useRef(withLoop);
  withLoopRef.current = withLoop;

  const hasEmittedInit = useRef(false);

  const pendingDragPayload = useRef<SpringCarouselEvents | null>(null);
  const dragRafId = useRef<number | null>(null);

  function resolveInitialIndex(value: number | string | undefined): number {
    if (value === undefined) return 0;
    if (typeof value === "number") {
      const existingItem = items[value];
      if (!existingItem) {
        console.warn(
          `initialActiveItem: item at index ${value} doesn't exist.`,
        );
        return 0;
      }
      return value;
    }
    const index = items.findIndex((i) => i.id === value);
    if (index < 0) {
      console.warn(`initialActiveItem: item with id "${value}" doesn't exist.`);
      return 0;
    }
    return index;
  }

  const setSpring = useSpringRef();
  const spring = useSpring({
    value: 0,
    ref: setSpring,
    onChange({ value }) {
      carouselTrackRef.current!.style.transform = getTrackTransform(
        value.value,
        carouselAxis,
        id,
      );
    },
  });

  const trackLength = withLoop ? items.length * 3 : items.length;

  const { useListenToCustomEvent, emitEvent } = useEventsModule();

  function resolveActiveResponsive<
    T extends { breakpoint: number; media?: string },
  >(arr: T[] | undefined): T | null {
    if (!arr || arr.length === 0) return null;
    let best: T | null = null;
    let bestBreakpoint = -Infinity;
    for (const entry of arr) {
      const matches = entry.media
        ? window.matchMedia(entry.media).matches
        : window.innerWidth >= entry.breakpoint;
      if (matches && entry.breakpoint >= bestBreakpoint) {
        best = entry;
        bestBreakpoint = entry.breakpoint;
      }
    }
    return best;
  }

  function getGutter() {
    const { totalGutterCssVar } = getCssVars();
    return totalGutterCssVar;
  }

  function getItemsPerSlide() {
    const matched = resolveActiveResponsive(itemsPerSlide);
    return matched?.itemsPerSlide || 1;
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

    const target = computeAnimationTarget({
      type,
      actionType,
      toIndex,
      currentActive: activeItem.current,
      itemsLength: items.length,
      withLoop,
      scrollAmount: scrollAmountValue.current,
      totalAvailable:
        type === "next"
          ? getTotalScrollAvailableSpace(
              withLoop ? scrollAmountValue.current * (items.length * 2) : 0,
            )
          : 0,
      fromValueRaw: spring.value.get(),
    });

    activeItem.current = target.newActive;
    startReached.current = target.startReached;
    endReached.current = target.endReached;
    totalScrolledAmount.current = target.toValue;

    if (renderWindow !== undefined) {
      setRenderTick((t) => t + 1);
    }

    if (actionType === "resize") {
      emitEvent({
        eventName: "onResize",
        sliceActionType: actionType,
        slideDirection: type,
        currentItem: {
          id: items.at(target.logicalIndex)?.id ?? "",
          index: target.logicalIndex,
          trackIndex: target.realTrackIndex,
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
          index: target.logicalIndex,
          id: items.at(target.logicalIndex)?.id ?? "",
          trackIndex: target.realTrackIndex,
          startReached: startReached.current,
          endReached: endReached.current,
        },
      });
    }

    setSpring.start({
      immediate,
      from: { value: target.fromValue },
      to: { value: target.toValue },
      onChange({ value }) {
        carouselTrackRef.current!.style.transform = getTrackTransform(
          value.value,
          carouselAxis,
          id,
        );
      },
      onRest({ finished }) {
        if (finished) {
          const logicalIndex = withLoop
            ? activeItem.current % items.length
            : activeItem.current;
          const realTrackIndex = withLoop
            ? items.length + (activeItem.current % items.length)
            : activeItem.current;
          emitEvent({
            eventName: "onSlideChangeComplete",
            sliceActionType: actionType,
            slideDirection: type,
            currentItem: {
              index: logicalIndex,
              id: items.at(logicalIndex)?.id ?? "",
              trackIndex: realTrackIndex,
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
    const matched = resolveActiveResponsive(gutter);
    return {
      totalGutterCssVar: matched?.gutter || 0,
      totalStartEndGutterCssVar: (matched?.startEndGutter || 0) * 2,
    };
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

      dragThreshold.current = scrollAmountValue.current / 4;

      const { totalStartEndGutterCssVar } = getCssVars();

      let offset = 0;

      if (withLoop) {
        offset = scrollAmountValue.current * items.length;
      }

      offset -= scrollAmountValue.current * getIndexModifier(startingPosition);
      offset -= totalStartEndGutterCssVar / 2;

      carouselContainerRef.current!.style.setProperty(
        `--${id}-offset-modifier`,
        `${-offset}px`,
      );
    }
    function handleInitCarousel(shouldEmitInit?: boolean) {
      if (carouselContainerRef.current) {
        setValues();
        setInitialized(true);
        if (shouldEmitInit) {
          const index = resolveInitialIndex(initialActiveItem);
          const trackIndex = withLoop
            ? items.length + (index % items.length)
            : index;
          emitEvent({ eventName: "onInit", index, trackIndex });
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

      if (!hasEmittedInit.current) {
        handleInitCarousel(true);
        hasEmittedInit.current = true;
      } else {
        handleResize();
      }

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [init, id, carouselAxis, withLoop]);

  useEffect(() => {
    const resolvedIndex = resolveInitialIndex(initialActiveItem);
    if (init && resolvedIndex !== activeItem.current) {
      animateItem({
        type: "next",
        toIndex: resolvedIndex,
        actionType: "resize",
        shouldAnimate: false,
      });
    }
  }, [init, initialActiveItem]);

  const shouldEnableGestures = enableGestures;

  function flushPendingDrag() {
    if (dragRafId.current !== null) {
      cancelAnimationFrame(dragRafId.current);
      dragRafId.current = null;
    }
    if (pendingDragPayload.current) {
      const payload = pendingDragPayload.current;
      pendingDragPayload.current = null;
      emitEvent(payload);
    }
  }

  function scheduleDragEmit(payload: SpringCarouselEvents) {
    pendingDragPayload.current = payload;
    if (dragRafId.current === null) {
      dragRafId.current = requestAnimationFrame(() => {
        dragRafId.current = null;
        const p = pendingDragPayload.current;
        pendingDragPayload.current = null;
        if (p) emitEvent(p);
      });
    }
  }

  useEffect(
    () => () => {
      if (dragRafId.current !== null) {
        cancelAnimationFrame(dragRafId.current);
        dragRafId.current = null;
      }
      pendingDragPayload.current = null;
    },
    [],
  );

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
        scheduleDragEmit({
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
            carouselTrackRef.current!.style.transform = getTrackTransform(
              value.value,
              carouselAxis,
              id,
            );
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
        flushPendingDrag();
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
              carouselTrackRef.current!.style.transform = getTrackTransform(
                value.value,
                carouselAxis,
                id,
              );
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

  const handleIsActiveItem = useCallback((itemId: string | number) => {
    const items = itemsRef.current;
    const withLoop = withLoopRef.current;
    const realTrackIndex = withLoop
      ? items.length + (activeItem.current % items.length)
      : activeItem.current;
    if (typeof itemId === "number") return realTrackIndex === itemId;
    const logicalIndex = activeItem.current % items.length;
    return itemId === items[logicalIndex]?.id;
  }, []);

  const isNextItemFns = useMemo(
    () =>
      Array.from({ length: items.length }, (_, i) => () => {
        const logicalActive = withLoop
          ? activeItem.current % items.length
          : activeItem.current;
        if (withLoop) {
          return i === (logicalActive + 1) % items.length;
        }
        if (logicalActive + 1 >= items.length) return false;
        return i === logicalActive + 1;
      }),
    [items.length, withLoop],
  );

  const isPrevItemFns = useMemo(
    () =>
      Array.from({ length: items.length }, (_, i) => () => {
        const logicalActive = withLoop
          ? activeItem.current % items.length
          : activeItem.current;
        if (withLoop) {
          return i === (logicalActive - 1 + items.length) % items.length;
        }
        if (logicalActive - 1 < 0) return false;
        return i === logicalActive - 1;
      }),
    [items.length, withLoop],
  );

  const css = useMemo(
    () =>
      `
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
                    .slice()
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
                    .slice()
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
          `,
    [
      id,
      carouselAxis,
      shouldEnableGestures,
      items.length,
      withLoop,
      initialized,
      gutter,
      itemsPerSlide,
    ],
  );

  const carouselFragment = (
    <div
      ref={carouselContainerRef}
      className="ReactSpringCarouselContainer"
      data-part="Container"
      data-part-internal={`${id}-Container`}
      {...bindDrag()}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
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
        {Array.from({ length: trackLength }, (_, index) => {
          const itemLogicalIndex = withLoop ? index % items.length : index;
          const item = items[itemLogicalIndex];
          const isClonedItem =
            withLoop && (index < items.length || index >= items.length * 2);

          if (renderWindow !== undefined) {
            const trackCenter = withLoop
              ? items.length + (activeItem.current % items.length)
              : activeItem.current;
            const distance = Math.abs(index - trackCenter);
            if (distance > renderWindow) {
              return (
                <div
                  className="ReactSpringCarouselItem"
                  data-part="Item"
                  key={`${item.id}-${index}`}
                  data-part-internal={`${id}-Item`}
                  data-id={item.id}
                  aria-hidden="true"
                >
                  {renderPlaceholder?.({ item, index, isClonedItem })}
                </div>
              );
            }
          }

          const isNextItem = isNextItemFns[itemLogicalIndex];
          const isPrevItem = isPrevItemFns[itemLogicalIndex];

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
                    isClonedItem,
                    isActiveItem: handleIsActiveItem,
                    isNextItem,
                    isPrevItem,
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
