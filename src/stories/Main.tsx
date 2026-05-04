import React, { useState } from "react";

import { Props } from "../../lib/types";
import { useSpringCarousel } from "../../lib/useSpringCarousel";
import "./main.css";

// Seed the random number generator with the given index
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function generateRGBA(index: number) {
  // Generate random values for red, green, blue, and alpha channels
  const r = Math.floor(seededRandom(index) * 256);
  const g = Math.floor(seededRandom(index + 1) * 256);
  const b = Math.floor(seededRandom(index + 2) * 256);
  const a = seededRandom(index + 3).toFixed(2); // Alpha is a float between 0 and 1

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function Main({
  itemsQuantity = 10,
  ...props
}: Omit<Props, "items" | "id"> & {
  itemsQuantity: number;
}) {
  const [activeItem, setActiveItem] = useState(props.initialActiveItem || 0);
  const {
    carouselFragment,
    slideToNextItem,
    slideToPrevItem,
    useListenToCustomEvent,
  } = useSpringCarousel({
    ...props,
    id: "carousel-test",
    initialActiveItem: `item-${activeItem + 1}`,
    items: Array(itemsQuantity)
      .fill(0)
      .map((_, i) => ({
        id: `item-${i + 1}`,
        renderItem: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: generateRGBA(i),
              padding: "24px",
              width: "100%",
            }}
          >
            Item {i + 1}
          </div>
        ),
      })),
  });

  useListenToCustomEvent((ev) => {
    if (ev.eventName === "onSlideChangeComplete") {
      console.log(ev);
      setActiveItem(ev.currentItem.index);
    }
  });

  console.log({ activeItem });

  return (
    <div className="container">
      <button onClick={slideToPrevItem}>prev</button>
      <div className="carousel-root">{carouselFragment}</div>
      <button
        onClick={() => {
          slideToNextItem();
        }}
      >
        next
      </button>
    </div>
  );
}
