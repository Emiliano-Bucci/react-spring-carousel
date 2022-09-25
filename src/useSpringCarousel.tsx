import { a } from "@react-spring/web";
import React, { useCallback, useRef } from "react";
import { SpringCarouselBaseProps } from "./types/useSpringCarousel";
export function useSpringCarousel({
  items,
  init,
  withThumbs,
  itemsPerSlide = 1,
  slideType = "fixed",
  gutter = 0,
}: SpringCarouselBaseProps) {
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

  const carouselFragment = (
    <div
      ref={mainCarouselWrapperRef}
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <a.div
        style={{
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
  };
}
