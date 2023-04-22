import { useRef, useEffect } from 'react'
import screenfull from 'screenfull'
import { FullscreenModule } from '../types/useFullscreenModule.types'

export function useFullscreenModule({
  mainCarouselWrapperRef,
  onFullScreenChange,
  handleResize,
}: FullscreenModule) {
  const isFullscreen = useRef(false)

  useEffect(() => {
    function handleFullscreenChange() {
      if (document.fullscreenElement) {
        setIsFullscreen(true)
        onFullScreenChange(true)
        handleResize && handleResize()
      }

      if (!document.fullscreenElement) {
        setIsFullscreen(false)
        onFullScreenChange(false)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
