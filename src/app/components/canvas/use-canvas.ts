import { useEffect, useState } from "react"

export function useCanvas({
  canvasRef,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement>
}) {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")

      if (ctx) {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        setContext(ctx)
      }
    }
  }, [canvasRef])

  useEffect(() => {
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1
      setDimensions({
        width: window.innerWidth * dpr,
        height: window.innerHeight * dpr,
      })

      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth * dpr
        canvasRef.current.height = window.innerHeight * dpr
        canvasRef.current.style.width = window.innerWidth + "px"
        canvasRef.current.style.height = window.innerHeight + "px"

        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
          ctx.scale(dpr, dpr)
        }
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [canvasRef])

  return { dimensions, context }
}
