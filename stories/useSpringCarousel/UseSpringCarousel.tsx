import React from "react";
import { useSpringCarousel } from "../../src/useSpringCarousel";
import { mockedItems } from "../../src/mockedItems";

export function UseSpringCarousel() {
  const { carouselFragment } = useSpringCarousel({
    items: mockedItems,
  });

  return <div>{carouselFragment}</div>;
}
