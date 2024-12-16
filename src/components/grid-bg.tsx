import React from "react"

export function GridSmallBackground() {
  return (
    <div className="min-h-dvh w-full bg-black bg-grid-small-white/[0.2]  relative flex items-center justify-center">
      {/* Radial gradient for the container to give a faded look */}
      <div className="absolute pointer-events-none inset-0 flex items-center justify-centerbg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
    </div>
  )
}
