import { useImageUpload } from "@/components/canvas/use-img-upload"
import { CanvasController } from "@/lib/canvas/core/canvas-controller"
import { ImageObject } from "@/lib/canvas/objects/image"
import { Camera } from "@/types"
import { useCallback, useEffect } from "react"

// useCanvasImg.ts
interface UseCanvasImgOptions {
  canvas: React.RefObject<HTMLCanvasElement>
  controller: CanvasController | null
  camera: Camera | null
}

export function useCanvasImg({
  canvas,
  controller,
  camera,
}: UseCanvasImgOptions) {
  const {
    handlePaste,
    handleDrop: handleImgDrop,
    error,
    isLoading,
  } = useImageUpload()

  const addImageObject = useCallback(
    (imgData: string) => {
      if (!canvas.current || !controller || !camera) return

      // Convert center of viewport to world coordinates
      const viewportCenter = {
        x: canvas.current.width / 2,
        y: canvas.current.height / 2,
      }

      const worldPos = controller.coordinateSystem.screenToWorld(
        viewportCenter,
        camera
      )

      // Create image at world position with small random offset
      const offset = {
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
      }

      const newImg = new ImageObject(
        imgData,
        {
          x: worldPos.x + offset.x,
          y: worldPos.y + offset.y,
        },
        () => {
          // Trigger re-render only after image loads
          controller.render()
        }
      )

      controller.addObject(newImg)
    },
    [canvas, controller, camera]
  )

  const handleGlobalPaste = useCallback(
    async (e: ClipboardEvent) => {
      try {
        const images = await handlePaste(e)
        images.forEach(addImageObject)
      } catch (error) {
        console.error("Clipboard error:", error)
      }
    },
    [handlePaste, addImageObject]
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      const images = await handleImgDrop(e)
      images.forEach(addImageObject)
    },
    [handleImgDrop, addImageObject]
  )

  useEffect(() => {
    document.addEventListener("paste", handleGlobalPaste)
    return () => {
      document.removeEventListener("paste", handleGlobalPaste)
    }
  }, [handleGlobalPaste])

  return {
    addImageObject,
    handleGlobalPaste,
    handleDrop,
    error,
    isLoading,
  }
}
