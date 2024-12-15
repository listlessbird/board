import { useRef, useEffect } from "react"
import Stats from "stats.js"
export function useAnimationFrame(
  callback: () => void,
  deps: React.DependencyList,
  enableStats: boolean = false
) {
  const frameRef = useRef<number>(null)
  const statsRef = useRef<Stats>(null)

  useEffect(() => {
    if (!enableStats) return

    const stats = new Stats()
    statsRef.current = stats
    stats.showPanel(0)
    stats.dom.style.left = "unset"
    stats.dom.style.right = "0"
    document.body.appendChild(stats.dom)

    return () => {
      document.body.removeChild(stats.dom)
      statsRef.current = null
    }
  }, [enableStats])

  useEffect(() => {
    const animate = () => {
      statsRef.current?.begin()

      callback()

      statsRef.current?.end()
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, deps)
}
