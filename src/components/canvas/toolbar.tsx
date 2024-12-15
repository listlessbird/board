import { Card } from "@/components/ui/card"
import { ToolbarOption, useToolbar } from "@/context/toolbar"
import { BaseObject } from "@/lib/canvas/objects/base"
import { TextObject } from "@/lib/canvas/objects/text"
import { ObjectTypeMap } from "@/types"
import { CrossIcon, Italic, MinusSquare, PlusSquare, Type } from "lucide-react"
import { useEffect } from "react"

export function Toolbar({
  selectedObject,
  onAddText,
  onDeleteObject,
}: {
  selectedObject: BaseObject | null
  onAddText: () => void
  onDeleteObject: (obj: BaseObject) => void
}) {
  const { getOptionsForObject } = useToolbar()
  const options = getOptionsForObject(selectedObject)

  return (
    <Card className="fixed top-4 left-1/2 -translate-x-1/2 p-2 flex items-center gap-2">
      <button
        onClick={onAddText}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Add Text"
      >
        <Type size={20} />
      </button>

      {selectedObject && options.length > 0 && (
        <>
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex items-center gap-2">
            {options.map((o) => (
              <div key={o.id}>
                {o.render(
                  selectedObject as ObjectTypeMap[typeof selectedObject.type],
                  () => {}
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

const textOptions: ToolbarOption<"text">[] = [
  {
    id: "font-size",
    label: "Font Size",
    type: "number",
    render: (obj, onChange) => {
      if (!(obj instanceof TextObject)) return null

      return (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const newSize = Math.max(12, obj.style.size - 2)
              onChange({ style: { ...obj.style, size: newSize } })
            }}
          >
            <MinusSquare size={20} />
          </button>
          <span className="w-8 text-center">{obj.style.size}</span>
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => {
              const newSize = Math.min(72, obj.style.size + 2)
              onChange({ style: { ...obj.style, size: newSize } })
            }}
          >
            <PlusSquare size={20} />
          </button>
        </div>
      )
    },
  },
  {
    id: "font-style",
    label: "Italic",
    type: "button",
    render: (obj: BaseObject, onChange) => {
      const textObj = obj as TextObject
      const isItalic = textObj.style.italic
      return (
        <button
          className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
            isItalic ? "bg-gray-200" : ""
          }`}
          onClick={() => {
            onChange({ style: { ...textObj.style, italic: !isItalic } })
          }}
        >
          <Italic size={20} />
        </button>
      )
    },
  },
  {
    id: "delete",
    label: "Delete",
    type: "button",
    render: (obj: BaseObject, onChange) => (
      <button
        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
        onClick={() => onChange()}
      >
        <CrossIcon size={20} />
      </button>
    ),
  },
]

export function useRegisterTextOptions() {
  const { registerObjectOptions } = useToolbar()

  useEffect(() => {
    registerObjectOptions("text", textOptions)
  }, [registerObjectOptions])
}
