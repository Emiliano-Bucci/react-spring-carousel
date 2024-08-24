import React from "react";

import { useSpringCarousel } from "../../lib";
import "./main.css";

const items = [
  {
    id: "item-1",
    renderItem: <div>Item 1</div>,
  },
  {
    id: "item-2",
    renderItem: <div>Item 2</div>,
  },
  {
    id: "item-3",
    renderItem: <div>Item 3</div>,
  },
];

export function Main() {
  const { carouselFragment, slideToPrevItem, slideToNextItem } =
    useSpringCarousel({
      items: items,
    });

  return (
    <div className="wrapper">
      <button onClick={() => slideToPrevItem()}>Prev</button>
      <div className="carousel-container">{carouselFragment}</div>
      <button onClick={() => slideToNextItem()}>Next</button>
    </div>
  );
}
