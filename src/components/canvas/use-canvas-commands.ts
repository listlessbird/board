import { InteractionManager } from "@/lib/canvas/interaction-manager"
import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import { TransformManager } from "@/lib/canvas/transform"
import { Position } from "@/types"
import { useCallback, useRef } from "react"

interface UseCanvasCommandsOpts {
  canvas: React.RefObject<HTMLCanvasElement>
  objects: BaseObject[]
  selectionManager: SelectionManager
  transformManager: TransformManager
  onUpdate: () => void
  debug?: boolean
}

export function useCanvasCommands({
  canvas,
  objects,
  selectionManager,
  transformManager,
  onUpdate,
  debug,
}: UseCanvasCommandsOpts) {
  const interactionManager = useRef<InteractionManager | null>(null)

  const findObjectAtPoint = useCallback(
    (point: Position): BaseObject | null => {
      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i]
        if (obj.containsPoint(point)) {
          return obj
        }
      }
      return null
    },
    [objects]
  )

  const initManager = useCallback(() => {
    if (!canvas.current) return

    if (interactionManager.current) {
      interactionManager.current.destroy()
    }

    interactionManager.current = new InteractionManager({
      canvas: canvas.current,
      selectionManager,
      transformManager,
      getObjectAtPoint: findObjectAtPoint,
      onUpdate,
      debug,
    })
  }, [
    canvas,
    selectionManager,
    transformManager,
    onUpdate,
    debug,
    findObjectAtPoint,
  ])

  return {
    initManager,
    undo: () => interactionManager.current?.undo(),
    redo: () => interactionManager.current?.redo(),
  }
}
