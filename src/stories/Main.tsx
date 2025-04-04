import React, { useState } from "react";

import { useSpringCarousel } from "../../lib/useSpringCarousel";
import "./main.css";

export function generateRGBA(index: number) {
  // Seed the random number generator with the given index
  function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Generate random values for red, green, blue, and alpha channels
  const r = Math.floor(seededRandom(index) * 256);
  const g = Math.floor(seededRandom(index + 1) * 256);
  const b = Math.floor(seededRandom(index + 2) * 256);
  const a = seededRandom(index + 3).toFixed(2); // Alpha is a float between 0 and 1

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function Main() {
  const [activeItem, setActiveItem] = useState(0);
  const {
    carouselFragment,
    slideToNextItem,
    slideToPrevItem,
    useListenToCustomEvent,
    getItemsPerSlide,
  } = useSpringCarousel({
    id: "carousel-test",
    withLoop: true,
    startingPosition: "end",
    itemsPerSlide: [
      {
        breakpoint: 0,
        itemsPerSlide: 1,
      },
      {
        breakpoint: 576,
        itemsPerSlide: 5,
      },
      {
        breakpoint: 992,
        itemsPerSlide: 3,
      },
    ],
    gutter: [
      {
        breakpoint: 768,
        gutter: 24,
        startEndGutter: 24,
      },
    ],
    items: Array(20)
      .fill(0)
      .map((_, i) => ({
        id: `item-${i}`,
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
    if (ev.eventName === "onSlideStartChange") {
      setActiveItem(ev.nextItem.index);
    }
  });

  const currentItemsPerSlide = getItemsPerSlide();

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
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        Active Item: {activeItem + 1} | Items Per Slide: {currentItemsPerSlide}
      </div>
    </div>
  );
}
