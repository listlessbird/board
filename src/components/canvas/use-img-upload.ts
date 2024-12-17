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
      if (!options.allowedTypes?.includes(file.type)) {
        throw new Error("Invalid file type")
      }

      const sizeInMb = file.size / (1024 * 1024)
      if (options.maxSizeInMB && sizeInMb > options.maxSizeInMB) {
        throw new Error("File size exceeds maximum size")
      }

      return new Promise((res, rej) => {
        const reader = new FileReader()

        reader.onload = async (e) => {
          const image = new Image()

          image.onload = () => {
            if (
              options.maxDimensions &&
              (image.width > options.maxDimensions.width ||
                image.height > options.maxDimensions.height)
            ) {
              rej(new Error("Image dimensions exceed maximum allowed dim"))
              return
            }
            res(e.target?.result as string)
          }
          image.src = e.target?.result as string

          image.onerror = () => {
            rej(new Error("Failed to load image"))
          }

          reader.onerror = () => rej(new Error("Failed to read image"))
          reader.readAsDataURL(file)
        }
      })
    },
    [options]
  )

  const handleFiles = useCallback(
    async (files: FileList | File[]): Promise<string[]> => {
      setError(null)
      setIsLoading(true)

      try {
        const results = await Promise.all(
          Array.from(files)
            .filter((f) => f.type.startsWith("image/"))
            .map((f) => validateAndProcessImage(f))
        )

        return results
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to process Image"
        )
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [validateAndProcessImage]
  )

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return []

      const imageFiles = Array.from(items)
        .filter((item) => item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null)

      return handleFiles(imageFiles)
    },
    [handleFiles]
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      return handleFiles(e.dataTransfer.files)
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
