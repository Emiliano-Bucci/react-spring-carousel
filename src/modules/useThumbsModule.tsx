import { useSpring } from '@react-spring/web'
import { useRef } from 'react'

import {
  ItemWithThumb,
  PrepareThumbsData,
  RenderItemProps,
  SpringCarouselWithThumbs,
} from '../types'

type Props<T extends 'use-spring' | 'use-transition'> = {
  withThumbs?: boolean
  thumbsSlideAxis: SpringCarouselWithThumbs['thumbsSlideAxis']
  prepareThumbsData?: PrepareThumbsData<T>
  items: ItemWithThumb<T>[]
  renderThumbFnProps: RenderItemProps<T>
}

function isInViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

export function useThumbsModule<T extends 'use-spring' | 'use-transition'>({
  thumbsSlideAxis = 'x',
  withThumbs = false,
  prepareThumbsData,
  items,
  renderThumbFnProps,
}: Props<T>) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [spring, setSpring] = useSpring(() => ({
    val: 0,
  }))

  function getTotalScrollValue() {
    return Math.round(
      Number(
        wrapperRef.current?.[thumbsSlideAxis === 'x' ? 'scrollWidth' : 'scrollHeight'],
      ) -
        wrapperRef.current!.getBoundingClientRect()[
          thumbsSlideAxis === 'x' ? 'width' : 'height'
        ],
    )
  }

  function handleScroll(activeItem: number) {
    function getThumbNode() {
      if (wrapperRef.current) {
        return wrapperRef.current.querySelector(
          `#thumb-item-${items[activeItem].id}`,
        ) as HTMLElement
      }
      return null
    }

    const thumbNode = getThumbNode()
    if (thumbNode && wrapperRef.current) {
      if (!isInViewport(thumbNode)) {
        const offset = thumbNode.offsetLeft
        const val = offset > getTotalScrollValue() ? getTotalScrollValue() : offset

        setSpring.start({
          from: {
            val:
              wrapperRef.current?.[
                thumbsSlideAxis === 'x' ? 'scrollLeft' : 'scrollTop'
              ] ?? 0,
          },
          to: {
            val,
          },
          onChange: ({ value }) => {
            if (wrapperRef.current) {
              wrapperRef.current[thumbsSlideAxis === 'x' ? 'scrollLeft' : 'scrollTop'] =
                Math.abs(value.val)
            }
          },
        })
      }
    }
  }

  function handlePrepareThumbsData() {
    function getPreparedItems(
      _items: ReturnType<PrepareThumbsData<T>>,
    ): ReturnType<PrepareThumbsData<T>> {
      return _items.map(i => ({
        id: i.id,
        renderThumb: i.renderThumb,
      }))
    }

    if (prepareThumbsData) {
      return prepareThumbsData(getPreparedItems(items))
    }
    return getPreparedItems(items)
  }

  const thumbsFragment = withThumbs ? (
    <div
      className="use-spring-carousel-thumbs-wrapper"
      ref={wrapperRef}
      onWheel={() => spring.val.stop()}
      style={{
        display: 'flex',
        flex: '1',
        position: 'relative',
        width: '100%',
        height: '100%',
        flexDirection: thumbsSlideAxis === 'x' ? 'row' : 'column',
        ...(thumbsSlideAxis === 'x'
          ? { overflowX: 'auto' }
          : {
              overflowY: 'auto',
              maxHeight: '100%',
            }),
      }}
    >
      {handlePrepareThumbsData().map(({ id, renderThumb }) => {
        const thumbId = `thumb-item-${id}`
        return (
          <div key={thumbId} id={thumbId} className="thumb-item">
            {typeof renderThumb === 'function'
              ? renderThumb(renderThumbFnProps)
              : renderThumb}
          </div>
        )
      })}
    </div>
  ) : null

  return {
    thumbsFragment,
    handleScroll,
  }
}
