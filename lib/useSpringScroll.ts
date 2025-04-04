import { useSpring } from "@react-spring/web";
import { RefObject, useEffect, useRef } from "react";

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

function getScrollAmount(_container: HTMLElement) {
  const element = _container.children[0] as HTMLElement;
  const gap = getGap(_container);
  return element.getBoundingClientRect().width + gap;
}

type Reach = "start" | "end" | "idle";

type Props = {
  container: RefObject<HTMLDivElement | null>;
  onReach?(type: Reach): void;
};

export function useSpringScroll({ container, onReach }: Props) {
  const reachRef = useRef<Reach>("start");
  const activeItem = useRef(0);
  const [, setSpring] = useSpring(() => ({
    x: 0,
  }));

  function animateTo(to: number) {
    setSpring.start({
      from: {
        x: container.current!.scrollLeft,
      },
      to: {
        x: to,
      },
      onChange({ value }) {
        if (container.current) {
          container.current.scrollLeft = value.x;
        }
      },
    });
  }

  function handleScroll(type: "prev" | "next") {
    if (
      !container.current ||
      (type === "next" && reachRef.current === "end") ||
      (type === "prev" && reachRef.current === "start")
    ) {
      return;
    }

    let toValue = 0;

    if (type === "next") activeItem.current += 1;
    if (type === "prev") activeItem.current -= 1;

    toValue = activeItem.current * getScrollAmount(container.current!);

    if (type === "next") {
      const availableSpace = getScrollAvailableSpace(container.current!);

      if (toValue > availableSpace) {
        reachRef.current = "end";
        toValue = availableSpace;

        if (onReach) {
          onReach("end");
        }
      }
    }
    if (type === "prev" && toValue <= 0) {
      reachRef.current = "start";
      activeItem.current = 0;
      toValue = 0;

      if (onReach) {
        onReach("start");
      }
    }

    animateTo(toValue);
  }

  useEffect(() => {
    function calculateActiveItem() {
      const totalItems = Array(container.current!.childElementCount)
        .fill(0)
        .map((_, i) => {
          return {
            index: i + 1,
            start: (getScrollAmount(container.current!) - 50) * (i + 1),
            end: (getScrollAmount(container.current!) - 50) * (i + 2),
          };
        });

      const selectedActiveItem = totalItems.find(
        (i) =>
          container.current!.scrollLeft >= i.start &&
          container.current!.scrollLeft <= i.end,
      );

      activeItem.current = selectedActiveItem?.index || 0;
    }
    function stopSpringOnWheel() {
      setSpring.stop();
    }
    function handleScroll(ev: Event) {
      const el = ev.target as HTMLElement;

      if (el.scrollLeft === 0) {
        activeItem.current = 0;
        reachRef.current = "start";
        if (onReach) {
          onReach("start");
        }
      } else if (el.scrollLeft >= getScrollAvailableSpace(el)) {
        reachRef.current = "end";
        if (onReach) {
          onReach("end");
        }
      } else if (reachRef.current !== "idle") {
        reachRef.current = "idle";
        if (onReach) {
          onReach("idle");
        }
      }
    }
    let scrollTimeout: NodeJS.Timeout;
    let lastScrollPos = 0;

    function handleScrollEnd() {
      const currentPos = container.current!.scrollLeft;

      // Update position
      lastScrollPos = currentPos;

      // Clear previous timeout
      clearTimeout(scrollTimeout);

      // Set a timeout to check if scrolling has ended
      scrollTimeout = setTimeout(function () {
        // After timeout, check if position has changed since timeout was set
        if (container.current!.scrollLeft === lastScrollPos) {
          calculateActiveItem();
        }
      }, 300);
    }

    if (container.current) {
      container.current.addEventListener("wheel", stopSpringOnWheel, {
        passive: true,
      });
      container.current.addEventListener("scroll", handleScroll);
      container.current.addEventListener("scroll", handleScrollEnd);
      return () => {
        if (container.current) {
          container.current.removeEventListener("scroll", handleScrollEnd);
          container.current.removeEventListener("scroll", handleScroll);
          container.current.removeEventListener("wheel", stopSpringOnWheel);
        }
      };
    }
  }, [container, onReach]);
  useEffect(() => {
    if (container.current) {
      const rObserver = new ResizeObserver(() => {
        animateTo(activeItem.current * getScrollAmount(container.current!));
      });
      rObserver.observe(container.current);
      return () => {
        rObserver.disconnect();
      };
    }
  }, []);

  return {
    scrollToNext() {
      handleScroll("next");
    },
    scrollToPrev() {
      handleScroll("prev");
    },
  };
}
