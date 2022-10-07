import React from "react";
import { useSpringCarousel } from "../../src/useSpringCarousel";
import { mockedItems } from "../../src/mockedItems";

export function UseSpringCarousel() {
  const {
    carouselFragment,
    slideToPrevItem,
    slideToNextItem,
    useListenToCustomEvent,
    enterFullscreen,
  } = useSpringCarousel({
    items: mockedItems,
    startEndGutter: 20,
    withLoop: true,
    itemsPerSlide: 3,
    gutter: 20,
  });

  useListenToCustomEvent((event) => {
    console.log(event);
  });

  return (
    <div className="wrapper">
      <button onClick={slideToPrevItem}>PREV</button>
      <div className="carousel-wrapper" onClick={() => enterFullscreen()}>
        {carouselFragment}
      </div>
      <button onClick={slideToNextItem}>NEXT</button>
    </div>
  );
}
