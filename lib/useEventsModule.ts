import { useEffect, useRef } from "react";

import {
  SpringCarouselEvents,
  SpringCarouselEventsEventHandler,
} from "./types";

const eventLabel = "RSC::Event";

type EventsModule = {
  useListenToCustomEvent: (
    eventHandler: SpringCarouselEventsEventHandler,
  ) => void;
  emitEvent: (event: SpringCarouselEvents) => void;
};

export function useEventsModule(): EventsModule {
  const targetEvent = useRef<HTMLDivElement | null>(null);
  const moduleRef = useRef<EventsModule | null>(null);

  if (moduleRef.current === null) {
    moduleRef.current = {
      useListenToCustomEvent(eventHandler) {
        useEffect(() => {
          if (!targetEvent.current) {
            targetEvent.current = document.createElement("div");
          }

          function handleEvent(_event: Event) {
            const event = _event as CustomEvent<SpringCarouselEvents>;
            eventHandler(event.detail);
          }

          targetEvent.current.addEventListener(eventLabel, handleEvent, false);
          return () => {
            targetEvent.current?.removeEventListener(
              eventLabel,
              handleEvent,
              false,
            );
          };
        }, [eventHandler]);
      },
      emitEvent(event) {
        if (targetEvent.current) {
          const newEvent = new CustomEvent(eventLabel, {
            detail: event,
          });
          targetEvent.current.dispatchEvent(newEvent);
        }
      },
    };
  }

  return moduleRef.current;
}
