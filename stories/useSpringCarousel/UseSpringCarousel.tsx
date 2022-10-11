import React from "react";
import { useSpringCarousel } from "../../src/useSpringCarousel";
import { mockedItems } from "../../src/mockedItems";

export function UseSpringCarousel() {
  const { carouselFragment, slideToPrevItem, slideToNextItem } =
    useSpringCarousel({
      items: mockedItems,
      gutter: 20,
      freeScroll: true,
    });

  return (
    <div className="wrapper">
      <button onClick={slideToPrevItem}>PREV</button>
      <div className="carousel-wrapper">{carouselFragment}</div>
      <button onClick={slideToNextItem}>NEXT</button>
    </div>
  );
}
