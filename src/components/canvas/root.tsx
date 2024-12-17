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

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const [objects, setObjects] = useState<BaseObject[]>([])
  const selectionManager = useRef(new SelectionManager())
  const transformManager = useRef(new TransformManager())
  const mouseManager = useRef<MouseEvtHandlers | null>(null)

  const { dimensions, context } = useCanvas({ canvasRef })
  const selectedObject = useCanvasSelection(selectionManager.current)

  const textEditing = useTextEditing({
    objects,
    setObjects,
  })

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
    if (!canvasRef.current || !context) return

    transformManager.current.setCallbacks({
      onRender: renderCanvas,
      onTransformEnd: () => setObjects([...objects]),
    })

    mouseManager.current = new MouseEvtHandlers(
      canvasRef,
      selectionManager.current,
      transformManager.current,
      setObjects,
      {
        startEditing: textEditing.startEditing,
        handleClickOutside: textEditing.handleClickOutside,
      }
    )
  }, [context, objects, renderCanvas, textEditing])

  useCanvasKeyBoardEvents({
    canvas: canvasRef,
    objects,
    setObjects,
    selectionManager: selectionManager.current,
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

  // const addText = () => {
  //   setObjects((prev) => {
  //     const newText = new TextObject(`Listless's Board`, {
  //       x: (Math.random() * canvasRef.current!.width) / 2,
  //       y: (Math.random() * canvasRef.current!.height) / 2,
  //     })

  //     newText.setUpdateCallback(() => {
  //       setObjects((cur) => [...cur])
  //     })

  //     return [...prev, newText]
  //   })
  // }

  return (
    <div className="fixed inset-0 overflow-hidden outline-none">
      <canvas
        tabIndex={0}
        ref={canvasRef}
        className="w-full h-full outline-none"
        onDoubleClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          mouseManager.current?.handleDoubleClick(e, objects)
        }}
        onMouseDown={(e) => {
          // e.preventDefault()
          e.stopPropagation()
          mouseManager.current?.handleMouseDown(e, objects)
        }}
        onMouseMove={(e) => mouseManager.current?.handleMouseMove(e, objects)}
        onMouseUp={() => mouseManager.current?.handleMouseUp()}
        onMouseLeave={() => mouseManager.current?.handleMouseLeave()}
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
