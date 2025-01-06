import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import { useEffect, useState } from "react"

export function useCanvasSelection(selectionManager: SelectionManager) {
  const [selectedObject, setSelectedObject] = useState<BaseObject | null>(null)

  useEffect(() => {
    if (!selectionManager) {
      console.warn("[useCanvasSelection] No selection manager provided")
      return
    }

    setSelectedObject(selectionManager.getSelectedObjects()[0] || null)

    const cleanup = selectionManager.subscribe(() => {
      setSelectedObject(selectionManager.getSelectedObjects()[0] || null)
    })

    return cleanup
  }, [selectionManager])

  return selectedObject
}
