import { useEffect, useId } from "react";
import { Props } from "./types";

export function useSpringCarousel({ init, items, slideType = "fixed" }: Props) {
  const carouselId = useId().replace(":", "").replace(":", "");

  useEffect(() => {
    if (init && items.length === 0) {
      console.warn(
        "Init is true but no items are available; carousel will not be initialized"
      );
    }
  }, []);

  const carouselFragment = (
    <>
      <style
        id={`carousel-container-${carouselId}`}
        dangerouslySetInnerHTML={{
          __html: `
            .carousel-${carouselId} {
              display: flex;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            .carousel-${carouselId} .use-spring-carousel-track {
              position: relative;
              display: flex;
              flex: 1;
            }
            .carousel-${carouselId} .use-spring-carousel-item {
              position: relative;
              display: flex;
              flex: 1;
              min-width: ${slideType === "fixed" ? "100%" : "auto"};
            }
          `.trim(),
        }}
      />
      <div className={`use-spring-carousel-container carousel-${carouselId}`}>
        <div className={`use-spring-carousel-track`}>
          {items.map((item, index) => {
            return (
              <div
                key={`${item.id}-${index}`}
                className="use-spring-carousel-item"
              >
                {item.renderItem}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  return { carouselFragment };
}
