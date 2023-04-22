import { MutableRefObject } from 'react'

export type FullscreenModule = {
  mainCarouselWrapperRef: MutableRefObject<HTMLDivElement | null>
  handleResize?(): void
  onFullScreenChange(isFullscreen: boolean): void
}
