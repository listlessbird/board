import { InteractionManager } from "@/lib/canvas/interactions/handler"
import { SelectInteraction } from "@/lib/canvas/interactions/select-interaction"
import { TextInteraction } from "@/lib/canvas/interactions/text-interactions"
import { RootTransformInteraction } from "@/lib/canvas/interactions/transform-interaction"
import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import { TransformManager } from "@/lib/canvas/transform"
import { InteractionHandler, Position } from "@/types"
import { on } from "events"
import { useCallback, useEffect, useRef } from "react"

interface UseCanvasInteractionsProps {
  canvas: React.RefObject<HTMLCanvasElement>
  objects: BaseObject[]
  setObjects: React.Dispatch<React.SetStateAction<BaseObject[]>>
  selectionManager: SelectionManager
  transformManager: TransformManager
  onRender: () => void
}

export function useCanvasInteractions({
  canvas,
  objects,
  setObjects,
  selectionManager,
  transformManager,
  onRender,
}: UseCanvasInteractionsProps) {
  const interactionManager = useRef<InteractionManager | null>(null)

  const findObjectAtPoint = useCallback(
    (point: Position): BaseObject | null => {
      console.log("[DEBUG] Checking point:", point)
      console.log("[DEBUG] Total objects:", objects.length)

      for (let i = objects.length - 1; i >= 0; i--) {
        const object = objects[i]
        console.log(`[DEBUG] Checking object: ${i}`, {
          id: object.id,
          type: object.type,
          selected: object.selected,
          positon: object.transform.position,
          contains: object.containsPoint(point),
        })
        if (object.containsPoint(point)) {
          return object
        }
      }
      return null
    },
    [objects]
  )

  useEffect(() => {
    const abortController = new AbortController()
    const signal = abortController.signal

    if (!canvas.current) return

    const handlers = [
      new SelectInteraction(selectionManager),
      new TextInteraction(() => {
        setObjects((prev) => [...prev])
        onRender()
      }),
      new RootTransformInteraction(transformManager, selectionManager, () => {
        setObjects((prev) => [...prev])
        onRender()
      }),
    ]
    console.log(
      "[DEBUG] Initialized handlers:",
      handlers.map((h) => ({
        id: h.id,
        priority: h.priority,
      }))
    )

    interactionManager.current = new InteractionManager(handlers)

    const handleMouseDown = (e: MouseEvent) => {
      console.log("handle mouse down")
      interactionManager.current?.handleMouseDown(
        e,
        canvas.current!,
        findObjectAtPoint
      )
    }

    const handleMouseMove = (e: MouseEvent) => {
      interactionManager.current?.handleMouseMove(
        e,
        canvas.current!,
        findObjectAtPoint
      )
    }

    const handleMouseUp = (e: MouseEvent) => {
      interactionManager.current?.handleMouseUp(
        e,
        canvas.current!,
        findObjectAtPoint
      )
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const selected = selectionManager.getSelectedObjects()[0]

      if (selected) {
        interactionManager.current?.handleKeyDown(e, selected)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const selected = selectionManager.getSelectedObjects()[0]

      if (selected) {
        interactionManager.current?.handleKeyUp(e, selected)
      }
    }

    canvas.current.addEventListener("mousedown", handleMouseDown, { signal })
    canvas.current.addEventListener("mousemove", handleMouseMove, { signal })
    canvas.current.addEventListener("mouseup", handleMouseUp, { signal })
    canvas.current.addEventListener("keydown", handleKeyDown, { signal })
    canvas.current.addEventListener("keyup", handleKeyUp, { signal })

    return () => {
      abortController.abort()
      interactionManager.current?.destroy()
    }
  }, [
    canvas,
    objects,
    setObjects,
    selectionManager,
    transformManager,
    findObjectAtPoint,
    onRender,
  ])
}
