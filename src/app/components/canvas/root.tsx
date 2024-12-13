"use client"

import { MouseEvtHandlers } from "@/app/components/canvas/mouse-evt-handlers"
import { useCanvas } from "@/app/components/canvas/use-canvas"
import { useCanvasKeyBoardEvents } from "@/app/components/canvas/use-canvas-kb-events"
import { BaseObject } from "@/lib/canvas/objects/base"
import { TextObject } from "@/lib/canvas/objects/text"
import { SelectionManager } from "@/lib/canvas/selection"
import { TransformManager } from "@/lib/canvas/transform"
import { useEffect, useRef, useState } from "react"

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const [objects, setObjects] = useState<BaseObject[]>([])
  const selectionManager = useRef(new SelectionManager())
  const transformManager = useRef(new TransformManager())
  const mouseManager = useRef<MouseEvtHandlers | null>(null)

  const { dimensions, context } = useCanvas({ canvasRef })
  useCanvasKeyBoardEvents({
    canvas: canvasRef,
    objects,
    setObjects,
    selectionManager: selectionManager.current,
  })
  useEffect(() => {
    if (!canvasRef.current) return

    mouseManager.current = new MouseEvtHandlers(
      canvasRef,
      selectionManager.current,
      transformManager.current,
      setObjects
    )
  }, [])

  useEffect(() => {
    if (!context || !canvasRef.current) return

    const render = () => {
      context.clearRect(0, 0, dimensions.width, dimensions.height)
      objects.forEach((o) => o.render(context))
    }

    render()
  }, [context, objects, dimensions])

  const addText = () => {
    const newText = new TextObject(`Listless's Board`, {
      x: canvasRef.current!.width / 2,
      y: canvasRef.current!.height / 2,
    })

    setObjects([...objects, newText])
  }

  return (
    <div className="fixed inset-0 overflow-hidden outline-none">
      <canvas
        tabIndex={0}
        ref={canvasRef}
        className="w-full h-full outline-none"
        onMouseDown={(e) => mouseManager.current?.handleMouseDown(e, objects)}
        onMouseMove={(e) => mouseManager.current?.handleMouseMove(e, objects)}
        onMouseUp={() => mouseManager.current?.handleMouseUp()}
        onMouseLeave={() => mouseManager.current?.handleMouseLeave()}
        onDoubleClick={(e) =>
          mouseManager.current?.handleDoubleClick(e, objects)
        }
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
