import { a, useSpring } from "@react-spring/web";
import React, { useCallback, useLayoutEffect, useRef } from "react";
import { SpringCarouselBaseProps } from "./types/useSpringCarousel";
import { SlideActionType } from "./types/common";

export function useSpringCarousel({
  items,
  init = true,
  withThumbs,
  itemsPerSlide = 1,
  slideType = "fixed",
  gutter = 0,
  withLoop = false,
}: SpringCarouselBaseProps) {
  const slideActionType = useRef<SlideActionType>("initial");
  const [spring, setSpring] = useSpring(() => ({
    x: 0,
    y: 0,
    pause: !init,
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
    return carouselItem.getBoundingClientRect().width + gutter;
  }

  function slideToItem({
    from,
    to,
    nextActiveItem,
    immediate = false,
  }: {
    from: number;
    to: number;
    nextActiveItem?: number;
    immediate?: boolean;
  }) {
    if (typeof nextActiveItem === "number") {
      activeItem.current = nextActiveItem;
    }

    setSpring.start({
      immediate,
      from: {
        x: from,
      },
      to: {
        x: to,
      },
    });
  }

  function getTotalScrollValue() {
    return getSlideValue() * items.length;
  }
  function slideToPrevItem() {
    if (!init) return;

    if (slideType === "fixed") {
      const nextItemWillEceed = (activeItem.current - 1) * getSlideValue() < 0;
      lastItemReached.current = false;

      if (nextItemWillEceed) {
        firstItemReached.current = true;

        if (withLoop) {
          slideToItem({
            from: spring.x.get() - getSlideValue() * items.length,
            to: -(getSlideValue() * items.length) + getSlideValue(),
            nextActiveItem: items.length - 1,
          });
        }
        return;
      }

      slideToItem({
        from: spring.x.get(),
        to: -((activeItem.current - 1) * getSlideValue()),
        nextActiveItem: activeItem.current - 1,
      });
    }
  }

  function slideToNextItem() {
    if (!init) return;

    if (slideType === "fixed") {
      const nextItemWillExceed =
        (activeItem.current + 1) * getSlideValue() >= getTotalScrollValue();
      firstItemReached.current = false;

      if (nextItemWillExceed) {
        lastItemReached.current = true;

        if (withLoop) {
          slideToItem({
            from: spring.x.get() + getSlideValue() * items.length,
            to: 0,
            nextActiveItem: 0,
          });
        }
        return;
      }

      slideToItem({
        from: spring.x.get(),
        to: -((activeItem.current + 1) * getSlideValue()),
        nextActiveItem: activeItem.current + 1,
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
  }, []);

  const carouselFragment = (
    <div
      ref={mainCarouselWrapperRef}
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <a.div
        ref={carouselTrackWrapperRef}
        style={{
          ...spring,
          position: "relative",
          display: "flex",
          flex: "1",
          width: "100%",
          height: "100%",
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
      </a.div>
    </div>
  );

  return {
    carouselFragment,
    slideToPrevItem,
    slideToNextItem,
  };
}
