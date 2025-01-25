import { DeleteCommand } from "@/lib/canvas/commands/delete-object-command"
import { InteractionManager } from "@/lib/canvas/interaction-manager"
import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import { TransformManager } from "@/lib/canvas/transform"
import { Camera, InteractionCommand, Position } from "@/types"
import { useCallback, useEffect, useRef } from "react"

interface UseCanvasCommandsOpts {
  objects: BaseObject[]
  selectionManager: SelectionManager
  interactionManager: InteractionManager
  camera: Camera
  onUpdate: () => void
  debug?: boolean
}

export function useCanvasCommands({
  objects,
  selectionManager,
  interactionManager,
  onUpdate,
  camera,
  debug,
}: UseCanvasCommandsOpts) {
  const objectsRef = useRef(objects)
  const onUpdateRef = useRef(onUpdate)

  const setObjectsCallback = useRef<((objects: BaseObject[]) => void) | null>(
    null
  )

  const deleteObjectHandler = useCallback(
    (object: BaseObject) => {
      console.log("Deleting object:", object)
      // debugger
      const command = new DeleteCommand(
        object,
        () => objectsRef.current,
        (newObjects) => {
          if (setObjectsCallback.current) {
            setObjectsCallback.current(newObjects)
          } else {
            console.error("setObjectsCallback is not set")
          }
        },
        selectionManager,
        onUpdate,
        debug
      )

      interactionManager.commandProcessor.execute(command)
    },
    [objects, selectionManager, onUpdate, debug]
  )

  useEffect(() => {
    objectsRef.current = objects
    onUpdateRef.current = onUpdate
  }, [objects, onUpdate])

  return {
    undo: () => interactionManager.undo(),
    redo: () => interactionManager.redo(),
    deleteObject: deleteObjectHandler,
    setObjectsCallback: (cb: (objects: BaseObject[]) => void) => {
      setObjectsCallback.current = cb
    },
  }
}
