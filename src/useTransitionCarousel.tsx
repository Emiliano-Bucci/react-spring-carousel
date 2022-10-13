import { config, useTransition } from '@react-spring/web'
import { useRef, useState } from 'react'
import { SlideActionType } from './types/common'
import { UseTransitionCarouselProps } from './types/useTransitionCarousel.types'

export function useTransitionCarousel({
  init = true,
  disableGestures = false,
  items,
  initialActiveItem = 0,
  springConfig = config.default,
  exitBeforeEnter = false,
  trail,
  animationProps = {
    initial: {
      opacity: 1,
      position: 'absolute',
    },
    from: {
      opacity: 0,
      position: 'absolute',
    },
    enter: {
      opacity: 1,
      position: 'absolute',
    },
    leave: {
      opacity: 0,
      position: 'absolute',
    },
  },
}: UseTransitionCarouselProps) {
  const [activeItem, setActiveItem] = useState(initialActiveItem)
  const slideActionType = useRef<SlideActionType>('initial')

  function getConfig() {
    if (slideActionType.current === 'prev') {
      return {
        initial: {
          ...animationProps.initial,
        },
        from: {
          ...animationProps.from,
        },
        enter: {
          ...animationProps.enter,
        },
        leave: {
          ...animationProps.leave,
        },
      }
    }
    if (slideActionType.current === 'next') {
      return {
        initial: {
          ...animationProps.initial,
        },
        from: {
          ...animationProps.from,
        },
        enter: {
          ...animationProps.enter,
        },
        leave: {
          ...animationProps.leave,
        },
      }
    }
    return {
      initial: {
        ...animationProps.initial,
      },
      from: {
        ...animationProps.from,
      },
      enter: {
        ...animationProps.enter,
      },
      leave: {
        ...animationProps.leave,
      },
    }
  }

  const transitions = useTransition(activeItem, {
    config: springConfig,
    key: items[activeItem].id,
    trail,
    exitBeforeEnter,
    ...getConfig(),
  })

  return {}
}
