"use client";

import { useState, useMemo } from "react";
import {
  LayoutMode,
  DoorPosition,
  calcCenterLayout,
  calcFrontLayout,
  calcCornerLayout,
  CHAIR_WIDTH,
  ROW_SPACING,
  WALL_BUFFER,
  STAGE_GAP,
  AISLE_WIDTH,
  SQ_FT_PER_SEAT,
} from "./layoutEngine";
import FloorPlanSVG from "./FloorPlanSVG";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

const TABS: { mode: LayoutMode; icon: string; label: string }[] = [
  { mode: "center", icon: "\u2B21", label: "Center Octagon" },
  { mode: "front", icon: "\u25AC", label: "Front Stage" },
  { mode: "corner", icon: "\u25E3", label: "Corner Stage" },
];

const DOORS: DoorPosition[] = ["bottom", "top", "left", "right"];

export default function Home() {
  // Dimension string state for UX — validate on blur
  const [widthFtStr, setWidthFtStr] = useState("60");
  const [widthInStr, setWidthInStr] = useState("0");
  const [depthFtStr, setDepthFtStr] = useState("80");
  const [depthInStr, setDepthInStr] = useState("0");

  // Validated numeric values
  const [widthFt, setWidthFt] = useState(60);
  const [widthIn, setWidthIn] = useState(0);
  const [depthFt, setDepthFt] = useState(80);
  const [depthIn, setDepthIn] = useState(0);

  const [mode, setMode] = useState<LayoutMode>("center");
  const [door, setDoor] = useState<DoorPosition>("bottom");

  // Center controls
  const [centerStageSize, setCenterStageSize] = useState(12);
  const [centerAisles, setCenterAisles] = useState(6);

  // Front controls
  const [frontStageWidth, setFrontStageWidth] = useState(24);
  const [frontStageDepth, setFrontStageDepth] = useState(12);

  // Corner controls
  const [cornerStageSize, setCornerStageSize] = useState(14);

  const roomW = widthFt + widthIn / 12;
  const roomD = depthFt + depthIn / 12;

  // Clamp front stage width to valid range
  const maxFrontStageW = Math.max(12, roomW - 4);
  const clampedFrontStageW = clamp(frontStageWidth, 12, maxFrontStageW);

  const layout = useMemo(() => {
    if (roomW < 20 || roomD < 20) return null;
    switch (mode) {
      case "center":
        return calcCenterLayout(roomW, roomD, centerStageSize / 2, centerAisles);
      case "front":
        return calcFrontLayout(roomW, roomD, clampedFrontStageW, frontStageDepth);
      case "corner":
        return calcCornerLayout(roomW, roomD, cornerStageSize);
    }
  }, [roomW, roomD, mode, centerStageSize, centerAisles, clampedFrontStageW, frontStageDepth, cornerStageSize]);

  function handleBlur(
    strVal: string,
    setStr: (v: string) => void,
    setNum: (v: number) => void,
    min: number,
    max: number,
    fallback: number
  ) {
    const n = parseInt(strVal, 10);
    if (strVal === "" || isNaN(n)) {
      setStr(String(fallback));
      setNum(fallback);
    } else {
      const clamped = clamp(n, min, max);
      setStr(String(clamped));
      setNum(clamped);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1c2538] px-6 py-4">
        <h1 className="text-xl font-bold" style={{ fontFamily: "Georgia, serif", color: "#e8edf3" }}>
          Sanctuary Planner
        </h1>
        <p className="text-sm text-[#4e5d73] mt-0.5">Church floor plan layout tool</p>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* ─── Control Panel ─── */}
        <aside className="w-full lg:w-[340px] bg-[#0d1118] border-r border-[#1c2538] p-5 flex flex-col gap-5 shrink-0 lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)] lg:overflow-y-auto">

          {/* Room Dimensions */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#4e5d73] mb-3">
              Room Dimensions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#4e5d73] mb-1">Width</label>
                <div className="flex gap-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={widthFtStr}
                      onChange={(e) => setWidthFtStr(e.target.value)}
                      onBlur={() => handleBlur(widthFtStr, setWidthFtStr, setWidthFt, 20, 300, 60)}
                      className="w-14 bg-[#111923] border border-[#1c2538] rounded px-2 py-1.5 text-sm text-center text-[#e8edf3] focus:border-[#c9935a] focus:outline-none"
                    />
                    <span className="text-xs text-[#4e5d73]">ft</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={widthInStr}
                      onChange={(e) => setWidthInStr(e.target.value)}
                      onBlur={() => handleBlur(widthInStr, setWidthInStr, setWidthIn, 0, 11, 0)}
                      className="w-14 bg-[#111923] border border-[#1c2538] rounded px-2 py-1.5 text-sm text-center text-[#e8edf3] focus:border-[#c9935a] focus:outline-none"
                    />
                    <span className="text-xs text-[#4e5d73]">in</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#4e5d73] mb-1">Depth</label>
                <div className="flex gap-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={depthFtStr}
                      onChange={(e) => setDepthFtStr(e.target.value)}
                      onBlur={() => handleBlur(depthFtStr, setDepthFtStr, setDepthFt, 20, 300, 80)}
                      className="w-14 bg-[#111923] border border-[#1c2538] rounded px-2 py-1.5 text-sm text-center text-[#e8edf3] focus:border-[#c9935a] focus:outline-none"
                    />
                    <span className="text-xs text-[#4e5d73]">ft</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={depthInStr}
                      onChange={(e) => setDepthInStr(e.target.value)}
                      onBlur={() => handleBlur(depthInStr, setDepthInStr, setDepthIn, 0, 11, 0)}
                      className="w-14 bg-[#111923] border border-[#1c2538] rounded px-2 py-1.5 text-sm text-center text-[#e8edf3] focus:border-[#c9935a] focus:outline-none"
                    />
                    <span className="text-xs text-[#4e5d73]">in</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Door Position */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#4e5d73] mb-3">
              Door / Entry
            </h2>
            <div className="flex gap-2">
              {DOORS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDoor(d)}
                  className={`flex-1 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                    door === d
                      ? "bg-[#c9935a] text-[#060910]"
                      : "bg-[#111923] text-[#4e5d73] border border-[#1c2538] hover:border-[#c9935a33]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </section>

          {/* Layout Tabs */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#4e5d73] mb-3">
              Layout Mode
            </h2>
            <div className="flex gap-2">
              {TABS.map((t) => (
                <button
                  key={t.mode}
                  onClick={() => setMode(t.mode)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded text-xs font-medium transition-colors ${
                    mode === t.mode
                      ? "bg-[#c9935a] text-[#060910]"
                      : "bg-[#111923] text-[#4e5d73] border border-[#1c2538] hover:border-[#c9935a33]"
                  }`}
                >
                  <span className="text-base">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Per-layout controls */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#4e5d73] mb-3">
              Stage Settings
            </h2>

            {mode === "center" && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#4e5d73]">Stage Size</span>
                    <span className="text-[#c9935a] font-semibold" style={{ fontFamily: "Georgia, serif" }}>
                      {centerStageSize}&apos;
                    </span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={24}
                    step={1}
                    value={centerStageSize}
                    onChange={(e) => setCenterStageSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#4e5d73]">Aisles</span>
                  </div>
                  <div className="flex gap-2">
                    {[4, 6, 8].map((n) => (
                      <button
                        key={n}
                        onClick={() => setCenterAisles(n)}
                        className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${
                          centerAisles === n
                            ? "bg-[#c9935a] text-[#060910]"
                            : "bg-[#111923] text-[#4e5d73] border border-[#1c2538] hover:border-[#c9935a33]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {mode === "front" && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#4e5d73]">Stage Width</span>
                    <span className="text-[#c9935a] font-semibold" style={{ fontFamily: "Georgia, serif" }}>
                      {clampedFrontStageW}&apos;
                    </span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={maxFrontStageW}
                    step={1}
                    value={clampedFrontStageW}
                    onChange={(e) => setFrontStageWidth(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#4e5d73]">Stage Depth</span>
                    <span className="text-[#c9935a] font-semibold" style={{ fontFamily: "Georgia, serif" }}>
                      {frontStageDepth}&apos;
                    </span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={50}
                    step={1}
                    value={frontStageDepth}
                    onChange={(e) => setFrontStageDepth(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {mode === "corner" && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#4e5d73]">Stage Size</span>
                  <span className="text-[#c9935a] font-semibold" style={{ fontFamily: "Georgia, serif" }}>
                    {cornerStageSize}&apos;
                  </span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={24}
                  step={1}
                  value={cornerStageSize}
                  onChange={(e) => setCornerStageSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </section>

          {/* Stats */}
          {layout && (
            <section className="border-t border-[#1c2538] pt-4 mt-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#4e5d73] mb-3">
                Stats
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <StatBox label="Seats" value={layout.totalSeats} />
                <StatBox label="Sq Ft Seated" value={layout.sqFtSeated.toLocaleString()} />
                <StatBox label="Utilization" value={`${layout.utilization.toFixed(1)}%`} />
              </div>
            </section>
          )}
        </aside>

        {/* ─── Floor Plan ─── */}
        <div className="flex-1 flex flex-col items-center p-6 lg:overflow-auto">
          {layout ? (
            <>
              <FloorPlanSVG roomW={roomW} roomD={roomD} layout={layout} door={door} />
              {/* Legend */}
              <div className="flex flex-wrap gap-5 mt-5 text-xs text-[#4e5d73]">
                <LegendItem color="#4a9e7a" label="Chair" />
                <LegendItem color="#c9935a" label="Stage" />
                <LegendItem color="#c9935a" label="Door" isDashed />
              </div>
              {/* Assumptions */}
              <p className="mt-4 text-xs text-[#4e5d73] max-w-xl text-center leading-relaxed">
                Assumptions: {CHAIR_WIDTH}&apos; ({Math.round(CHAIR_WIDTH * 12)}&quot;) chair width,
                {" "}{ROW_SPACING}&apos; row spacing, {WALL_BUFFER}&apos; wall buffer,
                {" "}{STAGE_GAP}&apos; stage gap, {AISLE_WIDTH}&apos; aisles,
                {" "}{SQ_FT_PER_SEAT} sq ft per seat.
              </p>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#4e5d73] text-sm">
              Enter room dimensions (min 20&apos; x 20&apos;) to generate a floor plan.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#111923] border border-[#1c2538] rounded-lg p-3 text-center">
      <div className="text-lg font-bold text-[#e8edf3]" style={{ fontFamily: "Georgia, serif" }}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[#4e5d73] mt-0.5">{label}</div>
    </div>
  );
}

function LegendItem({ color, label, isDashed }: { color: string; label: string; isDashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block w-3 h-3 rounded-sm"
        style={{
          backgroundColor: isDashed ? "transparent" : color,
          border: isDashed ? `2px dashed ${color}` : "none",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
