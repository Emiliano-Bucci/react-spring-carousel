import React from "react";
import { useSpringCarousel } from "../../src/useSpringCarousel";
import { mockedItems } from "../../src/mockedItems";

export function UseSpringCarousel() {
  const {
    carouselFragment,
    slideToPrevItem,
    slideToNextItem,
    thumbsFragment,
    slideToItem,
    useListenToCustomEvent,
  } = useSpringCarousel({
    items: mockedItems.map((i) => ({
      ...i,
      renderThumb: <div>Thumb</div>,
    })),
    withThumbs: true,
    gutter: 24,
    slideType: "fluid",
  });

  useListenToCustomEvent((event) => {
    console.log(event);
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
        <button onClick={() => slideToItem(1)}>PREV</button>
        <div
          className="carousel-wrapper"
          style={{
            flex: "1",
          }}
        >
          {carouselFragment}
        </div>
        <button onClick={() => slideToItem(4)}>NEXT</button>
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
