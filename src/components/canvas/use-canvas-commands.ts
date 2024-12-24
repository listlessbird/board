import { InteractionManager } from "@/lib/canvas/interaction-manager"
import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import { TransformManager } from "@/lib/canvas/transform"
import { Position } from "@/types"
import { useCallback, useEffect, useRef } from "react"

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

  const objectsRef = useRef(objects)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    objectsRef.current = objects
    onUpdateRef.current = onUpdate
  }, [objects, onUpdate])

  const findObjectAtPoint = useCallback(
    (point: Position): BaseObject | null => {
      for (let i = objectsRef.current.length - 1; i >= 0; i--) {
        const obj = objectsRef.current[i]
        if (obj.containsPoint(point)) {
          return obj
        }
      }
      return null
    },
    []
  )

  const initManager = useCallback(() => {
    if (!canvas.current) return

    if (interactionManager.current) {
      return
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

  useEffect(() => {
    return () => {
      if (interactionManager.current) {
        interactionManager.current.destroy()
        interactionManager.current = null
      }
    }
  }, [])

  return {
    initManager,
    undo: () => interactionManager.current?.undo(),
    redo: () => interactionManager.current?.redo(),
  }
}
