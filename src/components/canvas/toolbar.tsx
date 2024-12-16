import { BaseObject } from "@/lib/canvas/objects/base"
import { toolbarRegistry } from "@/lib/canvas/toolbar/toolbar-registry"
import { GlobalToolbarAction, ObjectToolbarAction } from "@/types"
import { useMemo } from "react"

type ToolbarProps<T extends BaseObject = BaseObject> = {
  selectedObject: T | null
  onAction: (action: string, obj?: T) => void
}

export function Toolbar<T extends BaseObject>({
  onAction,
  selectedObject,
}: ToolbarProps<T>) {
  const globalActions = useMemo(() => toolbarRegistry.getGlobalActions(), [])

  const objectActions = useMemo(
    () =>
      selectedObject
        ? toolbarRegistry.getObjectActions(
            selectedObject.type,
            selectedObject as any
          )
        : [],
    [selectedObject]
  )

  const groups = useMemo(() => toolbarRegistry.getGroups(), [])

  const renderActionButton = (
    a: GlobalToolbarAction | ObjectToolbarAction<T>,
    obj?: T
  ) => (
    <button
      key={a.id}
      onClick={() => onAction(a.id, obj)}
      className="p-2 hover:bg-slate-700 rounded-md text-white flex items-center gap-2"
      title={a.label}
    >
      {a.icon && <a.icon className="size-4" />}
    </button>
  )

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-800 rounded-lg shadow-lg p-2">
      <div className="flex gap-2">
        {/* global actions */}
        <div className="flex gap-2">
          {globalActions.map((a) => renderActionButton(a))}
        </div>

        {globalActions.length > 0 && objectActions.length > 0 && (
          <div className="w-px h-auto bg-slate-600" />
        )}

        {/* object specific actions */}

        {objectActions.length > 0 &&
          groups.map((g) => {
            const groupActions = objectActions.filter((a) => a.group === g.id)

            if (groupActions.length === 0) return null

            return (
              <div key={g.id} className="flex gap-2">
                {groupActions.map((a) =>
                  renderActionButton(a, selectedObject as any)
                )}

                {g.id !== groups[groups.length - 1].id && (
                  <div className="w-px h-auto bg-slate-600" />
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
