import { useCallback, useState } from "react"

interface ImageValidationOptions {
  maxSizeInMB?: number
  allowedTypes?: string[]
  maxDimensions?: { width: number; height: number }
}

const DEFAULT_OPTIONS: ImageValidationOptions = {
  maxSizeInMB: 5,
  allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  maxDimensions: { width: 4096, height: 4096 },
}

interface UseImageUploadReturn {
  handleFiles: (files: FileList | File[]) => Promise<string[]>
  handlePaste: (e: ClipboardEvent) => Promise<string[]>
  handleDrop: (e: React.DragEvent) => Promise<string[]>
  isLoading: boolean
  error: string | null
}

export function useImageUpload(
  options: ImageValidationOptions = DEFAULT_OPTIONS
): UseImageUploadReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateAndProcessImage = useCallback(
    async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!options.allowedTypes?.includes(file.type)) {
          reject(new Error(`Invalid file type: ${file.type}`))
          return
        }

        const sizeInMb = file.size / (1024 * 1024)
        if (options.maxSizeInMB && sizeInMb > options.maxSizeInMB) {
          reject(
            new Error(
              `File size ${sizeInMb.toFixed(1)}MB exceeds maximum size ${
                options.maxSizeInMB
              }MB`
            )
          )
          return
        }

        const reader = new FileReader()

        reader.onload = () => {
          const image = new Image()
          image.src = reader.result as string

          image.onload = () => {
            if (
              options.maxDimensions &&
              (image.width > options.maxDimensions.width ||
                image.height > options.maxDimensions.height)
            ) {
              reject(
                new Error(
                  `Image dimensions ${image.width}x${image.height} exceed maximum allowed ${options.maxDimensions.width}x${options.maxDimensions.height}`
                )
              )
              return
            }
            resolve(reader.result as string)
          }

          image.onerror = () => reject(new Error("Failed to load image"))
        }

        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsDataURL(file)
      })
    },
    [options]
  )

  const handleFiles = useCallback(
    async (files: FileList | File[]): Promise<string[]> => {
      setError(null)
      setIsLoading(true)

      try {
        const imageFiles = Array.from(files).filter((f) =>
          f.type.startsWith("image/")
        )

        if (imageFiles.length === 0) {
          throw new Error("No valid image files found")
        }

        const results = await Promise.all(
          imageFiles.map((f) => validateAndProcessImage(f))
        )

        return results
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to process images"
        setError(message)
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [validateAndProcessImage]
  )

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || [])
      const imageFiles = items
        .filter((item) => item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null)

      if (imageFiles.length === 0) return []

      return handleFiles(imageFiles)
    },
    [handleFiles]
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const items = Array.from(e.dataTransfer.items || [])
      const files = items
        .filter(
          (item) => item.kind === "file" && item.type.startsWith("image/")
        )
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null)

      if (files.length === 0) return []

      return handleFiles(files)
    },
    [handleFiles]
  )

  return {
    isLoading,
    error,
    handleFiles,
    handlePaste,
    handleDrop,
  }
}
