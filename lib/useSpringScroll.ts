import { useSpring } from "@react-spring/web";
import { RefObject, useEffect, useLayoutEffect, useRef } from "react";

import { getScrollTarget, ScrollReach } from "./scroll";

// Scroll positions this close to the end count as the end: fractional widths
// can leave the container a few pixels short of its maximum scroll.
const END_TOLERANCE_PX = 10;
const SCROLL_END_DELAY_MS = 200;

function getGap(container: HTMLElement) {
  let totalGap = 0;
  const cssGap = getComputedStyle(container).getPropertyValue("gap");

  if (cssGap.includes("px")) {
    totalGap = Number(cssGap.replace("px", ""));
  }

  return totalGap;
}

function getScrollAvailableSpace(_container: HTMLElement) {
  return _container.scrollWidth - _container.clientWidth;
}

function getScrollAmount(_container: HTMLElement, scrollAmountValue?: number) {
  if (typeof scrollAmountValue === "number") {
    return scrollAmountValue;
  }
  const element = _container.children[0];
  const gap = getGap(_container);
  return element.getBoundingClientRect().width + gap;
}

type Props = {
  container: RefObject<HTMLDivElement | null>;
  onReach?(type: ScrollReach): void;
  /** Fixed step of the arrows, instead of the first item width plus the gap. */
  scrollAmountValue?: number;
  /** Scroll position applied before the first paint, without animation. */
  initialScrollPosition?: number;
};

export function useSpringScroll({
  container,
  onReach,
  scrollAmountValue,
  initialScrollPosition,
}: Props) {
  const reachRef = useRef<ScrollReach>("start");
  const activeItem = useRef(0);
  // The listeners are attached once: they read the latest options from here,
  // so an inline `onReach` does not re-subscribe them on every render.
  const optionsRef = useRef({ onReach, scrollAmountValue });
  const [, setSpring] = useSpring(() => ({
    x: 0,
  }));

  useLayoutEffect(() => {
    optionsRef.current = { onReach, scrollAmountValue };
  });

  function emitReach(reach: ScrollReach) {
    reachRef.current = reach;
    optionsRef.current.onReach?.(reach);
  }

  function animateTo(to: number, immediate = false) {
    setSpring.start({
      from: {
        x: container.current!.scrollLeft,
      },
      to: {
        x: to,
      },
      immediate,
      onChange({ value }) {
        if (container.current) {
          container.current.scrollLeft = value.x;
        }
      },
    });
  }

  function handleScroll(direction: "prev" | "next") {
    if (
      !container.current ||
      (direction === "next" && reachRef.current === "end") ||
      (direction === "prev" && reachRef.current === "start")
    ) {
      return;
    }

    const target = getScrollTarget({
      direction,
      activeItem: activeItem.current,
      scrollAmount: getScrollAmount(
        container.current,
        optionsRef.current.scrollAmountValue,
      ),
      availableSpace: getScrollAvailableSpace(container.current),
    });

    activeItem.current = target.activeItem;
    if (target.reach) {
      emitReach(target.reach);
    }

    animateTo(target.toValue);
  }

  useEffect(() => {
    const element = container.current;
    if (!element) {
      return;
    }

    function calculateActiveItem(_element: HTMLElement) {
      const scrollAmount = getScrollAmount(
        _element,
        optionsRef.current.scrollAmountValue,
      );
      const itemWidth =
        [..._element.children].at(0)?.getBoundingClientRect().width || 0;
      const totalItems = Array(_element.childElementCount)
        .fill(0)
        .map((_, i) => {
          return {
            index: i,
            start: scrollAmount * i,
            end: scrollAmount * (i + 1),
          };
        });

      const scrollToEvaluate = _element.scrollLeft + itemWidth;

      const selectedActiveItem = totalItems.find(
        (i) => scrollToEvaluate >= i.start && scrollToEvaluate < i.end,
      );

      activeItem.current = selectedActiveItem?.index || 0;
    }
    function stopSpringOnWheel() {
      setSpring.stop();
    }
    function handleScrollReach(ev: Event) {
      const el = ev.target as HTMLElement;

      if (el.scrollLeft === 0) {
        activeItem.current = 0;
        emitReach("start");
      } else if (
        el.scrollLeft >=
        getScrollAvailableSpace(el) - END_TOLERANCE_PX
      ) {
        emitReach("end");
      } else if (reachRef.current !== "idle") {
        emitReach("idle");
      }
    }
    let scrollTimeout: ReturnType<typeof setTimeout>;
    let lastScrollPos = 0;

    // Native scrolling (swipe, trackpad) moves the container without the
    // arrows: once it settles, the active item is read back from the position.
    function handleScrollEnd(ev: Event) {
      const el = ev.target as HTMLElement;
      lastScrollPos = el.scrollLeft;
      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(function () {
        if (el.scrollLeft === lastScrollPos) {
          calculateActiveItem(el);
        }
      }, SCROLL_END_DELAY_MS);
    }

    element.addEventListener("wheel", stopSpringOnWheel, {
      passive: true,
    });
    element.addEventListener("scroll", handleScrollReach);
    element.addEventListener("scroll", handleScrollEnd);
    return () => {
      clearTimeout(scrollTimeout);
      element.removeEventListener("scroll", handleScrollEnd);
      element.removeEventListener("scroll", handleScrollReach);
      element.removeEventListener("wheel", stopSpringOnWheel);
    };
  }, [container, setSpring]);

  useLayoutEffect(() => {
    if (typeof initialScrollPosition === "number" && container.current) {
      animateTo(initialScrollPosition, true);
    }
  }, [container, initialScrollPosition]);

  useEffect(() => {
    const element = container.current;
    if (!element) {
      return;
    }

    // The observer reports the initial size right away: skipping it keeps
    // `initialScrollPosition`, which is not an item boundary.
    let isFirstObservation = true;
    const rObserver = new ResizeObserver(() => {
      if (isFirstObservation) {
        isFirstObservation = false;
        return;
      }
      animateTo(
        activeItem.current *
          getScrollAmount(element, optionsRef.current.scrollAmountValue),
      );
    });
    rObserver.observe(element);
    return () => {
      rObserver.disconnect();
    };
  }, [container]);

  return {
    scrollToNext() {
      handleScroll("next");
    },
    scrollToPrev() {
      handleScroll("prev");
    },
  };
}
