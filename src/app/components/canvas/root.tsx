"use client"

import { MouseEvtHandlers } from "@/app/components/canvas/mouse-evt-handlers"
import { useCanvas } from "@/app/components/canvas/use-canvas"
import { useCanvasKeyBoardEvents } from "@/app/components/canvas/use-canvas-kb-events"
import { useTextEditing } from "@/app/components/canvas/use-text-editing"
import { BaseObject } from "@/lib/canvas/objects/base"
import { TextObject } from "@/lib/canvas/objects/text"
import { SelectionManager } from "@/lib/canvas/selection"
import { TransformManager } from "@/lib/canvas/transform"
import { useCallback, useEffect, useRef, useState } from "react"

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const [objects, setObjects] = useState<BaseObject[]>([])
  const selectionManager = useRef(new SelectionManager())
  const transformManager = useRef(new TransformManager())
  const mouseManager = useRef<MouseEvtHandlers | null>(null)

  const { dimensions, context } = useCanvas({ canvasRef })

  const textEditing = useTextEditing({
    objects,
    setObjects,
  })

  const renderCanvas = useCallback(() => {
    if (!context) return
    context.clearRect(0, 0, dimensions.width, dimensions.height)
    objects.forEach((obj) => obj.render(context))
  }, [context, dimensions, objects])

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
    renderCanvas()
  }, [renderCanvas])

  const addText = () => {
    setObjects((prev) => {
      const newText = new TextObject(`Listless's Board`, {
        x: (Math.random() * canvasRef.current!.width) / 2,
        y: (Math.random() * canvasRef.current!.height) / 2,
      })

      newText.setUpdateCallback(() => {
        setObjects((cur) => [...cur])
      })

      return [...prev, newText]
    })
  }

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
      />
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded absolute top-0"
        onClick={addText}
      >
        Add Text
      </button>
    </div>
  )
}
