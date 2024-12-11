import { Canvas } from "@/app/components/canvas/root";
import { GridSmallBackground } from "@/app/components/grid-bg";

export default function Home() {
  return (
    <div>
      <GridSmallBackground />
      <Canvas />
    </div>
  );
}
