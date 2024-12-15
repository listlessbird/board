import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import { Editable } from "@/types"
import { useEffect } from "react"

export function useCanvasKeyBoardEvents({
  canvas,
  objects,
  setObjects,
  selectionManager,
}: {
  canvas: React.RefObject<HTMLCanvasElement>
  objects: BaseObject[]
  setObjects: (objects: BaseObject[]) => void
  selectionManager: SelectionManager
}) {
  useEffect(() => {
    function isEditingText() {
      const selected = selectionManager.getSelectedObjects() || []
      return selected.some(
        (o) => "isEditing" in o && (o as unknown as Editable).isEditing
      )
    }

    function handleKeyDown(e: KeyboardEvent) {
      const selected = selectionManager.getSelectedObjects() || []

      if (selected.length === 0) return

      if ((e.key === "Delete" || e.key === "Backspace") && !isEditingText()) {
        selectionManager.clearSelection()
        return
      }

      if (selected.length === 1) {
        const obj = selected[0]

        if ("isEditing" in obj) {
          const editable = obj as unknown as Editable
          if (editable.isEditing) {
            editable.onKeyDown(e)
            setObjects([...objects])
          }
        }
      }
    }

    const canvasEl = canvas.current

    canvasEl.tabIndex = 0

    canvasEl.addEventListener("keydown", handleKeyDown)

    return () => {
      canvasEl.removeEventListener("keydown", handleKeyDown)
    }
  }, [canvas, objects, setObjects, selectionManager])
}
