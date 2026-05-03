import { useEffect, useRef } from "react";

import {
  SpringCarouselEvents,
  SpringCarouselEventsEventHandler,
} from "./types";

type EventsModule = {
  useListenToCustomEvent: (
    eventHandler: SpringCarouselEventsEventHandler,
  ) => void;
  emitEvent: (event: SpringCarouselEvents) => void;
};

export function useEventsModule(): EventsModule {
  const listenersRef = useRef<Set<SpringCarouselEventsEventHandler> | null>(
    null,
  );
  if (listenersRef.current === null) {
    listenersRef.current = new Set();
  }

  const moduleRef = useRef<EventsModule | null>(null);
  if (moduleRef.current === null) {
    moduleRef.current = {
      useListenToCustomEvent(eventHandler) {
        useEffect(() => {
          const listeners = listenersRef.current!;
          listeners.add(eventHandler);
          return () => {
            listeners.delete(eventHandler);
          };
        }, [eventHandler]);
      },
      emitEvent(event) {
        const listeners = listenersRef.current;
        if (!listeners || listeners.size === 0) return;
        listeners.forEach((handler) => handler(event));
      },
    };
  }

  return moduleRef.current;
}
