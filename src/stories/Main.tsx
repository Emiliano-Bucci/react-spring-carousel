import React from "react";

import { useSpringCarousel } from "../../lib";
import "./main.css";

function generateRGBA(index: number) {
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
  const { carouselFragment, slideToPrevItem, slideToNextItem, carouselId } =
    useSpringCarousel({
      withLoop: true,
      slideType: "fluid",
      items: Array(100)
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
      <div className="carousel-container">
        <style>
          {`html:root {
                --${carouselId}-react-spring-carousel-items-per-slide: 2;
                --${carouselId}-react-spring-carousel-item-gutter: 12px;
                --${carouselId}-react-spring-carousel-start-end-gutter: 40px;
              }
              `}
        </style>
        {carouselFragment}
      </div>
      <button onClick={slideToNextItem}>prev</button>
    </div>
  );
}
