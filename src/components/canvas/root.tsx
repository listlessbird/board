"use client"

import { useCanvas } from "@/components/canvas/use-canvas"
import { useAnimationFrame } from "@/components/canvas/use-animation-frame"
import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import { TransformManager } from "@/lib/canvas/transform"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  registerTextActions,
  registerTextGlobalActions,
} from "@/lib/canvas/toolbar/text-actions"
import { toolbarRegistry } from "@/lib/canvas/toolbar/toolbar-registry"
import { Toolbar } from "@/components/canvas/toolbar"
import { useCanvasSelection } from "@/components/canvas/use-canvas-selection"
import { useCanvasImg } from "@/components/canvas/use-canvas-img"
import {
  registerGlobalImgActions,
  registerImageActions,
} from "@/lib/canvas/toolbar/img-actions"
import { useCanvasCommands } from "@/components/canvas/use-canvas-commands"
import { KeyboardShortcuts } from "@/lib/constants"

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const [objects, setObjects] = useState<BaseObject[]>([])
  const selectionManager = useRef(new SelectionManager())
  const transformManager = useRef(new TransformManager())
  const [isDebug] = useState(() => process.env.NODE_ENV === "development")

  const objectsRef = useRef(objects)

  const handleSetObjects = useCallback(
    (newObjects: BaseObject[]) => {
      console.log("SETTING OBJECTS", {
        current: objects.length,
        newObjects: newObjects.length,
        currentIds: objects.map((o) => o.id),
        newIds: newObjects.map((o) => o.id),
      })

      setObjects([...newObjects])
    },
    [objects]
  )

  useEffect(() => {
    objectsRef.current = objects
  }, [objects])

  const { dimensions, context } = useCanvas({ canvasRef })
  const selectedObject = useCanvasSelection(selectionManager.current)

  const renderCanvas = useCallback(() => {
    if (!context) return
    context.clearRect(0, 0, dimensions.width, dimensions.height)

    if (isDebug) {
      const ids = objects.map((o) => o.id)
      const dupeIds = ids.filter((id, index) => ids.indexOf(id) !== index)
      if (dupeIds.length > 0) {
        console.warn("Duplicate objects found:", {
          duplicateIds: dupeIds,
          allIds: ids,
          objects: objects,
        })
      }
    }

    objects.forEach((obj) => {
      obj.render(context)
    })
  }, [context, dimensions, objects, isDebug])
  const { initManager, undo, redo, deleteObject, setObjectsCallback } =
    useCanvasCommands({
      canvas: canvasRef,
      objects,
      selectionManager: selectionManager.current,
      transformManager: transformManager.current,
      onUpdate: () => {
        console.log("UPDATE TRIGGERED, onUpdate in useCanvasCommands")
        renderCanvas()
      },
      debug: isDebug,
    })

  useEffect(() => {
    setObjectsCallback(handleSetObjects)
    initManager()
  }, [handleSetObjects, initManager, setObjectsCallback])

  useAnimationFrame(renderCanvas, [context, dimensions, objects], true)

  useEffect(() => {
    transformManager.current.setCallbacks({
      onRender: renderCanvas,
      onTransformEnd: () => setObjects([...objects]),
    })
  }, [objects, renderCanvas])

  const { handleDrop, handleGlobalPaste } = useCanvasImg({
    canvas: canvasRef,
    objects,
    setObjects,
  })

  useEffect(() => {
    registerTextActions()
    registerImageActions()
    registerTextGlobalActions(canvasRef.current!, (obj) =>
      setObjects((prev) => [...prev, obj])
    )
    registerGlobalImgActions(canvasRef.current!, (obj) =>
      setObjects((prev) => [...prev, obj])
    )
  }, [])

  const handleToolbarAction = useCallback(
    (actionId: string, object?: BaseObject) => {
      if (object) {
        const actions = toolbarRegistry.getObjectActions(
          object.type,
          object as any
        )
        const action = actions.find((a) => a.id === actionId)
        if (action) {
          action.handler(object)
          setObjects([...objects])
        }
      } else {
        const action = toolbarRegistry
          .getGlobalActions()
          .find((a) => a.id === actionId)
        if (action && action.global) {
          action.handler()
        }
      }
    },
    [objects]
  )

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.key === KeyboardShortcuts.UNDO && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        undo()
        return
      }

      if (e.key === KeyboardShortcuts.REDO && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        redo()
        return
      }

      if (e.key === KeyboardShortcuts.DELETE && selectedObject) {
        console.log("DELETE COMMAND")
        e.preventDefault()
        deleteObject(selectedObject)
        selectionManager.current.clearSelection()
        return
      }
    }

    window.addEventListener("keydown", handleKeyboard)
    return () => window.removeEventListener("keydown", handleKeyboard)
  }, [undo, redo, objects, selectedObject, deleteObject])

  return (
    <div className="fixed inset-0 overflow-hidden outline-none">
      <canvas
        tabIndex={0}
        ref={canvasRef}
        className="w-full h-full outline-none"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      />

      <Toolbar selectedObject={selectedObject} onAction={handleToolbarAction} />
      {isDebug && (
        <div className="fixed bottom-4 right-4 text-xs text-white/50 font-mono">
          <div>Objects: {objects.length}</div>
          <div>Selected: {selectedObject?.id ?? "none"}</div>
        </div>
      )}
    </div>
  )
}
