import React from "react";
import { useSpringCarousel } from "../../src/useSpringCarousel";
import { mockedItems } from "../../src/mockedItems";

export function UseSpringCarousel() {
  const { carouselFragment, slideToPrevItem, slideToNextItem } =
    useSpringCarousel({
      items: mockedItems,
      gutter: 40,
      withLoop: true,
      initialStartingPosition: "center",
      startEndGutter: 32,
      itemsPerSlide: 4,
    });

  return (
    <div className="wrapper">
      <button onClick={slideToPrevItem}>PREV</button>
      <div className="carousel-wrapper">{carouselFragment}</div>
      <button onClick={slideToNextItem}>NEXT</button>
    </div>
  );
}
