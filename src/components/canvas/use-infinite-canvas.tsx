import { CanvasController } from "@/lib/canvas/core/canvas-controller"
import { InteractionManager } from "@/lib/canvas/interaction-manager"
import { BaseObject } from "@/lib/canvas/objects/base"
import { SelectionManager } from "@/lib/canvas/selection"
import { TransformManager } from "@/lib/canvas/transform"
import { Camera, ViewPortBounds } from "@/types"
import { useCallback, useEffect, useRef, useState } from "react"

interface UseInfiniteCanvasOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>
  selectionManager: SelectionManager
  transformManager: TransformManager
  initialZoom?: number
  debug?: boolean
}

export function useInfiniteCanvas({
  canvasRef,
  transformManager,
  selectionManager,
  initialZoom = 1,
  debug = false,
}: UseInfiniteCanvasOptions) {
  const controllerRef = useRef<CanvasController | null>(null)
  const interactionManagerRef = useRef<InteractionManager | null>(null)
  const objectsRef = useRef<BaseObject[]>([])

  // only set state for UI updates
  const [objects, setObjects] = useState<BaseObject[]>([])
  const [camera, setCamera] = useState<Camera | null>(null)
  const [bounds, setBounds] = useState<ViewPortBounds | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    if (controllerRef.current) {
      controllerRef.current.destroy()
    }
    if (interactionManagerRef.current) {
      interactionManagerRef.current.destroy()
    }

    const controller = new CanvasController(canvasRef.current, {
      initialZoom,
      debug,
    })
    controllerRef.current = controller

    if (objectsRef.current.length > 0) {
      controller.setObjects(objectsRef.current)
    }

    interactionManagerRef.current = new InteractionManager({
      canvas: canvasRef.current,
      getObjects: () => objectsRef.current,
      selectionManager,
      camera: controller.camera,
      transformManager,
      getObjectAtPoint: (point) => {
        const worldPoint = controller.coordinateSystem.screenToWorld(
          point,
          controller.camera
        )
        for (let i = objectsRef.current.length - 1; i >= 0; i--) {
          const obj = objectsRef.current[i]
          if (obj.containsPoint(worldPoint)) {
            return obj
          }
        }
        return null
      },
      onUpdate: () => {
        if (controllerRef.current) {
          controllerRef.current.render()
        }
      },
      debug,
    })

    transformManager.setCallbacks({
      onRender: () => controller.render(),
      onTransformEnd: () => {
        setObjects([...objectsRef.current])
        controller.render()
      },
    })

    const unsubscribe = [
      controller.on("objects:change", (newObjects) => {
        objectsRef.current = newObjects
        setObjects([...newObjects])
      }),
      controller.on("camera:change", (newCamera) => {
        setCamera({ ...newCamera })
      }),
      controller.on("viewport:change", (newBounds) => {
        setBounds(newBounds)
      }),
    ]

    return () => {
      unsubscribe.forEach((unsub) => unsub())
      if (interactionManagerRef.current) {
        interactionManagerRef.current.destroy()
        interactionManagerRef.current = null
      }
      if (controllerRef.current) {
        controllerRef.current.destroy()
        controllerRef.current = null
      }
    }
  }, [canvasRef, initialZoom, debug, selectionManager, transformManager])

  const setObjectsHandler = useCallback((newObjects: BaseObject[]) => {
    if (!controllerRef.current) return

    objectsRef.current = newObjects
    setObjects([...newObjects])
    controllerRef.current.setObjects(newObjects)
    controllerRef.current.render()
  }, [])

  const addObject = useCallback((object: BaseObject) => {
    if (!controllerRef.current) return

    objectsRef.current = [...objectsRef.current, object]
    controllerRef.current.addObject(object)
  }, [])

  const removeObject = useCallback((object: BaseObject) => {
    if (!controllerRef.current) return

    objectsRef.current = objectsRef.current.filter(
      (obj) => obj.id !== object.id
    )
    controllerRef.current.removeObject(object)
  }, [])

  const clearCanvas = useCallback(() => {
    if (!controllerRef.current) return

    objectsRef.current = []
    controllerRef.current.clear()
  }, [])

  const zoomTo = useCallback((level: number) => {
    if (!controllerRef.current) return
    controllerRef.current.zoomTo(level)
  }, [])

  const panTo = useCallback((x: number, y: number) => {
    if (!controllerRef.current) return
    controllerRef.current.panTo(x, y)
  }, [])

  return {
    objects,
    setObjects: setObjectsHandler,
    camera,
    bounds,
    addObject,
    removeObject,
    clearCanvas,
    zoomTo,
    panTo,
    controller: controllerRef.current,
    interactionManager: interactionManagerRef.current,
  }
}
