import { MutableRefObject } from 'react'
import { EmitObservableFn } from '../types'
declare type FullscreenModule = {
  mainCarouselWrapperRef: MutableRefObject<HTMLDivElement | null>
  emitObservable: EmitObservableFn
  handleResize?(): void
}
export declare function useFullscreenModule({
  mainCarouselWrapperRef,
  emitObservable,
  handleResize,
}: FullscreenModule): {
  enterFullscreen: (elementRef?: HTMLElement | undefined) => void
  exitFullscreen: () => void
  getIsFullscreen: () => boolean
}
export {}
