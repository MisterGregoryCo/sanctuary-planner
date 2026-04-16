"use client";

import { LayoutResult, DoorPosition } from "./layoutEngine";

interface Props {
  roomW: number;
  roomD: number;
  layout: LayoutResult;
  door: DoorPosition;
}

const TARGET_WIDTH = 660;

export default function FloorPlanSVG({ roomW, roomD, layout, door }: Props) {
  const padding = 30;
  const scale = (TARGET_WIDTH - padding * 2) / roomW;
  const svgW = TARGET_WIDTH;
  const svgH = roomD * scale + padding * 2;

  const tx = (x: number) => padding + x * scale;
  const ty = (y: number) => padding + y * scale;
  const ts = (s: number) => s * scale;

  const gridSpacing = ts(5); // 5-foot grid

  // Octagon points
  function octagonPoints(cx: number, cy: number, r: number): string {
    return Array.from({ length: 8 }, (_, i) => {
      const a = (Math.PI / 8) + (i * Math.PI) / 4;
      return `${tx(cx + r * Math.cos(a))},${ty(cy + r * Math.sin(a))}`;
    }).join(" ");
  }

  // Door indicator
  function doorLine() {
    const doorLen = Math.min(roomW, roomD) * 0.2;
    let x1: number, y1: number, x2: number, y2: number;
    switch (door) {
      case "bottom":
        x1 = tx(roomW / 2 - doorLen / 2); y1 = ty(roomD);
        x2 = tx(roomW / 2 + doorLen / 2); y2 = ty(roomD);
        break;
      case "top":
        x1 = tx(roomW / 2 - doorLen / 2); y1 = ty(0);
        x2 = tx(roomW / 2 + doorLen / 2); y2 = ty(0);
        break;
      case "left":
        x1 = tx(0); y1 = ty(roomD / 2 - doorLen / 2);
        x2 = tx(0); y2 = ty(roomD / 2 + doorLen / 2);
        break;
      case "right":
        x1 = tx(roomW); y1 = ty(roomD / 2 - doorLen / 2);
        x2 = tx(roomW); y2 = ty(roomD / 2 + doorLen / 2);
        break;
    }
    return <line x1={x1!} y1={y1!} x2={x2!} y2={y2!} stroke="#c9935a" strokeWidth={4} strokeLinecap="round" />;
  }

  // Stage rendering
  function stageElement() {
    const s = layout.stageShape;
    if (s.type === "octagon") {
      return (
        <polygon
          points={octagonPoints(s.cx, s.cy, s.radius)}
          fill="#111923"
          stroke="#c9935a"
          strokeWidth={2}
          filter="url(#goldGlow)"
        />
      );
    }
    if (s.type === "rect") {
      return (
        <rect
          x={tx(s.x)}
          y={ty(s.y)}
          width={ts(s.w)}
          height={ts(s.h)}
          rx={4}
          fill="#111923"
          stroke="#c9935a"
          strokeWidth={2}
          filter="url(#goldGlow)"
        />
      );
    }
    if (s.type === "triangle") {
      const pts = s.points.map(([px, py]) => `${tx(px)},${ty(py)}`).join(" ");
      return (
        <polygon
          points={pts}
          fill="#111923"
          stroke="#c9935a"
          strokeWidth={2}
          filter="url(#goldGlow)"
        />
      );
    }
    return null;
  }

  // Stage label position
  function stageLabelPos(): { x: number; y: number } {
    const s = layout.stageShape;
    if (s.type === "octagon") return { x: tx(s.cx), y: ty(s.cy) };
    if (s.type === "rect") return { x: tx(s.x + s.w / 2), y: ty(s.y + s.h / 2) };
    if (s.type === "triangle") {
      const cx = (s.points[0][0] + s.points[1][0] + s.points[2][0]) / 3;
      const cy = (s.points[0][1] + s.points[1][1] + s.points[2][1]) / 3;
      return { x: tx(cx), y: ty(cy) };
    }
    return { x: svgW / 2, y: svgH / 2 };
  }

  const labelPos = stageLabelPos();

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      style={{ maxWidth: svgW }}
      className="mx-auto"
    >
      <defs>
        {/* Grid pattern */}
        <pattern id="grid" width={gridSpacing} height={gridSpacing} patternUnits="userSpaceOnUse"
          x={padding} y={padding}>
          <path d={`M ${gridSpacing} 0 L 0 0 0 ${gridSpacing}`} fill="none" stroke="#1c2538" strokeWidth={0.5} />
        </pattern>
        {/* Gold glow */}
        <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#c9935a" floodOpacity="0.4" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect x={0} y={0} width={svgW} height={svgH} fill="#0a0e17" rx={8} />

      {/* Grid inside room */}
      <rect x={tx(0)} y={ty(0)} width={ts(roomW)} height={ts(roomD)} fill="url(#grid)" />

      {/* Room outline */}
      <rect
        x={tx(0)}
        y={ty(0)}
        width={ts(roomW)}
        height={ts(roomD)}
        fill="none"
        stroke="#2a3a52"
        strokeWidth={2}
        rx={2}
      />

      {/* Dimension labels */}
      <text x={tx(roomW / 2)} y={ty(0) - 10} textAnchor="middle" fill="#4e5d73" fontSize={12} fontFamily="Georgia, serif">
        {roomW}&apos;
      </text>
      <text
        x={tx(0) - 10}
        y={ty(roomD / 2)}
        textAnchor="middle"
        fill="#4e5d73"
        fontSize={12}
        fontFamily="Georgia, serif"
        transform={`rotate(-90, ${tx(0) - 10}, ${ty(roomD / 2)})`}
      >
        {roomD}&apos;
      </text>

      {/* Door indicator */}
      {doorLine()}

      {/* Stage */}
      {stageElement()}

      {/* Stage label */}
      <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="central"
        fill="#c9935a" fontSize={11} fontFamily="Georgia, serif" fontWeight="bold" opacity={0.8}>
        STAGE
      </text>

      {/* Chairs */}
      {layout.chairs.map((c, i) => (
        <rect
          key={i}
          x={tx(c.x) - 3}
          y={ty(c.y) - 2}
          width={6}
          height={4}
          rx={1.5}
          fill="#4a9e7a"
          opacity={0.85}
          transform={`rotate(${c.angle}, ${tx(c.x)}, ${ty(c.y)})`}
        />
      ))}
    </svg>
  );
}
