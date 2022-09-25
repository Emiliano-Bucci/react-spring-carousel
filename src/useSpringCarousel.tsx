import { a, useSpring } from "@react-spring/web";
import React, { useCallback, useRef } from "react";
import { SpringCarouselBaseProps } from "./types/useSpringCarousel";
import { SlideActionType } from "./types/common";

export function useSpringCarousel({
  items,
  init = true,
  withThumbs,
  itemsPerSlide = 1,
  slideType = "fixed",
  gutter = 0,
}: SpringCarouselBaseProps) {
  const slideActionType = useRef<SlideActionType>("initial");
  const [spring, setSpring] = useSpring(() => ({
    x: 0,
    y: 0,
    pause: !init,
  }));
  const activeItem = useRef(0);

  const getItems = useCallback(() => {
    return [...items];
  }, [items]);

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
  const internalItems = getItems();

  function getCarouselSlideValue() {
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
  }: {
    from: number;
    to: number;
    nextActiveItem?: number;
  }) {
    if (nextActiveItem) {
      activeItem.current = nextActiveItem;
    }

    setSpring.start({
      from: {
        x: from,
      },
      to: {
        x: to,
      },
    });
  }

  function slideToPrevItem() {
    if (!init) return;

    if (slideType === "fixed") {
      slideToItem({
        from: -(activeItem.current * getCarouselSlideValue()),
        to: -((activeItem.current - 1) * getCarouselSlideValue()),
        nextActiveItem: activeItem.current - 1,
      });
    }
  }
  function slideToNextItem() {
    if (!init) return;

    if (slideType === "fixed") {
      slideToItem({
        from: -(activeItem.current * getCarouselSlideValue()),
        to: -((activeItem.current + 1) * getCarouselSlideValue()),
        nextActiveItem: activeItem.current + 1,
      });
    }
  }

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
        style={{
          ...spring,
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
