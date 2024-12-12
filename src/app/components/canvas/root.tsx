"use client";

import { MouseEvtHandlers } from "@/app/components/canvas/mouse-evt-handlers";
import { BaseObject } from "@/lib/canvas/objects/base";
import { TextObject } from "@/lib/canvas/objects/text";
import { SelectionManager } from "@/lib/canvas/selection";
import { TransformManager } from "@/lib/canvas/transform";
import { useEffect, useRef, useState } from "react";

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [objects, setObjects] = useState<BaseObject[]>([]);
  const selectionManager = useRef(new SelectionManager());
  const transformManager = useRef(new TransformManager());
  const mouseManager = useRef<MouseEvtHandlers | null>(null);

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    mouseManager.current = new MouseEvtHandlers(
      canvasRef,
      selectionManager.current,
      transformManager.current,
      setObjects
    );
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        setContext(ctx);
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      setDimensions({
        width: window.innerWidth * dpr,
        height: window.innerHeight * dpr,
      });

      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth * dpr;
        canvasRef.current.height = window.innerHeight * dpr;
        canvasRef.current.style.width = window.innerWidth + "px";
        canvasRef.current.style.height = window.innerHeight + "px";

        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!context || !canvasRef.current) return;

    const render = () => {
      context.clearRect(0, 0, dimensions.width, dimensions.height);
      objects.forEach((o) => o.render(context));
    };

    render();
  }, [context, objects, dimensions]);

  const addText = () => {
    const newText = new TextObject(`Listless's Board`, {
      x: canvasRef.current!.width / 2,
      y: canvasRef.current!.height / 2,
    });

    setObjects([...objects, newText]);
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={(e) => mouseManager.current?.handleMouseDown(e, objects)}
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
  );
}
