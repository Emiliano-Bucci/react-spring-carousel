import React from "react";
import { useSpringCarousel } from "../../src/useSpringCarousel";
import { mockedItems } from "../../src/mockedItems";

export function UseSpringCarousel() {
  const { carouselFragment, slideToPrevItem, slideToNextItem } =
    useSpringCarousel({
      items: mockedItems,
      // startEndGutter: 20,
      // withLoop: true,
      // itemsPerSlide: 3,
      // gutter: 20,
    });

  return (
    <div className="wrapper">
      <button onClick={slideToPrevItem}>PREV</button>
      <div className="carousel-wrapper">{carouselFragment}</div>
      <button onClick={slideToNextItem}>NEXT</button>
    </div>
  );
}
