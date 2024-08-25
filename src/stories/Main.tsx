import React from "react";

import { useSpringCarousel } from "../../lib";
import "./main.css";

function generateRGBA(index: number) {
  // Seed the random number generator with the given index
  function seededRandom(seed: number) {
    let x = Math.sin(seed) * 10000;
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
  const {
    carouselFragment,
    slideToPrevItem,
    slideToNextItem,
    useListenToCustomEvent,
  } = useSpringCarousel({
    itemsPerSlide: 2,
    items: Array(10)
      .fill(0)
      .map((_, i) => ({
        id: `item-${i}`,
        renderItem: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "1",
              background: generateRGBA(i),
              padding: "24px",
            }}
          >
            Item {i + 1}
          </div>
        ),
      })),
  });

  useListenToCustomEvent((ev) => {
    console.log(ev);
  });

  return (
    <div className="container">
      <div className="wrapper">
        <button
          onClick={() => {
            slideToPrevItem();
          }}
        >
          Prev
        </button>
        <div className="carousel-container">{carouselFragment}</div>
        <button
          onClick={() => {
            // slideToIem(3);
            slideToNextItem();
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
