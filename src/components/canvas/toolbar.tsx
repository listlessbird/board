import { BaseObject } from "@/lib/canvas/objects/base"
import { toolbarRegistry } from "@/lib/canvas/toolbar/toolbar-registry"

type ToolbarProps<T extends BaseObject = BaseObject> = {
  selectedObject: T | null
  onAction: (action: string, obj: T) => void
}

export function Toolbar<T extends BaseObject>({
  onAction,
  selectedObject,
}: ToolbarProps<T>) {
  if (!selectedObject) return null

  const actions = toolbarRegistry.getActions(
    selectedObject.type,
    selectedObject as any
  )

  const groups = toolbarRegistry.getGroups()

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-800 rounded-lg shadow-lg p-2 flex gap-2">
      {groups.map((g) => {
        const groupActions = actions.filter((a) => a.group === g.id)
        if (groupActions.length === 0) return null

        return (
          <div key={g.id} className="flex gap-2">
            {groupActions.map((a) => (
              <button
                key={a.id}
                onClick={() => onAction(a.id, selectedObject)}
                className="p-2 hover:bg-slate-700 rounded-md text-white flex items-center gap-2"
                title={a.shortcut ? `${a.label} (${a.shortcut})` : a.label}
              >
                {a.icon && <a.icon className="size-4" />}
                {a.label}
              </button>
            ))}

            {g.id !== groups[groups.length - 1].id && (
              <div className="w-px h-auto bg-slate-600" />
            )}
          </div>
        )
      })}
    </div>
  )
}
