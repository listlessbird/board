import { BaseObject } from "@/lib/canvas/objects/base"
import { TextObject } from "@/lib/canvas/objects/text"
import { toolbarRegistry } from "@/lib/canvas/toolbar/toolbar-registry"
import { Bold, FlipHorizontal, Italic, Type } from "lucide-react"

export function registerTextGlobalActions(
  canvas: HTMLCanvasElement,
  addObject: (obj: BaseObject) => void
) {
  toolbarRegistry.registerGlobalAction({
    id: "add-text",
    label: "Add Text",
    icon: Type,
    order: 0,
    global: true,
    handler: () => {
      const newText = new TextObject(`Listless's Board`, {
        x: (Math.random() * canvas.width) / 2,
        y: (Math.random() * canvas.height) / 2,
      })

      addObject(newText)
    },
  })
}
export function registerTextActions() {
  toolbarRegistry.registerAction("text", {
    id: "font-bold",
    label: "Bold",
    // TODO: get type completion for this
    group: "style",
    order: 0,
    icon: Bold,
    isVisible: (obj) => obj instanceof TextObject,
    handler: (obj) => {
      if (obj instanceof TextObject) {
        obj.setStyle({
          weight: obj.style.weight === "bold" ? "normal" : "bold",
        })
      }
    },
  })

  toolbarRegistry.registerAction("text", {
    id: "font-italic",
    label: "Italic",
    group: "style",
    order: 1,
    icon: Italic,
    isVisible: (obj) => obj instanceof TextObject,
    handler: (obj) => {
      if (obj instanceof TextObject) {
        obj.setStyle({ italic: !obj.style.italic })
      }
    },
  })

  toolbarRegistry.registerAction("text", {
    id: "flip",
    label: "Flip",
    icon: FlipHorizontal,
    group: "transform",
    order: 0,
    isVisible: (obj) => obj instanceof TextObject,
    handler: (obj) => {
      if (obj instanceof TextObject) {
        const transform = obj.getTransform()
        obj.setTransform({
          ...transform,
          isFlipped: !transform.isFlipped,
        })
      }
    },
  })
}
