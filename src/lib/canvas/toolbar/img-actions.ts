import { BaseObject } from "@/lib/canvas/objects/base"
import { ImageObject } from "@/lib/canvas/objects/image"
import { toolbarRegistry } from "@/lib/canvas/toolbar/toolbar-registry"
import { FlipHorizontal, ImageIcon } from "lucide-react"

async function handleFileInput(): Promise<string[]> {
  return new Promise((res, rej) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.multiple = true

    const cleanup = () => {
      document.body.removeChild(input)
    }

    input.onchange = async () => {
      const files = Array.from(input.files || [])

      if (files.length === 0) {
        cleanup()
        res([])
        return
      }

      try {
        const imgPromises = files.map((f) => {
          return new Promise<string>((res, rej) => {
            const reader = new FileReader()

            reader.onload = (e) => {
              res(e.target?.result as string)
            }

            reader.onerror = () => {
              rej(new Error(`Failed to read image ${f.name}`))
            }

            reader.readAsDataURL(f)
          })
        })

        const results = await Promise.all(imgPromises)
        cleanup()
        res(results)
      } catch (error) {
        cleanup()
        rej(error)
      }
    }

    input.oncancel = () => {
      cleanup()
      res([])
    }

    input.style.display = "none"
    document.body.appendChild(input)
    input.click()

    // if it still exists in dom for some reason, remove it
    setTimeout(() => {
      if (document.body.contains(input)) {
        cleanup()
        res([])
      }
    }, 5 * 60 * 1000)
  })
}

export function registerGlobalImgActions(
  canvas: HTMLCanvasElement,
  addObject: (obj: BaseObject) => void
) {
  toolbarRegistry.registerGlobalAction({
    id: "add-image",
    label: "Add Image",
    icon: ImageIcon,
    order: 1,
    global: true,
    handler: async () => {
      const imgDataArray = await handleFileInput()

      imgDataArray.forEach((imgData, i) => {
        const offset = 20 * i

        const newImg = new ImageObject(
          imgData,
          {
            x: canvas.width / 2 + offset,
            y: canvas.height / 2 + offset,
          },
          () => {
            addObject(newImg)
          }
        )

        addObject(newImg)
      })
    },
  })
}

export function registerImageActions() {
  toolbarRegistry.registerAction("image", {
    id: "flip",
    label: "Flip",
    icon: FlipHorizontal,
    group: "transform",
    order: 0,
    isVisible: (obj) => obj instanceof ImageObject,
    handler(obj) {
      if (obj instanceof ImageObject) {
        const transform = obj.getTransform()
        obj.setTransform({
          ...transform,
          isFlipped: !transform.isFlipped,
        })
      }
    },
  })
}
