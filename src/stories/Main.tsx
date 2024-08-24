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
  {
    id: "item-4",
    renderItem: <div>Item 4</div>,
  },
  {
    id: "item-5",
    renderItem: <div>Item 5</div>,
  },
  {
    id: "item-6",
    renderItem: <div>Item 6</div>,
  },
];

export function Main() {
  const {
    carouselFragment,
    slideToPrevItem,
    slideToNextItem,
    useListenToCustomEvent,
  } = useSpringCarousel({
    items: items,
    slideType: "fluid",
  });

  useListenToCustomEvent((ev) => {
    console.log(ev);
  });

  return (
    <div className="wrapper">
      <button onClick={() => slideToPrevItem()}>Prev</button>
      <div className="carousel-container">{carouselFragment}</div>
      <button onClick={() => slideToNextItem()}>Next</button>
    </div>
  );
}
