import { ElementRef, useEffect, useId, useRef } from "react";
import { Props } from "./types";
import { Controller, useSpring } from "@react-spring/web";
import { useEventsModule } from "./useEventsModule";
import { useDrag } from "@use-gesture/react";
import { SlideActionType } from "./events";
import { isOutOfViewport, pFloat, logWarn, logError } from "./utils";

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
  const carouselIsInitialized = useRef(false);
  const errorMessages = useRef<string[]>([]);
  const windowIsHidden = useRef(false);

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
    value: 0,
    onChange({ value }) {
      if (slideType === "fixed" || slideType === "fluid") {
        if (carouselAxis === "x") {
          carouselTrackRef.current!.style.transform = `translateX(${value.value}px)`;
        } else {
          carouselTrackRef.current!.style.transform = `translateY(${value.value}px)`;
        }
      }
      if (slideType === "freeScroll") {
        carouselTrackRef.current![
          carouselAxis === "x" ? "scrollLeft" : "scrollTop"
        ] = Math.abs(value.value);
      }
    },
  }));

  const { useListenToCustomEvent, emitEvent } = useEventsModule();

  /**
   * Internal utility helpers
   */
  function getScrollAmount() {
    return pFloat(scrollAmount.current ?? 0);
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
  function handleAppNotInitialized() {
    logWarn("It seems that the carousel isn't initialized yet.");
    console.log("The carousel register the following errors:");
    console.table(errorMessages.current);
  }

  type SlideToItemProps = {
    type: "prev" | "next";
    actionType: SlideActionType;
    newActiveItem?: number;
  };
  function slideToItemValue({
    type,
    actionType,
    newActiveItem,
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
        itemsPerSlide > 1 &&
        type === "next"
      ) {
        const totalGroups = _items.length / itemsPerSlide;
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
        itemsPerSlide > 1 &&
        type === "prev"
      ) {
        const totalGroups = _items.length / itemsPerSlide;
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

      if (!withLoop && scrollAmountType === "group" && itemsPerSlide > 1) {
        const totalGroups = _items.length / itemsPerSlide;
        const lastGroupIsNotFilled = 2 % totalGroups !== 0;
        const nextGroupIsLastGroup =
          Math.floor(totalGroups) === activeItem.current;

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
          (scrollAmountType === "group" && itemsPerSlide === 1))
      ) {
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
          (scrollAmountType === "group" && itemsPerSlide === 1))
      ) {
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
            "repeated-item"
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
        const nextItemIsLastItem =
          _items[activeItem.current + 1]?.id === _items[_items.length - 1].id;
        const nextItemWillExceed =
          Math.abs(total) > getTotalScrollAvailableSpace();

        if (nextItemIsLastItem) {
          endReached.current = true;
          if (nextItemWillExceed) {
            total = -getTotalScrollAvailableSpace();
          }
        } else if (nextItemWillExceed) {
          endReached.current = true;
          total = -getTotalScrollAvailableSpace();
        } else {
          startReached.current = false;
          endReached.current = false;
        }
      }
      if (type === "prev") {
        const currentItemIsFirstItem =
          _items[activeItem.current]?.id === _items[0].id;
        const nextItemIsRepeatedItem =
          items[_items.length + activeItem.current]?.id.includes(
            "repeated-item"
          );

        if (currentItemIsFirstItem) {
          startReached.current = true;
        }

        if (withLoop && nextItemIsRepeatedItem) {
          activeItem.current = _items.length - 1;
          from = spring.value.get() - getScrollAmount() * _items.length;
          total = -(getScrollAmount() * _items.length - getScrollAmount());

          startReached.current = false;
          endReached.current = true;
        }

        if (!withLoop) {
          const nextItemWillExceed = total > 0;
          if (nextItemWillExceed) {
            total = 0;
            startReached.current = true;
          } else {
            startReached.current = false;
            endReached.current = false;
          }

          if (startReached.current) {
            activeItem.current = 0;
            return;
          }
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
      }
      if (type === "next") {
        total = from + getScrollAmount();
        if (total > availableScrollSpace) {
          total = availableScrollSpace;
        }
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
  function slideToNextItem(actionType: SlideActionType, index?: number) {
    if (!carouselIsInitialized.current) {
      handleAppNotInitialized();
      return;
    }

    if (
      (slideType === "fixed" && withLoop) ||
      (slideType === "fixed" && !withLoop && !endReached.current)
    ) {
      const itemIndex = index ?? activeItem.current + 1;
      slideToItemValue({
        type: "next",
        actionType,
        newActiveItem: itemIndex,
      });
    }
    if (slideType === "fluid" || slideType === "freeScroll") {
      slideToItemValue({
        type: "next",
        actionType,
      });
    }
  }
  function slideToPrevItem(actionType: SlideActionType, index?: number) {
    if (!carouselIsInitialized.current) {
      handleAppNotInitialized();
      return;
    }

    if (
      (withLoop && slideType === "fixed") ||
      (slideType === "fixed" && !withLoop && !startReached.current)
    ) {
      const itemIndex = index ?? activeItem.current - 1;
      slideToItemValue({
        type: "prev",
        actionType,
        newActiveItem: itemIndex,
      });
    }
    if (slideType === "fluid" || slideType === "freeScroll") {
      slideToItemValue({
        type: "prev",
        actionType,
      });
    }
  }
  function getCarouselItemWidth() {
    if (itemsPerSlide > 1) {
      return `calc(100% / ${itemsPerSlide} - var(--react-spring-carouse-item-gutter) / ${itemsPerSlide} * ${itemsPerSlide - 1}) !important`;
    }

    return "100% !important";
  }
  function handleSlideToItem(id: string | number) {
    let itemIndex = 0;
    if (typeof id === "string") {
      itemIndex = _items.findIndex((i) => i.id === id);
    } else {
      itemIndex = id;
    }

    if (itemIndex > activeItem.current) {
      slideToNextItem("click", itemIndex);
    }
    if (itemIndex < activeItem.current) {
      slideToPrevItem("click", itemIndex);
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
        `Container is not a valid html element: container is ${container}`
      );
      return;
    }

    const item = container.children[activeItem] as HTMLElement;

    if (item) {
      const availableScrollableSpace =
        carouselAxis === "x"
          ? container.scrollWidth - container.getBoundingClientRect().width
          : container.scrollHeight - container.getBoundingClientRect().height;

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

  function getGutterCssVariable() {
    let totalGutterCssVar = 0;
    let totalStartEndGutterCssVar = 0;

    const startEndGutterCssVar = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--react-spring-carouse-item-gutter");
    const gutterCssVar = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--react-spring-carouse-item-gutter");

    if (gutterCssVar.includes("px")) {
      totalGutterCssVar = Number(gutterCssVar.replace("px", ""));
    }
    if (startEndGutterCssVar.includes("px")) {
      totalStartEndGutterCssVar = Number(
        startEndGutterCssVar.replace("px", "")
      );
    }

    return { totalGutterCssVar, totalStartEndGutterCssVar };
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

  const bindDrag = useDrag(
    (state) => {
      if (!carouselIsInitialized.current) {
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
    }
  );

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        windowIsHidden.current = true;
        carouselIsInitialized.current = false;
      } else {
        windowIsHidden.current = false;
        carouselIsInitialized.current = true;
      }
    }
    function handleSetBasicCarouselPosition() {
      if (
        slideType === "fixed" &&
        scrollAmountType === "group" &&
        itemsPerSlide > 1
      ) {
        const totalGroups = (_items.length * 3) / itemsPerSlide;
        carouselTrackRef.current!.style[carouselAxis === "x" ? "left" : "top"] =
          `-${pFloat((getScrollAmount() * totalGroups) / 3)}px`;
      } else {
        carouselTrackRef.current!.style[carouselAxis === "x" ? "left" : "top"] =
          `-${pFloat((getScrollAmount() * items.length) / 3)}px`;
      }
    }
    function handleResize() {
      handleSetScrollAmount();

      if (slideType === "fixed" && withLoop) {
        handleSetBasicCarouselPosition();
      }

      setSpring.start({
        immediate: true,
        value: -(activeItem.current * getScrollAmount()),
      });
    }
    function handleSetScrollAmount() {
      const firstItem = carouselTrackRef.current!.children[0] as HTMLElement;
      let total = 0;
      if (
        slideType === "fixed" &&
        scrollAmountType === "group" &&
        itemsPerSlide > 1
      ) {
        total = pFloat(
          carouselTrackRef.current!.getBoundingClientRect()[
            carouselAxis === "x" ? "width" : "height"
          ]
        );
      }

      total = pFloat(
        firstItem.getBoundingClientRect()[
          carouselAxis === "x" ? "width" : "height"
        ]
      );

      let { totalGutterCssVar } = getGutterCssVariable();

      total += totalGutterCssVar;
      scrollAmount.current = total;

      return total;
    }
    function initCarousel() {
      /**
       * Initial checks
       */
      if (items.length === 0) {
        logWarn(
          "Init is true but no items are available; carousel will not be initialized"
        );
      }
      if (
        slideType === "fixed" &&
        scrollAmountType === "group" &&
        itemsPerSlide === 1
      ) {
        logWarn(
          `Using scrollAmountType='group' and itemsPerSlide={1} makes no difference; itemsPerSlide must be greater than 1.`
        );
      }
      if (
        slideType === "fixed" &&
        scrollAmountType === "group" &&
        _items.length % itemsPerSlide !== 0
      ) {
        const errorMessage = `When using scrollAmountType='group' and itemsPerSlide={number>1} make sure that itemsPerSlides is divisible by the total quantity of items otherwise the carousel won't initialize.`;
        logError(errorMessage);
        errorMessages.current.push(errorMessage);
        return;
      }

      /**
       * Real carousel initialization
       */
      handleSetScrollAmount();

      if (withLoop) {
        /**
         * For loop option we set the initial
         * position of the carousel in the middle (having repeated items before and after)
         */
        handleSetBasicCarouselPosition();
      }

      /**
       * Set drag treshold based on scroll amount
       */
      dragTreshold.current = getScrollAmount() / 4;

      /**
       * Initialize carousel
       */
      carouselIsInitialized.current = true;
    }

    if (init) {
      initCarousel();
      window.addEventListener("resize", handleResize);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        window.removeEventListener("resize", handleResize);
      };
    } else {
      carouselIsInitialized.current = false;
    }
  }, [scrollAmount, init, slideType, withLoop, carouselAxis]);

  const carouselFragment = (
    <>
      <style
        id={`carousel-container-${carouselId}`}
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --react-spring-carouse-item-gutter: 0px;
              --react-spring-carousel-start-end-gutter: 0px;
            }
            .carousel-${carouselId} {
              display: flex;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            .carousel-${carouselId} .use-spring-carousel-track {
              position: relative;
              display: flex;
              width: calc(100% - var(--react-spring-carousel-start-end-gutter) * 2);
              padding-left: var(--react-spring-carousel-start-end-gutter);
              touch-action: ${!enableGestures ? "auto" : carouselAxis === "x" ? "pan-y" : "pan-x"};
              flex-direction: ${carouselAxis === "x" ? "row" : "column"};
              overflow-x: ${slideType === "freeScroll" && carouselAxis === "x" ? "auto" : "initial"};
              overflow-y: ${slideType === "freeScroll" && carouselAxis === "y" ? "auto" : "initial"};
            }
            .carousel-${carouselId} .use-spring-carousel-track::after {
              content: "";
              visibility: hidden;
              display: block;
              width: var(--react-spring-carousel-start-end-gutter);
              flex-shrink: 0;
            }
            .carousel-${carouselId} .use-spring-carousel-item {
              position: relative;
              display: flex;
              flex: 1 0 ${slideType === "fixed" ? getCarouselItemWidth() : "auto"};
            }
            .carousel-${carouselId}[data-carousel-direction=x] .use-spring-carousel-item:not(:last-child) {
              margin-right: var(--react-spring-carouse-item-gutter);
            }
            .carousel-${carouselId}[data-carousel-direction=y] .use-spring-carousel-item:not(:last-child) {
              margin-bottom: var(--react-spring-carouse-item-gutter);
            }
              `.trim(),
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
          ref={carouselTrackRef}
          {...getScrollHandlers()}
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
    useListenToCustomEvent,
    slideToNextItem: () => slideToNextItem("click"),
    slideToPrevItem: () => slideToPrevItem("click"),
    slideToIem: (id: string | number) => {
      if (!carouselIsInitialized.current) {
        handleAppNotInitialized();
        return;
      }
      handleSlideToItem(id);
    },
    handleThumbsContainerScroll,
  };
}
