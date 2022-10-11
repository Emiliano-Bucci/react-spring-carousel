import React from "react";
import { useSpringCarousel } from "../../src/useSpringCarousel";
import { mockedItems } from "../../src/mockedItems";

export function UseSpringCarousel() {
  const { carouselFragment, slideToPrevItem, slideToNextItem, thumbsFragment } =
    useSpringCarousel({
      items: mockedItems.map((i) => ({
        ...i,
        renderThumb: <div>Thumb</div>,
      })),
      withThumbs: true,
      itemsPerSlide: 3,
      gutter: 24,
    });

  return (
    <div
      className="wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: "1",
        }}
      >
        <button onClick={slideToPrevItem}>PREV</button>
        <div
          className="carousel-wrapper"
          style={{
            flex: "1",
          }}
        >
          {carouselFragment}
        </div>
        <button onClick={slideToNextItem}>NEXT</button>
      </div>
      <div
        style={{
          border: "4px solid brown",
          height: "80px",
        }}
      >
        {thumbsFragment}
      </div>
    </div>
  );
}
