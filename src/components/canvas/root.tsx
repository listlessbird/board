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
import { useCanvasInteractions } from "@/components/canvas/use-canvas-interactions"

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const [objects, setObjects] = useState<BaseObject[]>([])
  const selectionManager = useRef(new SelectionManager())
  const transformManager = useRef(new TransformManager())

  const { dimensions, context } = useCanvas({ canvasRef })
  const selectedObject = useCanvasSelection(selectionManager.current)

  const renderCanvas = useCallback(() => {
    if (!context) return
    context.clearRect(0, 0, dimensions.width, dimensions.height)

    if (process.env.NODE_ENV === "development") {
      context.save()
      context.strokeStyle = "rgba(255,255,255,0.1)"
      context.beginPath()
      for (let x = 0; x < dimensions.width; x += 100) {
        context.moveTo(x, 0)
        context.lineTo(x, dimensions.height)
      }
      for (let y = 0; y < dimensions.height; y += 100) {
        context.moveTo(0, y)
        context.lineTo(dimensions.width, y)
      }
      context.stroke()
      context.restore()
    }

    objects.forEach((obj) => {
      obj.render(context)

      if (process.env.NODE_ENV === "development") {
        const bounds = obj.getBounds()
        context.save()
        context.strokeStyle = "rgba(255,0,0,0.5)"
        context.translate(obj.transform.position.x, obj.transform.position.y)
        context.rotate(obj.transform.rotation)
        context.strokeRect(
          bounds.left,
          bounds.top,
          bounds.right - bounds.left,
          bounds.bottom - bounds.top
        )
        context.restore()
      }
    })
  }, [context, dimensions, objects])

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
    </div>
  )
}
