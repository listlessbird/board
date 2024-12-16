import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import { useEffect, useState } from "react"

export function useCanvasSelection(selectionManager: SelectionManager) {
  const [selectedObject, setSelectedObject] = useState<BaseObject | null>(
    () => selectionManager.getSelectedObjects()[0] || null
  )

  useEffect(() => {
    const cleanup = selectionManager.subscribe(() => {
      setSelectedObject(selectionManager.getSelectedObjects()[0] || null)
    })

    return cleanup
  }, [selectionManager])

  return selectedObject
}
