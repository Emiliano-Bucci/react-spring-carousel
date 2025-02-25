import React from "react";

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
  const { carouselFragment, slideToNextItem, slideToPrevItem } =
    useSpringCarousel({
      id: "carousel-test",
      itemsPerSlide: 4,
      gutter: 24,
      withLoop: true,
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

  return (
    <div className="container">
      <button onClick={slideToPrevItem}>prev</button>
      <div className="carousel-root">{carouselFragment}</div>
      <button onClick={slideToNextItem}>next</button>
    </div>
  );
}
