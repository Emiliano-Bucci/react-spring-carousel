import { useEffect, useRef } from "react";

import {
  SpringCarouselEventsEventHandler,
  SpringCarouselEvents,
} from "./events";

const eventLabel = "RSC::Event";

export function useEventsModule() {
  const targetEvent = useRef<HTMLDivElement | null>(null);

  function useListenToCustomEvent(
    eventHandler: SpringCarouselEventsEventHandler
  ) {
    useEffect(() => {
      if (!targetEvent.current) {
        targetEvent.current = document.createElement("div");
      }

      function handleEvent(_event: Event) {
        const event = _event as CustomEvent<SpringCarouselEvents>;
        eventHandler(event.detail);
      }

      if (targetEvent.current) {
        targetEvent.current.addEventListener(eventLabel, handleEvent, false);
        return () => {
          targetEvent.current?.removeEventListener(
            eventLabel,
            handleEvent,
            false
          );
        };
      }
    }, [eventHandler]);
  }
  function emitEvent(event: SpringCarouselEvents) {
    if (targetEvent.current) {
      const newEvent = new CustomEvent(eventLabel, {
        detail: event,
      });
      targetEvent.current.dispatchEvent(newEvent);
    }
  }

  return {
    useListenToCustomEvent,
    emitEvent,
  };
}
