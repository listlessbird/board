import { useImageUpload } from "@/components/canvas/use-img-upload"
import { BaseObject } from "@/lib/canvas/objects/base"
import { ImageObject } from "@/lib/canvas/objects/image"
import { Dispatch, SetStateAction, useCallback, useEffect } from "react"

interface UseCanvasImgOptions {
  canvas: React.RefObject<HTMLCanvasElement>
  objects: BaseObject[]
  setObjects: Dispatch<SetStateAction<BaseObject[]>>
}
export function useCanvasImg({
  canvas,
  objects,
  setObjects,
}: UseCanvasImgOptions) {
  const {
    handlePaste,
    handleDrop: handleImgDrop,
    error,
    isLoading,
  } = useImageUpload()

  const addImageObject = useCallback(
    (imgData: string) => {
      if (!canvas.current) return

      const offset = 20 * (objects.length % 5)

      const newImg = new ImageObject(
        imgData,
        {
          x: canvas.current.width / 2 + offset,
          y: canvas.current.height / 2 + offset,
        },
        () => {
          setObjects((prev) => [...prev])
        }
      )

      setObjects([...objects, newImg])
    },
    [canvas, objects, setObjects]
  )

  const handleGlobalPaste = useCallback(
    async (e: ClipboardEvent) => {
      try {
        console.log("global paste ev: ", e)
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
  }
}
