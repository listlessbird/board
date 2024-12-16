import { TextObject } from "@/lib/canvas/objects/text"
import { toolbarRegistry } from "@/lib/canvas/toolbar/toolbar-registry"
import { Bold, FlipHorizontal, Italic } from "lucide-react"

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
