import React, { useRef } from "react";

import { useSpringScroll } from "../../lib/useSpringScroll";
import "./springScroll.css";

type Props = {
  itemsQuantity?: number;
};

export function SpringScroll({ itemsQuantity = 10 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollToNext, scrollToPrev } = useSpringScroll({
    container: containerRef,
    onReach: (type) => {
      console.log("Reached:", type);
    },
  });

  return (
    <div className="scroll-container">
      <button onClick={() => scrollToPrev()}>Previous</button>
      <div className="scroll-items-container" ref={containerRef}>
        {Array(itemsQuantity)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="scroll-item">
              Item {i + 1}
            </div>
          ))}
      </div>
      <button onClick={() => scrollToNext()}>Next</button>
    </div>
  );
}
