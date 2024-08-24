import { ElementRef, useEffect, useId, useRef } from "react";
import { Props } from "./types";
import { useSpring } from "@react-spring/web";
import { useEventsModule } from "./useEventsModule";

export function useSpringCarousel({
  init = true,
  items,
  slideType = "fixed",
  scrollAmount,
}: Props) {
  const carouselId = useId().replace(/:/g, "");
  const carouselContainerRef = useRef<ElementRef<"div">>(null);
  const carouselTrackRef = useRef<ElementRef<"div">>(null);

  const startReached = useRef(true);
  const endReached = useRef(false);

  const activeItem = useRef(0);

  const [, setSpring] = useSpring(() => ({
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
              flex: 1;
            }
            .carousel-${carouselId} .use-spring-carousel-item {
              position: relative;
              display: flex;
              flex: 1;
              min-width: ${slideType === "fixed" ? "100%" : "auto"};
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
    return scrollAmount ?? 0;
  }
  function getTotalScrollWidth() {
    return Math.round(
      carouselTrackRef.current!.scrollWidth -
        carouselContainerRef.current!.getBoundingClientRect().width
    );
  }
  function slideToItemValue(_total: number, type: "prev" | "next") {
    let total = _total;
    if (slideType === "fixed") {
      if (type === "prev") {
        activeItem.current = activeItem.current - 1;
      }
      if (type === "next") {
        activeItem.current = activeItem.current + 1;
      }
      emitEvent({
        eventName: "onSlideStartChange",
        slideMode: "click",
        slideActionType: type,
        nextItem: {
          startReached: activeItem.current === 0,
          endReached: activeItem.current === items.length - 1,
          index: activeItem.current,
          id: items[activeItem.current].id,
        },
      });
    }

    if (slideType === "fluid") {
      if (type === "next") {
        const nextItemWillExceed = Math.abs(total) > getTotalScrollWidth();

        if (nextItemWillExceed) {
          endReached.current = true;
          total = -getTotalScrollWidth();
        } else {
          startReached.current = false;
          endReached.current = false;
        }
      }
      if (type === "prev") {
        const nextItemWillExceed = total > 0;

        if (nextItemWillExceed) {
          total = 0;
          startReached.current = true;
        } else {
          startReached.current = false;
          endReached.current = false;
        }
      }

      activeItem.current = total;

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
      x: total,
      y: 0,
      onChange({ value }) {
        if (slideType === "fixed") {
          carouselTrackRef.current!.style.transform = `translateX(${value.x}%)`;
        }
        if (slideType === "fluid") {
          carouselTrackRef.current!.style.transform = `translateX(${value.x}px)`;
        }
      },
      onRest({ finished }) {
        if (finished) {
          if (slideType === "fixed") {
            emitEvent({
              eventName: "onSlideChangeComplete",
              slideMode: "click",
              slideActionType: type,
              currentItem: {
                startReached: activeItem.current === 0,
                endReached: activeItem.current === items.length - 1,
                index: activeItem.current,
                id: items[activeItem.current].id,
              },
            });
          }
        }
      },
    });

    if (slideType === "fixed") {
      if (activeItem.current === items.length - 1) {
        endReached.current = true;
      } else if (activeItem.current === 0) {
        startReached.current = true;
      } else {
        startReached.current = false;
        endReached.current = false;
      }
    }
  }

  function slideToNextItem() {
    if (slideType === "fixed" && !endReached.current) {
      slideToItemValue(-((activeItem.current + 1) * 100), "next");
    }
    if (slideType === "fluid") {
      slideToItemValue(activeItem.current - getScrollAmount(), "next");
    }
  }
  function slideToPrevItem() {
    if (slideType === "fixed" && !startReached.current) {
      slideToItemValue(-((activeItem.current - 1) * 100), "prev");
    }
    if (slideType === "fluid") {
      slideToItemValue(activeItem.current + getScrollAmount(), "prev");
    }
  }

  useEffect(() => {
    if (init && items.length === 0) {
      console.warn(
        "Init is true but no items are available; carousel will not be initialized"
      );
    }
  }, [init]);
  useEffect(() => {
    if (
      init &&
      slideType === "fluid" &&
      scrollAmount === undefined &&
      carouselTrackRef.current
    ) {
      const firstItem = carouselTrackRef.current.children[0] as HTMLElement;
      scrollAmount = firstItem.getBoundingClientRect().width;
    }
  }, [scrollAmount, init, slideType]);

  return {
    carouselFragment,
    slideToNextItem,
    slideToPrevItem,
    useListenToCustomEvent,
  };
}
