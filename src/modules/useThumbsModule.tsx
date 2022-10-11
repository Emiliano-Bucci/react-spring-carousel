import { useSpring } from "@react-spring/web";
import React, { useRef } from "react";
import {
  SpringCarouselWithThumbs,
  PrepareThumbsData,
} from "../types/useSpringCarousel";
import { SlideActionType } from "../types/common";

type OffsetDimension = "offsetWidth" | "offsetHeight";
type OffsetDirection = "offsetLeft" | "offsetTop";
type ScrollDirection = "scrollLeft" | "scrollTop";

type Props = {
  withThumbs?: boolean;
  thumbsSlideAxis: SpringCarouselWithThumbs["thumbsSlideAxis"];
  prepareThumbsData?: PrepareThumbsData;
  items: SpringCarouselWithThumbs["items"];
};

function isInViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function useThumbsModule({
  thumbsSlideAxis = "x",
  withThumbs = false,
  prepareThumbsData,
  items,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [spring, setSpring] = useSpring(() => ({
    val: 0,
  }));

  function handleScroll(activeItem: number, slideActionType: SlideActionType) {
    function getThumbNode() {
      if (wrapperRef.current) {
        return wrapperRef.current.querySelector(
          `#thumb-item-${items[activeItem].id}`
        ) as HTMLElement;
      }
      return null;
    }

    const thumbNode = getThumbNode();
    if (thumbNode && wrapperRef.current) {
      if (!isInViewport(thumbNode)) {
        console.log(thumbNode.offsetLeft);
        setSpring.start({
          val: thumbNode.offsetLeft,
          onChange: ({ value }) => {
            if (wrapperRef.current) {
              wrapperRef.current[
                thumbsSlideAxis === "x" ? "scrollLeft" : "scrollTop"
              ] = Math.abs(value.val);
            }
          },
        });
      }
    }
  }

  function handlePrepareThumbsData() {
    function getPreparedItems(
      _items: ReturnType<PrepareThumbsData>
    ): ReturnType<PrepareThumbsData> {
      return _items.map((i) => ({
        id: i.id,
        renderThumb: i.renderThumb,
      }));
    }

    if (prepareThumbsData) {
      return prepareThumbsData(getPreparedItems(items));
    }
    return getPreparedItems(items);
  }

  const thumbsFragment = withThumbs ? (
    <div
      className="use-spring-carousel-thumbs-wrapper"
      ref={wrapperRef}
      onWheel={() => spring.val.stop()}
      style={{
        display: "flex",
        flex: "1",
        position: "relative",
        width: "100%",
        height: "100%",
        flexDirection: thumbsSlideAxis === "x" ? "row" : "column",
        ...(thumbsSlideAxis === "x"
          ? { overflowX: "auto" }
          : {
              overflowY: "auto",
              maxHeight: "100%",
            }),
      }}
    >
      {handlePrepareThumbsData().map(({ id, renderThumb }) => {
        const thumbId = `thumb-item-${id}`;
        return (
          <div key={thumbId} id={thumbId} className="thumb-item">
            {renderThumb}
          </div>
        );
      })}
    </div>
  ) : null;

  return {
    thumbsFragment,
    handleScroll,
  };
}

// function handleScroll(activeItem: number, slideActionType: SlideActionType) {
//   function getOffsetDirection() {
//     return thumbsSlideAxis === "x" ? "offsetLeft" : "offsetTop";
//   }
//   function getOffsetDimension() {
//     return thumbsSlideAxis === "x" ? "offsetWidth" : "offsetHeight";
//   }
//   function getScrollDirecton() {
//     return thumbsSlideAxis === "x" ? "scrollLeft" : "scrollTop";
//   }
//   function getThumbNode() {
//     if (wrapperRef.current) {
//       return wrapperRef.current.querySelector(
//         `#thumb-item-${items[activeItem].id}`
//       ) as HTMLElement;
//     }
//     return null;
//   }
//   function getThumbOffsetPosition({
//     thumbNode,
//     offsetDirection,
//     offsetDimension,
//   }: {
//     thumbNode: HTMLElement;
//     offsetDirection: OffsetDirection;
//     offsetDimension: OffsetDimension;
//   }) {
//     return thumbNode[offsetDirection] + thumbNode[offsetDimension] / 2;
//   }
//   function getThumbScrollDimension({
//     thumbWrapper,
//     offsetDimension,
//   }: {
//     thumbWrapper: HTMLDivElement;
//     offsetDimension: OffsetDimension;
//   }) {
//     return thumbWrapper[offsetDimension] / 2;
//   }
//   function getScrollFromValue({
//     thumbWrapper,
//     scrollDirection,
//   }: {
//     thumbWrapper: HTMLDivElement;
//     scrollDirection: ScrollDirection;
//   }) {
//     return thumbWrapper[scrollDirection];
//   }
//   function getScrollToValue({
//     thumbWrapper,
//     thumbOffsetPosition,
//     thumbScrollDimension,
//     offsetDimension,
//   }: {
//     thumbWrapper: HTMLDivElement;
//     thumbOffsetPosition: number;
//     thumbScrollDimension: number;
//     offsetDimension: OffsetDimension;
//   }) {
//     const scrollDimensionProperty =
//       thumbsSlideAxis === "x" ? "scrollWidth" : "scrollHeight";

//     if (
//       activeItem === items.length - 1 ||
//       thumbOffsetPosition - thumbScrollDimension >
//         thumbWrapper[scrollDimensionProperty] - thumbWrapper[offsetDimension]
//     ) {
//       return (
//         thumbWrapper[scrollDimensionProperty] - thumbWrapper[offsetDimension]
//       );
//     }
//     if (activeItem === 0) {
//       return 0;
//     }

//     return thumbOffsetPosition - thumbScrollDimension;
//   }

//   const thumbNode = getThumbNode();

//   if (thumbNode && wrapperRef.current) {
//     const thumbWrapper = wrapperRef.current;
//     const offsetDirection = getOffsetDirection();
//     const offsetDimension = getOffsetDimension();
//     const scrollDirection = getScrollDirecton();
//     const thumbOffsetPosition = getThumbOffsetPosition({
//       thumbNode,
//       offsetDimension,
//       offsetDirection,
//     });
//     const thumbScrollDimension = getThumbScrollDimension({
//       thumbWrapper,
//       offsetDimension,
//     });

//     const fromValue = getScrollFromValue({
//       thumbWrapper,
//       scrollDirection,
//     });
//     const toValue = getScrollToValue({
//       thumbWrapper,
//       thumbOffsetPosition,
//       thumbScrollDimension,
//       offsetDimension,
//     });

//     setSpring.start({
//       from: {
//         val: fromValue,
//       },
//       to: {
//         val: slideActionType === "prev" && toValue < 0 ? 0 : toValue,
//       },
//       onChange: ({ value }) => {
//         if (wrapperRef.current) {
//           wrapperRef.current[
//             thumbsSlideAxis === "x" ? "scrollLeft" : "scrollTop"
//           ] = Math.abs(value.val);
//         }
//       },
//     });
//   }
// }
