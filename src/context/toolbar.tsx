import { BaseObject } from "@/lib/canvas/objects/base"
import { CanvasObjectType, ObjectTypeMap } from "@/types"
import {
  createContext,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react"

export type ToolbarOption<T extends CanvasObjectType> = {
  id: string
  label: string
  type: "button" | "select" | "number" | "color"
  render: (
    obj: ObjectTypeMap[T],
    onChange: (updates: Partial<ObjectTypeMap[T]>) => void
  ) => ReactNode
}

// type ToolbarContextType = {
//   updateObject: (obj: BaseObject, updates: Partial<BaseObject>) => void
//   deleteObject: (obj: BaseObject) => void
//   registerObjectOptions: (
//     type: CanvasObjectType,
//     options: ToolbarOption[]
//   ) => void
//   getOptionsForObject: (obj: BaseObject | null) => ToolbarOption[]
// }

type ToolbarContextType = {
  registerObjectOptions: <T extends CanvasObjectType>(
    type: T,
    options: ToolbarOption<T>[]
  ) => void
  getOptionsForObject: (
    obj: BaseObject | null
  ) => ToolbarOption<CanvasObjectType>[]
  updateObject: <T extends BaseObject>(obj: T, updates: Partial<T>) => void
  deleteObject: (obj: BaseObject) => void
}

type ObjectToolbarOptions = {
  [key in CanvasObjectType]: ToolbarOption<key>[]
}

const ToolbarContext = createContext<ToolbarContextType | null>(null)

export function ToolbarProvider({
  children,
  onObjectUpdate,
  onDeleteObject,
}: PropsWithChildren<{
  onObjectUpdate: (obj: BaseObject, updates: Partial<BaseObject>) => void
  onDeleteObject: (obj: BaseObject) => void
}>) {
  const [objectOptions, setObjectOptions] = useState<ObjectToolbarOptions>({
    text: [],
  })

  const registerObjectOptions = useCallback(
    <T extends CanvasObjectType>(type: T, options: ToolbarOption<T>[]) => {
      setObjectOptions((prev) => ({
        ...prev,
        [type]: options,
      }))
    },
    []
  )

  const getOptionsForObject = useCallback(
    (obj: BaseObject | null) => {
      if (!obj) return []
      return objectOptions[obj.type] || []
    },
    [objectOptions]
  )

  const updateObject = useCallback(
    (obj: BaseObject, updates: Partial<BaseObject>) => {
      onObjectUpdate(obj, updates)
    },
    [onObjectUpdate]
  )

  const deleteObject = useCallback(
    (obj: BaseObject) => {
      onDeleteObject(obj)
    },
    [onDeleteObject]
  )

  return (
    <ToolbarContext.Provider
      value={{
        updateObject,
        registerObjectOptions,
        getOptionsForObject,
        deleteObject,
      }}
    >
      {children}
    </ToolbarContext.Provider>
  )
}

export function useToolbar() {
  const context = useContext(ToolbarContext)
  if (!context) {
    throw new Error("useToolbar must be used within a ToolbarProvider")
  }

  return context
}
