import { BaseObject } from "@/lib/canvas/objects/base"
import { TextObject } from "@/lib/canvas/objects/text"
import { useCallback, useRef } from "react"

export function useTextEditing({
  objects,
  setObjects,
}: {
  objects: BaseObject[]
  setObjects: (objects: BaseObject[]) => void
}) {
  const editingRef = useRef<TextObject | null>(null)

  const stopAllEditing = useCallback(() => {
    let hasChanges = false

    objects.forEach((o) => {
      if (o instanceof TextObject && o.isEditing) {
        o.stopEditing()
        hasChanges = true
      }
    })

    if (hasChanges) {
      editingRef.current = null
      setObjects([...objects])
    }
  }, [objects, setObjects])

  const startEditing = useCallback(
    (obj: TextObject) => {
      stopAllEditing()
      obj.startEditing()
      editingRef.current = obj
      setObjects([...objects])
    },
    [objects, setObjects, stopAllEditing]
  )

  const handleClickOutside = useCallback(
    (clicked: BaseObject | null) => {
      if (!clicked) {
        stopAllEditing()
        return
      }

      //   clicked another while editing one

      const currentlyEditing = objects.find(
        (o) => o instanceof TextObject && o.isEditing
      )

      if (currentlyEditing && currentlyEditing !== clicked) {
        stopAllEditing()
      }
    },
    [objects, stopAllEditing]
  )

  const getEditingObject = useCallback(() => {
    return editingRef.current
  }, [])

  return {
    startEditing,
    stopAllEditing,
    handleClickOutside,
    getEditingObject,
  }
}
