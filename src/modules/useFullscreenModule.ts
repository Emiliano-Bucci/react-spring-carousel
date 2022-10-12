import { useRef, MutableRefObject, useEffect } from 'react'
import screenfull from 'screenfull'
import { EmitEvent } from './useEventsModule'

type FullscreenModule = {
  mainCarouselWrapperRef: MutableRefObject<HTMLDivElement | null>
  emitEvent: EmitEvent
  handleResize?(): void
}

export function useFullscreenModule({
  mainCarouselWrapperRef,
  emitEvent,
  handleResize,
}: FullscreenModule) {
  const isFullscreen = useRef(false)

  useEffect(() => {
    function handleFullscreenChange() {
      if (document.fullscreenElement) {
        setIsFullscreen(true)
        emitEvent({
          eventName: 'onFullscreenChange',
          isFullscreen: true,
        })

        handleResize && handleResize()
      }

      if (!document.fullscreenElement) {
        setIsFullscreen(false)
        emitEvent({
          eventName: 'onFullscreenChange',
          isFullscreen: false,
        })
        handleResize && handleResize()
      }
    }

    if (screenfull.isEnabled) {
      screenfull.on('change', handleFullscreenChange)
      return () => {
        if (screenfull.isEnabled) {
          screenfull.off('change', handleFullscreenChange)
        }
      }
    }
  }, [])

  function setIsFullscreen(_isFullscreen: boolean) {
    isFullscreen.current = _isFullscreen
  }

  function getIsFullscreen() {
    return isFullscreen.current
  }

  function enterFullscreen(elementRef?: HTMLElement) {
    if (screenfull.isEnabled) {
      screenfull.request((elementRef || mainCarouselWrapperRef.current) as Element)
    }
  }

  function exitFullscreen() {
    screenfull.isEnabled && screenfull.exit()
  }

  return {
    enterFullscreen,
    exitFullscreen,
    getIsFullscreen,
  }
}
