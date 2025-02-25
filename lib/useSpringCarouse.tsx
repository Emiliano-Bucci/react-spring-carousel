import { Controller, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { useEffect, useId, useRef, useState } from "react";

import { Props, SlideActionType } from "./types";
import { useEventsModule } from "./useEventsModule";
import { isOutOfViewport, logWarn, pFloat } from "./utils";

function optimizeCss(cssString: string) {
  if (!cssString || cssString.trim() === "") return "";

  // Process the string in a single pass
  let result = "";
  let inTemplateVar = false;
  let skipNextSpace = true; // Start by skipping spaces

  // Iterate through each character only once
  for (let i = 0; i < cssString.length; i++) {
    const char = cssString[i];

    // Handle template literals
    if (char === "$" && cssString[i + 1] === "{") {
      inTemplateVar = true;
      result += char;
      continue;
    }

    if (inTemplateVar && char === "}") {
      inTemplateVar = false;
      result += char;
      skipNextSpace = true;
      continue;
    }

    // Always keep characters inside template literals
    if (inTemplateVar) {
      result += char;
      continue;
    }

    // Handle whitespace
    if (/\s/.test(char)) {
      // Skip consecutive spaces
      if (skipNextSpace) continue;

      // Look ahead to see if we should add this space
      let j = i + 1;
      while (j < cssString.length && /\s/.test(cssString[j])) j++;

      // If next non-space char is one we don't need space before, skip this space
      if (j < cssString.length && /[{:;,}]/.test(cssString[j])) {
        continue;
      }

      // Add only one space
      result += " ";
      skipNextSpace = true;
      continue;
    }

    // After adding a character like { : ; ,
    // we want to skip the next space
    if (/[{:;,]/.test(char)) {
      skipNextSpace = true;
    } else {
      skipNextSpace = false;
    }

    // Add the current character
    result += char;
  }

  return result;
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
  scrollAmountType: _scrollAmountType,
  fadeIn = false,
  initialActiveItem,
}: Props) {
  const [carouselIsInitialized, setCarouselIsInitialized] = useState(false);
  const errorMessages = useRef<string[]>([]);
  const windowIsHidden = useRef(false);

  const itemsPerSlide = useRef(0);
  const scrollAmountType = _scrollAmountType ?? "slide";

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
  const carouselContainerRef = useRef<HTMLDivElement | null>(null);
  const carouselTrackRef = useRef<HTMLDivElement | null>(null);
  const currentSlidedValue = useRef(0);

  const startReached = useRef<boolean | undefined>(true);
  const endReached = useRef<boolean | undefined>(false);

  const activeItem = useRef(0);

  const [spring, setSpring] = useSpring(
    () => ({
      value: 0,
      onChange({ value }) {
        if (slideType === "fixed" || slideType === "fluid") {
          if (carouselAxis === "x") {
            carouselTrackRef.current!.style.setProperty(
              "--scroll-x-value",
              `${value.value}px`,
            );
          } else {
            carouselTrackRef.current!.style.setProperty(
              "--scroll-y-value",
              `${value.value}px`,
            );
          }
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

  const { useListenToCustomEvent, emitEvent } = useEventsModule();

  /**
   * Internal utility helpers
   */
  function getScrollAmount() {
    const { totalStartEndGutterCssVar } = getCssVars();

    return pFloat(scrollAmount.current ?? 0 - totalStartEndGutterCssVar);
  }
  function getTotalScrollAvailableSpace() {
    return (
      carouselTrackRef.current![
        carouselAxis === "x" ? "scrollWidth" : "scrollHeight"
      ] -
      carouselContainerRef.current!.getBoundingClientRect()[
        carouselAxis === "x" ? "width" : "height"
      ]
    );
  }
  function handleAppNotInitialized(message?: string) {
    if (message) {
      errorMessages.current.push(message);
    }
    logWarn("The carousel can't be initialized. List of errors:");
    console.table(errorMessages.current);
  }
  function getScrollHandlers() {
    if (slideType === "freeScroll") {
      return {
        onWheel() {
          spring.value.stop();
          // setStartEndItemReachedOnFreeScroll()
        },
        onScroll(e: React.UIEvent<HTMLDivElement, UIEvent>) {
          const target = e.currentTarget;
          const scrollValue =
            carouselAxis === "x" ? target.scrollLeft : target.scrollTop;
          const availableScrollSpace =
            carouselAxis === "x"
              ? target.scrollWidth - target.clientWidth
              : target.scrollHeight - target.clientHeight;

          if (scrollValue === 0) {
            startReached.current = true;
          } else if (scrollValue === availableScrollSpace) {
            endReached.current = true;
          } else {
            startReached.current = false;
            endReached.current = false;
          }
        },
      };
    }
    return {};
  }
  function getCssVars() {
    let totalGutterCssVar = 0;
    let totalStartEndGutterCssVar = 0;
    let itemsPerSlide = 0;

    const startEndGutterCssVar = getComputedStyle(
      document.documentElement,
    ).getPropertyValue(`--${carouselId}-react-spring-carousel-item-gutter`);
    const itemsPerSlideCssVar = getComputedStyle(
      document.documentElement,
    ).getPropertyValue(`--${carouselId}-react-spring-carousel-items-per-slide`);
    const gutterCssVar = getComputedStyle(
      document.documentElement,
    ).getPropertyValue(`--${carouselId}-react-spring-carousel-item-gutter`);

    if (gutterCssVar.includes("px")) {
      totalGutterCssVar = Number(gutterCssVar.replace("px", ""));
    }
    itemsPerSlide = Number(itemsPerSlideCssVar) || 1;
    if (startEndGutterCssVar.includes("px")) {
      totalStartEndGutterCssVar = Number(
        startEndGutterCssVar.replace("px", ""),
      );
    }

    return { totalGutterCssVar, totalStartEndGutterCssVar, itemsPerSlide };
  }

  type SlideToItemProps = {
    type: "prev" | "next";
    actionType: SlideActionType;
    newActiveItem?: number;
    shouldAnimate?: boolean;
  };
  function slideToItemValue({
    type,
    actionType,
    newActiveItem,
    shouldAnimate = true,
  }: SlideToItemProps) {
    let total = 0;
    let from = spring.value.get();

    startReached.current = false;
    endReached.current = false;

    if (slideType === "fixed") {
      const currentActiveItemIndex = activeItem.current;

      if (type === "prev") {
        activeItem.current = newActiveItem ?? activeItem.current - 1;
      }
      if (type === "next") {
        activeItem.current = newActiveItem ?? activeItem.current + 1;
      }

      if (
        withLoop &&
        scrollAmountType === "group" &&
        itemsPerSlide.current > 1 &&
        type === "next"
      ) {
        const totalGroups = _items.length / itemsPerSlide.current;
        const nextGroupIsLastGroup =
          Math.ceil(totalGroups) - 1 === activeItem.current;
        const nextGroupIsFirstGroup =
          Math.ceil(totalGroups) === activeItem.current;

        if (nextGroupIsLastGroup) {
          endReached.current = true;
        }

        total = -(activeItem.current * getScrollAmount());

        if (nextGroupIsFirstGroup) {
          activeItem.current = 0;

          from = spring.value.get() + getScrollAmount() * totalGroups;
          total = 0;

          endReached.current = false;
          startReached.current = true;
        }
      }

      if (
        withLoop &&
        scrollAmountType === "group" &&
        itemsPerSlide.current > 1 &&
        type === "prev"
      ) {
        const totalGroups = _items.length / itemsPerSlide.current;
        const isFirstGroup = activeItem.current === 0;
        const nextGroupIsRepeatedLastGroup = activeItem.current === -1;

        total = -(activeItem.current * getScrollAmount());

        if (isFirstGroup) {
          startReached.current = true;
        }

        if (nextGroupIsRepeatedLastGroup) {
          startReached.current = false;
          endReached.current = true;
          activeItem.current = totalGroups - 1;

          from = spring.value.get() - getScrollAmount() * totalGroups;
          total = -getScrollAmount() * totalGroups + getScrollAmount();
        }
      }

      if (
        !withLoop &&
        scrollAmountType === "group" &&
        itemsPerSlide.current > 1
      ) {
        const totalGroups = _items.length / itemsPerSlide.current;
        const lastGroupIsNotFilled = 2 % totalGroups !== 0;
        const nextGroupIsLastGroup =
          Math.ceil(totalGroups - 1) === activeItem.current;
        const nextGroupIsFirstGroup = activeItem.current === 0;

        total = -(activeItem.current * getScrollAmount());

        if (nextGroupIsFirstGroup) {
          startReached.current = true;
        }
        if (nextGroupIsLastGroup) {
          endReached.current = true;
          if (lastGroupIsNotFilled) {
            total = -getTotalScrollAvailableSpace();
          }
        }
      }

      if (
        withLoop &&
        type === "next" &&
        (scrollAmountType === "slide" ||
          (scrollAmountType === "group" && itemsPerSlide.current === 1))
      ) {
        const currentItemIsLastItem =
          _items[activeItem.current]?.id === _items[_items.length - 1].id;
        const nextItemIsRepeatedItem =
          items[_items.length + activeItem.current].id.includes(
            "repeated-item",
          );

        if (currentItemIsLastItem) {
          endReached.current = true;
        }
        if (nextItemIsRepeatedItem) {
          activeItem.current = 0;

          from = spring.value.get() + getScrollAmount() * _items.length;

          endReached.current = false;
          startReached.current = true;
        }

        total = -(activeItem.current * getScrollAmount());
      }

      if (
        withLoop &&
        type === "prev" &&
        (scrollAmountType === "slide" ||
          (scrollAmountType === "group" && itemsPerSlide.current === 1))
      ) {
        const currentItemIndex = items.findIndex(
          (i) => i.id === _items[currentActiveItemIndex].id,
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

          from = spring.value.get() - getScrollAmount() * _items.length;
        }
        total = -(activeItem.current * getScrollAmount());
      }

      if (!withLoop && scrollAmountType === "slide") {
        const nextItemIsLastItem =
          _items[activeItem.current + 1]?.id === _items[_items.length - 1].id;

        if (nextItemIsLastItem) {
          endReached.current = true;
        } else if (activeItem.current === 0) {
          startReached.current = true;
        } else {
          startReached.current = false;
          endReached.current = false;
        }

        total = -(activeItem.current * getScrollAmount());

        if (
          type === "next" &&
          Math.abs(total) > getTotalScrollAvailableSpace()
        ) {
          endReached.current = true;
          total = -getTotalScrollAvailableSpace();
        }
      }

      emitEvent({
        eventName: "onSlideStartChange",
        sliceActionType: actionType,
        slideDirection: type,
        nextItem: {
          index: activeItem.current,
          id: _items[activeItem.current].id,
          startReached: startReached.current,
          endReached: endReached.current,
        },
      });
    }
    if (slideType === "fluid") {
      if (type === "prev") {
        activeItem.current = newActiveItem ?? activeItem.current - 1;
      }
      if (type === "next") {
        activeItem.current = newActiveItem ?? activeItem.current + 1;
      }
      total = -(activeItem.current * getScrollAmount());

      if (type === "next" && withLoop) {
        const nextItemIsLastItem =
          _items[activeItem.current]?.id === _items[_items.length - 1].id;
        const nextItemIsRepeatedItem =
          items[_items.length + activeItem.current].id.includes(
            "repeated-item",
          );

        if (nextItemIsLastItem) {
          endReached.current = true;
        }
        if (nextItemIsRepeatedItem) {
          activeItem.current = 0;
          from = spring.value.get() + getScrollAmount() * _items.length;
          total = 0;
          endReached.current = false;
          startReached.current = true;
        }
      }
      if (type === "next" && !withLoop) {
        const nextItemWillExceed =
          Math.abs(total) > getTotalScrollAvailableSpace();

        if (nextItemWillExceed) {
          endReached.current = true;
          total = -getTotalScrollAvailableSpace();
        } else {
          startReached.current = false;
          endReached.current = false;
        }
      }
      if (type === "prev" && !withLoop) {
        const currentItemIsFirstItem =
          _items[activeItem.current]?.id === _items[0].id;

        if (currentItemIsFirstItem) {
          startReached.current = true;
        }
      }
      if (type === "prev" && withLoop) {
        const currentItemIsFirstItem =
          _items[activeItem.current]?.id === _items[0].id;
        const nextItemIsRepeatedItem =
          items[_items.length + activeItem.current]?.id.includes(
            "repeated-item",
          );

        if (currentItemIsFirstItem) {
          startReached.current = true;
        }

        if (nextItemIsRepeatedItem) {
          activeItem.current = _items.length - 1;
          from = spring.value.get() - getScrollAmount() * _items.length;
          total = -(getScrollAmount() * _items.length - getScrollAmount());

          startReached.current = false;
          endReached.current = true;
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
    if (slideType === "freeScroll") {
      const scrollValue =
        carouselTrackRef.current![
          carouselAxis === "x" ? "scrollLeft" : "scrollTop"
        ];
      const availableScrollSpace =
        carouselAxis === "x"
          ? carouselTrackRef.current!.scrollWidth -
            carouselTrackRef.current!.clientWidth
          : carouselTrackRef.current!.scrollHeight -
            carouselTrackRef.current!.clientHeight;

      from = scrollValue;

      if (type === "prev") {
        total = from - getScrollAmount();
        if (total < 0) {
          total = 0;
        }

        if (from - getScrollAmount() <= 0) {
          startReached.current = true;
        }

        emitEvent({
          eventName: "onSlideStartChange",
          sliceActionType: actionType,
          slideDirection: type,
          nextItem: {
            index: 0,
            id: "",
            startReached: startReached.current,
            endReached: false,
          },
        });
      }
      if (type === "next") {
        total = from + getScrollAmount();
        if (total > availableScrollSpace) {
          total = availableScrollSpace;
        }

        if (from + getScrollAmount() >= availableScrollSpace) {
          endReached.current = true;
        }

        emitEvent({
          eventName: "onSlideStartChange",
          sliceActionType: actionType,
          slideDirection: type,
          nextItem: {
            index: 0,
            id: "",
            startReached: false,
            endReached: endReached.current,
          },
        });
      }
    }

    const parsedFrom = pFloat(from);
    const parsedTotal = pFloat(total);
    currentSlidedValue.current = parsedTotal;

    setSpring.start({
      from: {
        value: parsedFrom,
      },
      to: {
        value: parsedTotal,
      },
      immediate: !shouldAnimate,
      onRest({ finished }) {
        if (finished && slideType === "fixed") {
          emitEvent({
            eventName: "onSlideChangeComplete",
            sliceActionType: actionType,
            slideDirection: type,
            currentItem: {
              index: activeItem.current,
              id: _items[activeItem.current].id,
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
  function slideToNextItem(
    actionType: SlideActionType,
    index?: number,
    shouldAnimate = true,
  ) {
    if (!carouselIsInitialized) {
      handleAppNotInitialized("Carousel not initialized yet: slideToNextItem");
      return;
    }

    if (
      actionType === "drag" ||
      (slideType === "fixed" && withLoop) ||
      (slideType === "fixed" && !withLoop && !endReached.current)
    ) {
      const itemIndex = index ?? activeItem.current + 1;
      slideToItemValue({
        type: "next",
        actionType,
        newActiveItem: itemIndex,
        shouldAnimate,
      });
    }
    if (
      (slideType === "fluid" && withLoop) ||
      (slideType === "fluid" && !withLoop && !endReached.current) ||
      (slideType === "freeScroll" && !endReached.current)
    ) {
      slideToItemValue({
        type: "next",
        actionType,
        shouldAnimate,
      });
    }
  }
  function slideToPrevItem(
    actionType: SlideActionType,
    index?: number,
    shouldAnimate = true,
  ) {
    if (!carouselIsInitialized) {
      handleAppNotInitialized("Carousel not initialized yet: slideToPrevItem");
      return;
    }

    if (
      actionType === "drag" ||
      (slideType === "fixed" && withLoop) ||
      (slideType === "fixed" && !withLoop && !startReached.current)
    ) {
      const itemIndex = index ?? activeItem.current - 1;
      slideToItemValue({
        type: "prev",
        actionType,
        newActiveItem: itemIndex,
        shouldAnimate,
      });
    }
    if (
      (slideType === "fluid" && withLoop) ||
      (slideType === "fluid" && !withLoop && !startReached.current) ||
      (slideType === "freeScroll" && !startReached.current)
    ) {
      slideToItemValue({
        type: "prev",
        actionType,
        shouldAnimate,
      });
    }
  }
  function handleSlideToItem(id: string | number, shouldAnimate = true) {
    let itemIndex = 0;
    if (typeof id === "string") {
      itemIndex = _items.findIndex((i) => i.id === id);
    } else {
      itemIndex = id;
    }

    if (itemIndex > activeItem.current) {
      slideToNextItem("click", itemIndex, shouldAnimate);
    }
    if (itemIndex < activeItem.current) {
      slideToPrevItem("click", itemIndex, shouldAnimate);
    }
  }
  type ThumbsContainerScrollProps = {
    activeItem: number;
    getContainer(): HTMLElement | null;
    updateTotalValue?(props: {
      from: number;
      to: number;
      itemOutOfViewport: {
        isOut: boolean;
        direction: "start" | "end" | null;
      };
    }): number;
  };
  function handleThumbsContainerScroll({
    getContainer,
    activeItem,
    updateTotalValue,
  }: ThumbsContainerScrollProps) {
    const container = getContainer();

    if (!(container instanceof HTMLElement)) {
      console.warn(
        `Container is not a valid html element: container is ${container}`,
      );
      return;
    }

    const item = container.children[activeItem] as HTMLElement;

    if (item) {
      const availableScrollableSpace =
        container[carouselAxis === "x" ? "scrollWidth" : "scrollHeight"] -
        container.getBoundingClientRect()[
          carouselAxis === "x" ? "width" : "height"
        ];

      const itemPosition = item.offsetLeft + item.offsetWidth / 2;
      const to = itemPosition - container.clientWidth / 2;

      const outOfViewport = isOutOfViewport(item);

      if (outOfViewport.isOut) {
        const totalScroll =
          outOfViewport.direction === "start"
            ? to < 0
              ? 0
              : to
            : to > availableScrollableSpace
              ? availableScrollableSpace
              : to;

        const fromValue =
          container[carouselAxis === "x" ? "scrollLeft" : "scrollTop"];

        new Controller({
          from: {
            value: fromValue,
          },
          to: {
            value: updateTotalValue
              ? updateTotalValue({
                  from: fromValue,
                  to: totalScroll,
                  itemOutOfViewport: outOfViewport,
                })
              : totalScroll,
          },
          onChange({ value }) {
            container[carouselAxis === "x" ? "scrollLeft" : "scrollTop"] =
              value.value;
          },
        });
      }
    }
  }

  const bindDrag = useDrag(
    (state) => {
      if (!carouselIsInitialized) {
        handleAppNotInitialized();
        return;
      }

      const isDragging = state.dragging;
      const movement = state.offset[carouselAxis === "x" ? 0 : 1];
      const currentMovement = state.movement[carouselAxis === "x" ? 0 : 1];

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
          slideToPrevItem("drag");
        } else if (nextItemTresholdReached) {
          slideToNextItem("drag");
        } else {
          setSpring.start({
            value: currentSlidedValue.current,
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
                left: -getTotalScrollAvailableSpace(),
                top: -getTotalScrollAvailableSpace(),
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

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        windowIsHidden.current = true;
        setCarouselIsInitialized(false);
      } else {
        windowIsHidden.current = false;
        setCarouselIsInitialized(true);
      }
    }
    function handleSetBasicCarouselPosition() {
      carouselTrackRef.current!.style.top = "0px";
      carouselTrackRef.current!.style.left = "0px";

      if (
        (slideType === "fixed" && !withLoop) ||
        slideType === "freeScroll" ||
        slideType === "fluid"
      ) {
        return;
      }

      if (
        slideType === "fixed" &&
        scrollAmountType === "group" &&
        itemsPerSlide.current > 1
      ) {
        const totalGroups = (_items.length * 3) / itemsPerSlide.current;
        carouselTrackRef.current!.style[carouselAxis === "x" ? "left" : "top"] =
          `calc(-${pFloat((getScrollAmount() * totalGroups) / 3)}px)`;
      } else {
        carouselTrackRef.current!.style[carouselAxis === "x" ? "left" : "top"] =
          `calc(-${pFloat((getScrollAmount() * items.length) / 3)}px)`;
      }
    }
    function handleResize() {
      handleSetScrollAmount();
      handleSetBasicCarouselPosition();

      setSpring.start({
        immediate: true,
        value: -(activeItem.current * getScrollAmount()),
      });
    }
    function handleSetScrollAmount() {
      const firstItem = carouselTrackRef.current!.children[0] as HTMLElement;
      let total = 0;

      const isFixedGroup =
        slideType === "fixed" &&
        scrollAmountType === "group" &&
        itemsPerSlide.current > 1;

      if (isFixedGroup) {
        total = pFloat(
          carouselTrackRef.current!.getBoundingClientRect()[
            carouselAxis === "x" ? "width" : "height"
          ],
        );
      } else {
        total = pFloat(
          firstItem.getBoundingClientRect()[
            carouselAxis === "x" ? "width" : "height"
          ],
        );
      }

      const { totalGutterCssVar, totalStartEndGutterCssVar } = getCssVars();

      total += totalGutterCssVar;
      if (isFixedGroup) {
        total -= totalStartEndGutterCssVar;
      }
      scrollAmount.current = total;

      return total;
    }
    function initCarousel() {
      errorMessages.current = [];

      const { itemsPerSlide: _itemsPerSlide } = getCssVars();
      console.log({ _itemsPerSlide });
      itemsPerSlide.current = _itemsPerSlide;

      /**
       * Initial checks
       */
      if (items.length === 0) {
        logWarn(
          "Init is true but no items are available; carousel will not be initialized",
        );
      }
      if (
        slideType === "fixed" &&
        scrollAmountType === "group" &&
        _items.length % itemsPerSlide.current !== 0
      ) {
        const errorMessage = `When using scrollAmountType='group' and itemsPerSlide={number>1} make sure that itemsPerSlides is divisible by the total quantity of items otherwise the carousel won't initialize.`;
        errorMessages.current.push(errorMessage);
      }
      if (slideType === "fluid" && _scrollAmountType !== undefined) {
        errorMessages.current.push(
          `scrollAmountType="group" is not available for slideType="fluid"; please change one of them.`,
        );
      }

      if (errorMessages.current.length > 0) {
        handleAppNotInitialized();
        return;
      }

      /**
       * Real carousel initialization
       */
      handleSetScrollAmount();

      /**
       * For loop option we set the initial
       * position of the carousel in the middle (having repeated items before and after)
       */
      handleSetBasicCarouselPosition();

      /**
       * Set drag treshold based on scroll amount
       */
      dragTreshold.current = getScrollAmount() / 4;

      /**
       * Initialize carousel
       */
      setCarouselIsInitialized(true);
    }

    if (typeof init === "function") {
      init().then((res) => {
        if (res) {
          initCarousel();

          if (initialActiveItem !== undefined && slideType === "fixed") {
            handleSlideToItem(initialActiveItem, false);
          }

          window.addEventListener("resize", handleResize);
          document.addEventListener("visibilitychange", handleVisibilityChange);
          return () => {
            document.removeEventListener(
              "visibilitychange",
              handleVisibilityChange,
            );
            window.removeEventListener("resize", handleResize);
          };
        }
      });
    } else if (init) {
      initCarousel();
      window.addEventListener("resize", handleResize);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        window.removeEventListener("resize", handleResize);
      };
    } else {
      setCarouselIsInitialized(false);
    }
  }, [scrollAmount, init, slideType, withLoop, carouselAxis]);
  useEffect(() => {
    if (
      initialActiveItem !== undefined &&
      carouselIsInitialized &&
      slideType === "fixed"
    ) {
      handleSlideToItem(initialActiveItem, false);
    }
  }, [carouselIsInitialized, initialActiveItem]);

  const carouselFragment = (
    <>
      <style
        id={`carousel-container-${carouselId}`}
        dangerouslySetInnerHTML={{
          __html: optimizeCss(`
            :root {
              --${carouselId}-react-spring-carousel-item-gutter: 0px;
              --${carouselId}-react-spring-carousel-start-end-gutter: 0px;
              --${carouselId}-react-spring-carousel-items-per-slide: 1;
            }
            .carousel-${carouselId} {
              display: flex;
              overflow: hidden;
              width: 100%;
              height: 100%;
              padding: ${carouselAxis === "x" ? `0px var(--${carouselId}-react-spring-carousel-start-end-gutter)` : `var(--${carouselId}-react-spring-carousel-start-end-gutter) 0px`};
            }
            .carousel-${carouselId} .use-spring-carousel-track {
              display: flex;
              width: 100%;
              position: relative;
              flex-direction: ${carouselAxis === "x" ? "row" : "column"};
              gap: var(--${carouselId}-react-spring-carousel-item-gutter);

              --initial-active-item: ${initialActiveItem || 0};
              --offset-position: calc(var(--item-scroll-value) * var(--initial-active-item));
              --scroll-x-value: ${slideType === "fixed" && carouselAxis === "x" ? "var(--offset-position)" : "0px"};
              --scroll-y-value: ${slideType === "fixed" && carouselAxis === "y" ? "var(--offset-position)" : "0px"};

              transform: translate3d(var(--scroll-x-value), var(--scroll-y-value), 0px);
              touch-action: ${
                !enableGestures
                  ? "auto"
                  : carouselAxis === "x"
                    ? "pan-y"
                    : "pan-x"
              };
              overflow-x: ${
                slideType === "freeScroll" && carouselAxis === "x"
                  ? "auto"
                  : "initial"
              };
              overflow-y: ${
                slideType === "freeScroll" && carouselAxis === "y"
                  ? "auto"
                  : "initial"
              };
            }
            .carousel-${carouselId} .use-spring-carousel-track::after {
              content: "";
              visibility: hidden;
              display: block;
              width: var(--${carouselId}-react-spring-carousel-start-end-gutter);
              flex-shrink: 0;
            }
            .carousel-${carouselId} .use-spring-carousel-item {
              position: relative;
              display: flex;
              width: 100%;
              height: 100%;
              ${slideType === "fixed" ? `flex: 0 0 calc(100% / var(--${carouselId}-react-spring-carousel-items-per-slide) - calc(var(--${carouselId}-react-spring-carousel-item-gutter) * (var(--${carouselId}-react-spring-carousel-items-per-slide) - 1) / var(--${carouselId}-react-spring-carousel-items-per-slide)));` : ""}
            }
            ${
              fadeIn
                ? `.carousel-${carouselId} .use-spring-carousel-item {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  opacity: 0;
                }
                .carousel-${carouselId} .use-spring-carousel-item:first-child {
                  opacity: 1;
                }`.trim()
                : ""
            }`),
        }}
      />
      <div
        className={`use-spring-carousel-container carousel-${carouselId}`}
        ref={carouselContainerRef}
        data-carousel-direction={carouselAxis}
      >
        <div
          className={`use-spring-carousel-track`}
          {...bindDrag()}
          {...getScrollHandlers()}
          ref={(r) => {
            carouselTrackRef.current = r;
            if (r) {
              const firtsElement = r.children[0] as HTMLElement;
              if (firtsElement) {
                r.style.setProperty(
                  "--item-scroll-value",
                  `-${firtsElement.getBoundingClientRect().width}px`,
                );
              }
            }
          }}
        >
          {items.map((item, index) => {
            return (
              <div
                key={`${item.id}-${index}`}
                className="use-spring-carousel-item"
                id={item.id}
              >
                {typeof item.renderItem === "function"
                  ? item.renderItem({ useListenToCustomEvent, index })
                  : item.renderItem}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  return {
    carouselFragment,
    useListenToCustomEvent,
    slideToNextItem: () => slideToNextItem("click"),
    slideToPrevItem: () => slideToPrevItem("click"),
    slideToIem: (id: string | number, shouldAnimate = true) => {
      if (!carouselIsInitialized) {
        handleAppNotInitialized();
        return;
      }
      handleSlideToItem(id, shouldAnimate);
    },
    handleThumbsContainerScroll,
    carouselId,
  };
}
