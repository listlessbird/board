"use client"

import { MouseEvtHandlers } from "@/components/canvas/mouse-evt-handlers"
import { useCanvas } from "@/components/canvas/use-canvas"
import { useCanvasKeyBoardEvents } from "@/components/canvas/use-canvas-kb-events"
import { useAnimationFrame } from "@/components/canvas/use-animation-frame"
import { useTextEditing } from "@/components/canvas/use-text-editing"
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
import { useCanvasInteractions } from "@/components/canvas/use-canvas-interactions"

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const [objects, setObjects] = useState<BaseObject[]>([])
  const selectionManager = useRef(new SelectionManager())
  const transformManager = useRef(new TransformManager())

  const { dimensions, context } = useCanvas({ canvasRef })
  const selectedObject = useCanvasSelection(selectionManager.current)

  /**
   * TODO: display errors if any while adding imgs
   * scale down large images relative to the current canvas dimensions
   */

  const { addImageObject, handleDrop, handleGlobalPaste } = useCanvasImg({
    canvas: canvasRef,
    objects,
    setObjects,
  })

  const renderCanvas = useCallback(() => {
    if (!context) return
    context.clearRect(0, 0, dimensions.width, dimensions.height)
    objects.forEach((obj) => obj.render(context))
  }, [context, dimensions, objects])

  useAnimationFrame(renderCanvas, [context, dimensions, objects], true)

  useEffect(() => {
    transformManager.current.setCallbacks({
      onRender: renderCanvas,
      onTransformEnd: () => setObjects([...objects]),
    })
  }, [objects, renderCanvas])

  useCanvasInteractions({
    canvas: canvasRef,
    objects,
    setObjects,
    selectionManager: selectionManager.current,
    transformManager: transformManager.current,
    onRender: renderCanvas,
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

      {/* <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded absolute top-0"
        onClick={addText}
      >
        Add Text
      </button> */}
    </div>
  )
}
