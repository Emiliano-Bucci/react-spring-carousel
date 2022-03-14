import { useRef, MutableRefObject } from 'react'
import screenfull from 'screenfull'
import { EmitObservableFn } from '../types'
import { useIsomorphicMount } from '../utils'

type FullscreenModule<T> = {
  mainCarouselWrapperRef: MutableRefObject<HTMLDivElement | null>
  emitObservable: EmitObservableFn<T>
  handleResize?(): void
}

export function useFullscreenModule<T>({
  mainCarouselWrapperRef,
  emitObservable,
  handleResize,
}: FullscreenModule<T>) {
  const isFullscreen = useRef(false)

  useIsomorphicMount(() => {
    function handleFullscreenChange() {
      if (document.fullscreenElement) {
        setIsFullscreen(true)
        emitObservable({
          eventName: 'onFullscreenChange',
          isFullscreen: true,
        })

        handleResize && handleResize()
      }

      if (!document.fullscreenElement) {
        setIsFullscreen(false)
        emitObservable({
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
  })

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
