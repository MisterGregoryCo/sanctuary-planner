// Layout constants
export const CHAIR_WIDTH = 1.83; // ~22 inches
export const ROW_SPACING = 3; // 36 inches
export const WALL_BUFFER = 3;
export const STAGE_GAP = 2.5; // stage to first row
export const AISLE_WIDTH = 5;
export const SQ_FT_PER_SEAT = 5;

export type LayoutMode = "center" | "front" | "corner";
export type DoorPosition = "bottom" | "top" | "left" | "right";

export interface Chair {
  x: number;
  y: number;
  angle: number; // rotation to face stage
}

export interface LayoutResult {
  chairs: Chair[];
  stageShape: StageShape;
  totalSeats: number;
  sqFtSeated: number;
  utilization: number;
}

export type StageShape =
  | { type: "octagon"; cx: number; cy: number; radius: number }
  | { type: "rect"; x: number; y: number; w: number; h: number }
  | { type: "triangle"; points: [number, number][] };

// ─── Center Octagon ───────────────────────────────────────────
export function calcCenterLayout(
  roomW: number,
  roomD: number,
  stageRadius: number,
  aisleCount: number
): LayoutResult {
  const cx = roomW / 2;
  const cy = roomD / 2;
  const chairs: Chair[] = [];

  const firstRowRadius = stageRadius + STAGE_GAP;
  const maxRadius = Math.min(roomW, roomD) / 2 - WALL_BUFFER;
  const sectionAngle = (2 * Math.PI) / aisleCount;
  const aisleAngleGap = AISLE_WIDTH / ((firstRowRadius + maxRadius) / 2);

  for (let row = 0; ; row++) {
    const r = firstRowRadius + row * ROW_SPACING;
    if (r > maxRadius) break;

    const circumference = 2 * Math.PI * r;
    const chairArcLen = CHAIR_WIDTH;

    for (let s = 0; s < aisleCount; s++) {
      const sectionStart = s * sectionAngle + aisleAngleGap / 2;
      const sectionEnd = (s + 1) * sectionAngle - aisleAngleGap / 2;
      const availableAngle = sectionEnd - sectionStart;
      if (availableAngle <= 0) continue;

      const availableArc = availableAngle * r;
      const seatsInSection = Math.floor(availableArc / chairArcLen);
      if (seatsInSection <= 0) continue;

      const usedAngle = (seatsInSection * chairArcLen) / r;
      const startAngle = sectionStart + (availableAngle - usedAngle) / 2;

      for (let i = 0; i < seatsInSection; i++) {
        const angle = startAngle + (i + 0.5) * (chairArcLen / r);
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        // face toward center
        const faceAngle = Math.atan2(cy - y, cx - x) * (180 / Math.PI);
        if (x > WALL_BUFFER && x < roomW - WALL_BUFFER && y > WALL_BUFFER && y < roomD - WALL_BUFFER) {
          chairs.push({ x, y, angle: faceAngle });
        }
      }
    }
  }

  const totalArea = roomW * roomD;
  const sqFtSeated = chairs.length * SQ_FT_PER_SEAT;

  return {
    chairs,
    stageShape: { type: "octagon", cx, cy, radius: stageRadius },
    totalSeats: chairs.length,
    sqFtSeated,
    utilization: totalArea > 0 ? (sqFtSeated / totalArea) * 100 : 0,
  };
}

