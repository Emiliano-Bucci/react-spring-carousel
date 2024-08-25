import { ElementRef, useEffect, useId, useRef } from "react";
import { Props } from "./types";
import { useSpring } from "@react-spring/web";
import { useEventsModule } from "./useEventsModule";

function pFloat(v: number) {
  return parseFloat(v.toFixed(2));
}

export function useSpringCarousel({
  init = true,
  items: _items,
  slideType = "fixed",
  scrollAmount,
  withLoop = false,
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

  const carouselId = useId().replace(/:/g, "");
  const carouselContainerRef = useRef<ElementRef<"div">>(null);
  const carouselTrackRef = useRef<ElementRef<"div">>(null);

  const startReached = useRef<boolean | undefined>(true);
  const endReached = useRef<boolean | undefined>(false);

  const activeItem = useRef(0);

  const [spring, setSpring] = useSpring(() => ({
    x: 0,
    y: 0,
  }));

  const { useListenToCustomEvent, emitEvent } = useEventsModule();

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
            }
            .carousel-${carouselId} .use-spring-carousel-item {
              position: relative;
              display: flex;
              flex: 1;
              min-width: ${slideType === "fixed" ? "100% !important" : "auto"};
            }
          `.trim(),
        }}
      />
      <div
        className={`use-spring-carousel-container carousel-${carouselId}`}
        ref={carouselContainerRef}
      >
        <div className={`use-spring-carousel-track`} ref={carouselTrackRef}>
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

  function getScrollAmount() {
    return pFloat(scrollAmount ?? 0);
  }
  function getTotalScrollWidth() {
    return (
      carouselTrackRef.current!.scrollWidth -
      carouselContainerRef.current!.getBoundingClientRect().width
    );
  }
  function slideToItemValue(_total: number, type: "prev" | "next") {
    let total = _total;
    let from: number | undefined = undefined;

    startReached.current = false;
    endReached.current = false;

    const currentActiveItemIndex = activeItem.current;

    if (slideType === "fixed") {
      if (type === "prev") {
        activeItem.current = activeItem.current - 1;
      }
      if (type === "next") {
        activeItem.current = activeItem.current + 1;
      }

      if (!withLoop) {
        if (activeItem.current === items.length - 1) {
          endReached.current = true;
        } else if (activeItem.current === 0) {
          startReached.current = true;
        } else {
          startReached.current = false;
          endReached.current = false;
        }
      }

      if (withLoop) {
        if (type === "next") {
          const nextItemIsRepeatedItem =
            items[_items.length + activeItem.current].id.includes(
              "repeated-item"
            );
          if (nextItemIsRepeatedItem) {
            endReached.current = true;
          }

          if (endReached.current) {
            activeItem.current = 0;

            from = spring.x.get() + getScrollAmount() * _items.length;
            total = 0;

            endReached.current = false;
            startReached.current = true;
          }
        }
        if (type === "prev") {
          const currentItemIndex = items.findIndex(
            (i) => i.id === _items[currentActiveItemIndex].id
          );
          const nextItemIsRepeatedItem =
            items[currentItemIndex - 1].id.includes("repeated-item");

          if (nextItemIsRepeatedItem) {
            startReached.current = true;
          }

          if (startReached.current) {
            startReached.current = false;
            endReached.current = true;
            activeItem.current = _items.length - 1;

            from = spring.x.get() - getScrollAmount() * _items.length;
            total = -(getScrollAmount() * _items.length - getScrollAmount());
          }
        }
      }

      emitEvent({
        eventName: "onSlideStartChange",
        slideMode: "click",
        slideActionType: type,
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

        if (!withLoop) {
          if (nextItemWillExceed) {
            endReached.current = true;
            total = -getTotalScrollWidth();
          } else {
            startReached.current = false;
            endReached.current = false;
          }
        }
      }
      if (type === "prev") {
        const nextItemWillExceed = total > 0;

        if (!withLoop) {
          if (nextItemWillExceed) {
            total = 0;
            startReached.current = true;
          } else {
            startReached.current = false;
            endReached.current = false;
          }
        }
      }

      emitEvent({
        eventName: "onSlideStartChange",
        slideMode: "click",
        slideActionType: type,
        nextItem: {
          startReached: startReached.current,
          endReached: endReached.current,
          index: 0,
          id: "",
        },
      });
    }

    setSpring.start({
      ...(from
        ? {
            from: {
              x: pFloat(from),
              y: 0,
            },
            to: {
              x: pFloat(total),
              y: 0,
            },
          }
        : { x: total, y: 0 }),
      onChange({ value }) {
        carouselTrackRef.current!.style.transform = `translateX(${value.x}px)`;
      },
      onRest({ finished }) {
        if (finished) {
          if (slideType === "fixed") {
            emitEvent({
              eventName: "onSlideChangeComplete",
              slideMode: "click",
              slideActionType: type,
              currentItem: {
                index: activeItem.current,
                id: items[activeItem.current].id,
                startReached: startReached.current,
                endReached: endReached.current,
              },
            });
          }
        }
      },
    });
  }

  function slideToNextItem() {
    if (withLoop && slideType === "fixed") {
      slideToItemValue(-((activeItem.current + 1) * getScrollAmount()), "next");
    } else if (slideType === "fixed" && !endReached.current) {
      slideToItemValue(-((activeItem.current + 1) * getScrollAmount()), "next");
    } else if (slideType === "fluid") {
      slideToItemValue(activeItem.current - getScrollAmount(), "next");
    }
  }
  function slideToPrevItem() {
    if (withLoop && slideType === "fixed") {
      slideToItemValue(-((activeItem.current - 1) * getScrollAmount()), "prev");
    } else if (slideType === "fixed" && !startReached.current) {
      slideToItemValue(-((activeItem.current - 1) * getScrollAmount()), "prev");
    } else if (slideType === "fluid") {
      slideToItemValue(activeItem.current + getScrollAmount(), "prev");
    }
  }

  useEffect(() => {
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
        const firstItem = carouselTrackRef.current!.children[0] as HTMLElement;
        scrollAmount = pFloat(firstItem.getBoundingClientRect().width);
      }

      if (withLoop) {
        if (slideType === "fixed") {
          /**
           * For loop and fixed options we
           * set the initial position of the carousel in the middle
           */
          const firstItem = carouselTrackRef.current!
            .children[0] as HTMLElement;
          scrollAmount = firstItem.getBoundingClientRect().width;
          carouselTrackRef.current!.style.left = `-${pFloat((scrollAmount * items.length) / 3)}px`;
        }
      }
    }

    if (init) {
      initCarousel();
    }
  }, [scrollAmount, init, slideType, withLoop]);

  return {
    carouselFragment,
    slideToNextItem,
    slideToPrevItem,
    useListenToCustomEvent,
  };
}
