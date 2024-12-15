"use client"

import { MouseEvtHandlers } from "@/components/canvas/mouse-evt-handlers"
import { useCanvas } from "@/components/canvas/use-canvas"
import { useCanvasKeyBoardEvents } from "@/components/canvas/use-canvas-kb-events"
import { useAnimationFrame } from "@/components/canvas/use-animation-frame"
import { useTextEditing } from "@/components/canvas/use-text-editing"
import { BaseObject } from "@/lib/canvas/objects/base"
import { TextObject } from "@/lib/canvas/objects/text"
import { SelectionManager } from "@/lib/canvas/selection"
import { TransformManager } from "@/lib/canvas/transform"
import { useCallback, useEffect, useRef, useState } from "react"
import { TextStyle } from "@/types"
import { ToolbarProvider } from "@/context/toolbar"

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

  const handleDeleteObject = useCallback((obj: BaseObject) => {
    selectionManager.current.clearSelection()
    setObjects((prev) => prev.filter((o) => o !== obj))
  }, [])

  const handleObjectUpdate = useCallback(
    (obj: BaseObject, updates: Partial<BaseObject>) => {
      setObjects((prev) =>
        prev.map((o) => {
          if (o.id === obj.id) {
            if (o instanceof TextObject && "style" in updates) {
              o.setStyle(updates.style as Partial<TextStyle>)
            }
            Object.assign(o, updates)

            return o
          }
          return o
        })
      )
    },
    []
  )

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
    <ToolbarProvider
      onObjectUpdate={handleObjectUpdate}
      onDeleteObject={handleDeleteObject}
    >
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
    </ToolbarProvider>
  )
}