// ─── Front Stage ──────────────────────────────────────────────
export function calcFrontLayout(
  roomW: number,
  roomD: number,
  stageW: number,
  stageD: number
): LayoutResult {
  const chairs: Chair[] = [];
  const stageX = (roomW - stageW) / 2;
  const stageY = 0;

  // seating starts after stage + gap
  const seatingTop = stageD + STAGE_GAP;
  const seatingBottom = roomD - WALL_BUFFER;
  const seatingLeft = WALL_BUFFER;
  const seatingRight = roomW - WALL_BUFFER;
  const seatingWidth = seatingRight - seatingLeft;

  // 2 aisles at 33% and 66%
  const aisle1Center = seatingLeft + seatingWidth * 0.333;
  const aisle2Center = seatingLeft + seatingWidth * 0.666;

  const sections = [
    { left: seatingLeft, right: aisle1Center - AISLE_WIDTH / 2 },
    { left: aisle1Center + AISLE_WIDTH / 2, right: aisle2Center - AISLE_WIDTH / 2 },
    { left: aisle2Center + AISLE_WIDTH / 2, right: seatingRight },
  ];

  for (let row = 0; ; row++) {
    const y = seatingTop + row * ROW_SPACING;
    if (y > seatingBottom) break;

    for (const section of sections) {
      const sectionW = section.right - section.left;
      if (sectionW < CHAIR_WIDTH) continue;
      const count = Math.floor(sectionW / CHAIR_WIDTH);
      const offset = (sectionW - count * CHAIR_WIDTH) / 2;
      for (let i = 0; i < count; i++) {
        chairs.push({
          x: section.left + offset + i * CHAIR_WIDTH + CHAIR_WIDTH / 2,
          y,
          angle: -90, // face up toward stage
        });
      }
    }
  }

  const totalArea = roomW * roomD;
  const sqFtSeated = chairs.length * SQ_FT_PER_SEAT;

  return {
    chairs,
    stageShape: { type: "rect", x: stageX, y: stageY, w: stageW, h: stageD },
    totalSeats: chairs.length,
    sqFtSeated,
    utilization: totalArea > 0 ? (sqFtSeated / totalArea) * 100 : 0,
  };
}

// ─── Corner Stage ─────────────────────────────────────────────
export function calcCornerLayout(
  roomW: number,
  roomD: number,
  stageSize: number
): LayoutResult {
  const chairs: Chair[] = [];
  // Stage triangle in top-left corner
  const stagePoints: [number, number][] = [
    [0, 0],
    [stageSize, 0],
    [0, stageSize],
  ];

  const firstRowRadius = stageSize * Math.SQRT2 / 2 + STAGE_GAP;
  const maxRadius = Math.min(roomW, roomD) - WALL_BUFFER;

  // Quarter circle from top-left, sweeping 0 to PI/2 (right to down)
  const arcStart = 0;
  const arcEnd = Math.PI / 2;
  const totalArc = arcEnd - arcStart;
  const aisleAngleGap1 = AISLE_WIDTH / ((firstRowRadius + maxRadius) / 2);
  const aisle1Angle = arcStart + totalArc * 0.333;
  const aisle2Angle = arcStart + totalArc * 0.666;

  const sections = [
    { start: arcStart, end: aisle1Angle - aisleAngleGap1 / 2 },
    { start: aisle1Angle + aisleAngleGap1 / 2, end: aisle2Angle - aisleAngleGap1 / 2 },
    { start: aisle2Angle + aisleAngleGap1 / 2, end: arcEnd },
  ];

  for (let row = 0; ; row++) {
    const r = firstRowRadius + row * ROW_SPACING;
    if (r > maxRadius) break;

    for (const section of sections) {
      const availableAngle = section.end - section.start;
      if (availableAngle <= 0) continue;
      const availableArc = availableAngle * r;
      const count = Math.floor(availableArc / CHAIR_WIDTH);
      if (count <= 0) continue;

      const usedAngle = (count * CHAIR_WIDTH) / r;
      const startA = section.start + (availableAngle - usedAngle) / 2;

      for (let i = 0; i < count; i++) {
        const a = startA + (i + 0.5) * (CHAIR_WIDTH / r);
        const x = r * Math.cos(a);
        const y = r * Math.sin(a);
        const faceAngle = Math.atan2(-y, -x) * (180 / Math.PI); // face corner
        if (x > WALL_BUFFER && x < roomW - WALL_BUFFER && y > WALL_BUFFER && y < roomD - WALL_BUFFER) {
          chairs.push({ x, y, angle: faceAngle });
        }
      }
    }
  }

  const totalArea = roomW * roomD;
  const sqFtSeated = chairs.length * SQ_FT_PER_SEAT;

  return {
    chairs,
    stageShape: { type: "triangle", points: stagePoints },
    totalSeats: chairs.length,
    sqFtSeated,
    utilization: totalArea > 0 ? (sqFtSeated / totalArea) * 100 : 0,
  };
}
