import { useSpring } from "@react-spring/web";
import { useRef } from "react";

import { Props } from "./types";
import { CarouselAxis } from "./types/index";
import { pFloat } from "./utils";

type AnimateItem = {
  shouldAnimate?: boolean;
  type: "prev" | "next";
};

function getScrollAmountValue(
  container: HTMLElement,
  carouselAxis: CarouselAxis,
  gutter: number,
) {
  const firstItem = container.children[0] as HTMLElement;
  let total = 0;

  total =
    pFloat(
      firstItem.getBoundingClientRect()[
        carouselAxis === "x" ? "width" : "height"
      ],
    ) + gutter;

  return total;
}

export function useSpringCarousel({
  init = true,
  items,
  withLoop = false,
  id,
  itemsPerSlide = 1,
  gutter = 0,
  carouselAxis = "x",
  slideType = "fixed",
}: Props) {
  const carouselIsInitialized = useRef(init);

  const carouselContainerRef = useRef<HTMLDivElement | null>(null);
  const carouselTrackRef = useRef<HTMLDivElement | null>(null);
  const totalScrolledAmount = useRef(0);

  const startReached = useRef<boolean | undefined>(true);
  const endReached = useRef<boolean | undefined>(false);

  const [spring, setSpring] = useSpring(
    () => ({
      value: 0,
      onChange({ value }) {
        if (slideType === "fixed" || slideType === "fluid") {
          if (carouselAxis === "x") {
            carouselContainerRef.current!.style.setProperty(
              `--${id}-scroll-x-value`,
              `${value.value}px`,
            );
          } else {
            carouselContainerRef.current!.style.setProperty(
              `--${id}-scroll-y-value`,
              `${value.value}px`,
            );
          }
        }
        // if (slideType === "freeScroll") {
        //   carouselTrackRef.current![
        //     carouselAxis === "x" ? "scrollLeft" : "scrollTop"
        //   ] = Math.abs(value.value);
        // }
      },
    }),
    [carouselAxis],
  );

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

  function handleSlideToNextItem() {
    if (!carouselIsInitialized.current) {
      return;
    }

    animateItem({
      type: "next",
    });
  }
  function handleSlideToPrevItem() {
    if (!carouselIsInitialized.current) {
      return;
    }

    animateItem({
      type: "prev",
    });
  }

  function animateItem({ type }: AnimateItem) {
    startReached.current = false;
    endReached.current = false;

    const fromValue = spring.value.get();
    let toValue = 0;

    if (type === "next") {
      toValue =
        -getScrollAmountValue(carouselTrackRef.current!, carouselAxis, gutter) +
        totalScrolledAmount.current;
    }
    if (type === "prev") {
      toValue =
        totalScrolledAmount.current +
        getScrollAmountValue(carouselTrackRef.current!, carouselAxis, gutter);
    }

    totalScrolledAmount.current = toValue;

    setSpring.start({
      from: {
        value: fromValue,
      },
      to: {
        value: toValue,
      },
    });
  }

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
              --${id}-gutter: ${gutter}px;
              --${id}-items-per-slide: ${itemsPerSlide};
              --${id}-offset-position: 0px;
              --${id}-scroll-x-value: ${slideType === "fixed" && carouselAxis === "x" ? `var(--${id}-offset-position)` : "0px"};
              --${id}-scroll-y-value: ${slideType === "fixed" && carouselAxis === "y" ? `var(--${id}-offset-position)` : "0px"};
            }
            [data-part-internal="${id}-Track"] {
              display: flex;
              width: 100%;
              height: 100%;
              gap: var(--${id}-gutter);
              transform: translate3d(var(--${id}-scroll-x-value), var(--${id}-scroll-y-value), 0px);
            }
            [data-part-internal="${id}-Item"] {
              flex: 1 0 calc(100% / var(--${id}-items-per-slide) - calc(var(--${id}-gutter) * (var(--${id}-items-per-slide) - 1)) / var(--${id}-items-per-slide));
            }
          `,
        }}
      />
      <div
        ref={carouselTrackRef}
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
              data-part-internal={`${id}-Item`}
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
    slideToNextItem: handleSlideToNextItem,
    slideToPrevItem: handleSlideToPrevItem,
  };
}
