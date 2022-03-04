import { useRef, useLayoutEffect, useEffect } from 'react'

type Callback = () => void | (() => void)

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

function useIsomorphicMount(callback: Callback) {
  const isMounted = useRef(false)

  useIsomorphicLayoutEffect(() => {
    if (!isMounted.current) {
      const clean = callback()
      isMounted.current = true

      return () => {
        clean && clean()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export { useIsomorphicLayoutEffect, useIsomorphicMount }
