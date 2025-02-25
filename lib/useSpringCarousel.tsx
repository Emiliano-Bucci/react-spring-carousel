import { useRef } from "react";

import { Props } from "./types";

export function useSpringCarousel({
  init,
  items,
  withLoop = false,
  id,
}: Props) {
  const carouselIsInitialized = useRef(init);
  const carouselContainerRef = useRef<HTMLDivElement | null>(null);

  const groupedItems = withLoop
    ? [
        ...items.map((i) => ({
          ...i,
          id: `prev-repeated-item-${i.id}`,
        })),
        ...items,
        ...items.map((i) => ({
          ...i,
          id: `next-repeated-item-${i.id}`,
        })),
      ]
    : items;

  const carouselFragment = (
    <div
      ref={carouselContainerRef}
      className="ReactSpringCarouselContainer"
      data-part="Container"
      data-part-internal={`${id}-Container`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            [data-part-internal="${id}-Container"] {
              display: flex;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            [data-part-internal="${id}-Track"] {
              display: flex;
              width: 100%;
              height: 100%;
            }
          `,
        }}
      />
      <div
        className="ReactSpringCarouselTrack"
        data-part="Track"
        data-part-internal={`${id}-Track`}
      >
        {groupedItems.map((item, index) => {
          return (
            <div
              className="ReactSpringCarouselItem"
              data-part="Item"
              key={`${item.id}-${index}`}
            >
              {item.renderItem}
            </div>
          );
        })}
      </div>
    </div>
  );

  return {
    carouselFragment,
  };
}
