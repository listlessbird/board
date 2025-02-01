"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { BaseObject } from "@/lib/canvas/objects/base"
import { useInfiniteCanvas } from "@/components/canvas/use-infinite-canvas"
import { useCanvasSelection } from "@/components/canvas/use-canvas-selection"
import { useCanvasCommands } from "@/components/canvas/use-canvas-commands"
import { useCanvasImg } from "@/components/canvas/use-canvas-img"
import {
  registerTextActions,
  registerTextGlobalActions,
} from "@/lib/canvas/toolbar/text-actions"
import {
  registerGlobalImgActions,
  registerImageActions,
} from "@/lib/canvas/toolbar/img-actions"
import { toolbarRegistry } from "@/lib/canvas/toolbar/toolbar-registry"
import { Toolbar } from "@/components/canvas/toolbar"
import { KeyboardShortcuts } from "@/lib/constants"
import { AddCommand } from "@/lib/canvas/commands/add-command"

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isDebug] = useState(() => process.env.NODE_ENV === "development")
  const [objects, setObjects] = useState<BaseObject[]>([])
  const [actionsReady, setActionsReady] = useState(false)
  const copiedObjectRef = useRef<BaseObject | null>(null)

  const {
    setObjects: updateCanvasObjects,
    controller,
    interactionManager,
    selectionManager,
    transformManager,
    addObject,
    camera,
  } = useInfiniteCanvas({
    canvasRef,
    debug: isDebug,
    initialZoom: 1,
  })

  useEffect(() => {
    console.log("Canvas mount state:", {
      canvasElement: canvasRef.current,
      controller,
      hasInteractionManager: !!interactionManager,
    })
  }, [controller, interactionManager])

  useEffect(() => {
    if (controller) {
      controller.setObjects(objects)
    }
  }, [objects, controller])

  const selectedObject = useCanvasSelection(selectionManager!)

  const { undo, redo, deleteObject, setObjectsCallback } = useCanvasCommands({
    objects,
    selectionManager: selectionManager!,
    interactionManager: interactionManager!,
    onUpdate: () => {
      controller?.render()
    },
    camera: camera!,
    debug: isDebug,
  })

  useEffect(() => {
    setObjectsCallback(updateCanvasObjects)
  }, [updateCanvasObjects, setObjectsCallback])

  const { handleDrop, error: imageError } = useCanvasImg({
    canvas: canvasRef!,
    controller,
    camera: camera!,
  })

  useEffect(() => {
    if (!canvasRef.current) return

    registerTextActions()
    registerImageActions()
    registerTextGlobalActions(canvasRef.current, addObject)
    registerGlobalImgActions(canvasRef.current, addObject)

    console.log("Actions registered:", {
      global: toolbarRegistry.getGlobalActions(),
      groups: toolbarRegistry.getGroups(),
    })

    setActionsReady(true)
  }, [addObject])

  const handleToolbarAction = useCallback(
    (actionId: string, object?: BaseObject) => {
      console.log("Handling action:", actionId, object, controller)

      if (!controller) return

      if (object) {
        const actions = toolbarRegistry.getObjectActions(
          object.type,
          object as any
        )
        const action = actions.find((a) => a.id === actionId)
        if (action) {
          action.handler(object)
          updateCanvasObjects([...objects])
          controller.render()
        }
      } else {
        const action = toolbarRegistry
          .getGlobalActions()
          .find((a) => a.id === actionId)
        if (action?.global) {
          action.handler()
        }
      }
    },
    [objects, updateCanvasObjects, controller]
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
        e.preventDefault()

        if (selectionManager) {
          deleteObject(selectedObject)
          selectionManager.clearSelection()
        } else {
          console.error("No selection manager")
        }
        return
      }
      // copy
      if (e.key === KeyboardShortcuts.COPY && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (selectedObject) {
          copiedObjectRef.current = selectedObject.clone()
        }
      }

      // paste
      if (e.key === KeyboardShortcuts.PASTE && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (copiedObjectRef.current && interactionManager && controller) {
          const newObj = copiedObjectRef.current.clone()

          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            const viewPortCenter = {
              x: (rect.width / 2) * dpr,
              y: (rect.height / 2) * dpr,
            }

            const worldPos = controller.coordinateSystem.screenToWorld(
              viewPortCenter,
              camera!
            )

            const offset = {
              x: (Math.random() - 0.5) * 40,
              y: (Math.random() - 0.5) * 40,
            }

            newObj.transform.position.x = worldPos.x + offset.x
            newObj.transform.position.y = worldPos.y + offset.y
          }

          const cmd = new AddCommand(
            newObj,
            () => controller.getObjects(),
            (newObjects) => controller.setObjects(newObjects),
            isDebug
          )

          interactionManager.commandProcessor.execute(cmd)
          selectionManager?.select(newObj)
          controller.render()
        }
      }
    }

    window.addEventListener("keydown", handleKeyboard)
    return () => window.removeEventListener("keydown", handleKeyboard)
  }, [
    undo,
    redo,
    selectedObject,
    deleteObject,
    interactionManager,
    controller,
    camera,
    selectionManager,
    isDebug,
  ])

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !canvasRef.current) return

      const { width, height } = containerRef.current.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvasRef.current.width = width * dpr
      canvasRef.current.height = height * dpr
      canvasRef.current.style.width = `${width}px`
      canvasRef.current.style.height = `${height}px`

      controller?.render()
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [controller])

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        className="w-full h-full outline-none touch-none"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      />

      <div className="fixed top-0 left-0 right-0 flex justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto">
          <Toolbar
            selectedObject={selectedObject}
            onAction={handleToolbarAction}
          />
        </div>
      </div>

      {imageError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded">
          {imageError}
        </div>
      )}
    </div>
  )
}
