export interface Postition {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Transform {
  position: Postition;
  rotation: number;
  scale: number;
}

export interface Bounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

// for now only support text and image
export type CanvasObjectType = "text" | "image";

export interface CanvasObject {
  id: string;
  type: CanvasObjectType;
  transform: Transform;
  selected: boolean;
}
