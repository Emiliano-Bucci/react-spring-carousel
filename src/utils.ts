import { useRef, useEffect } from 'react'

type Callback = () => void | (() => void)

export function useMount(callback: Callback) {
  const isMounted = useRef(false)

  useEffect(() => {
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
