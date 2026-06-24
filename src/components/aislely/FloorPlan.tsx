"use client";

import { useRef, useState } from "react";
import type { Shelf } from "@/lib/aislely-types";
import { CELL, GRID_H, GRID_W } from "@/lib/aislely-types";
import { categoryOf } from "@/lib/aislely-catalog";

const VB_W = GRID_W * CELL;
const VB_H = GRID_H * CELL;

export function collides(shelves: Shelf[], id: string, x: number, y: number, w: number, h: number): boolean {
  return shelves.some(
    (s) => s.id !== id && x < s.x + s.w && x + w > s.x && y < s.y + s.h && y + h > s.y
  );
}

export function clampPos(x: number, y: number, w: number, h: number): [number, number] {
  return [Math.max(0, Math.min(GRID_W - w, x)), Math.max(0, Math.min(GRID_H - h, y))];
}

export function findFreeSpot(shelves: Shelf[], w: number, h: number): [number, number] {
  for (let y = 4; y <= GRID_H - h - 1; y++) {
    for (let x = 1; x <= GRID_W - w - 1; x++) {
      if (!collides(shelves, "__new__", x, y, w, h)) return [x, y];
    }
  }
  return [1, 4];
}

const FILL: Record<Shelf["kind"], { fill: string; stroke: string; text: string }> = {
  shelf: { fill: "#fef3c7", stroke: "#d97706", text: "#92400e" },
  fridge: { fill: "#e0f2fe", stroke: "#0284c7", text: "#075985" },
  checkout: { fill: "#e5e7eb", stroke: "#9ca3af", text: "#4b5563" },
  entrance: { fill: "#dcfce7", stroke: "#16a34a", text: "#166534" },
};

export interface FloorPlanProps {
  shelves: Shelf[];
  mode?: "view" | "edit" | "pick" | "label";
  selectedId?: string | null;
  highlightIds?: string[];
  onSelect?: (id: string | null) => void;
  onToggle?: (id: string) => void;
  onMove?: (id: string, x: number, y: number) => void;
  showCategory?: boolean;
  showStatus?: boolean;
  className?: string;
  /** 从组件托盘拖入时的落点预览 */
  ghost?: { x: number; y: number; w: number; h: number; valid: boolean } | null;
}

export default function FloorPlan({
  shelves,
  mode = "view",
  selectedId = null,
  highlightIds = [],
  onSelect,
  onToggle,
  onMove,
  showCategory = true,
  showStatus = false,
  className = "",
  ghost = null,
}: FloorPlanProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    scale: number;
    moved: boolean;
  } | null>(null);
  const [preview, setPreview] = useState<{ id: string; x: number; y: number; bad: boolean } | null>(null);

  function pointerDown(e: React.PointerEvent, s: Shelf) {
    if (mode === "pick") {
      if (s.kind === "shelf" || s.kind === "fridge") onToggle?.(s.id);
      return;
    }
    if (mode === "label" || mode === "view") {
      onSelect?.(s.id);
      return;
    }
    // edit 模式:按下即选中,移动超过阈值进入拖拽
    onSelect?.(s.id);
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = {
      id: s.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: s.x,
      origY: s.y,
      scale: VB_W / rect.width,
      moved: false,
    };
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // 合成指针事件(自动化/测试)可能没有活跃 pointer,忽略即可
    }
  }

  function pointerMove(e: React.PointerEvent, s: Shelf) {
    const d = drag.current;
    if (!d || d.id !== s.id || mode !== "edit") return;
    const dxPx = e.clientX - d.startClientX;
    const dyPx = e.clientY - d.startClientY;
    if (!d.moved && Math.abs(dxPx) < 7 && Math.abs(dyPx) < 7) return;
    d.moved = true;
    const dx = Math.round((dxPx * d.scale) / CELL);
    const dy = Math.round((dyPx * d.scale) / CELL);
    const [nx, ny] = clampPos(d.origX + dx, d.origY + dy, s.w, s.h);
    const bad = collides(shelves, s.id, nx, ny, s.w, s.h);
    setPreview((p) => (p && p.x === nx && p.y === ny && p.bad === bad ? p : { id: s.id, x: nx, y: ny, bad }));
  }

  function pointerUp(s: Shelf) {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== s.id) return setPreview(null);
    if (d.moved && preview && !preview.bad) {
      onMove?.(s.id, preview.x, preview.y);
    }
    setPreview(null);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={`w-full h-auto select-none ${className}`}
      style={mode === "edit" ? { touchAction: "none" } : undefined}
    >
      {/* 地板(点空白处取消选中) */}
      <rect
        x={0}
        y={0}
        width={VB_W}
        height={VB_H}
        rx={10}
        fill="#fafaf9"
        stroke="#d6d3d1"
        strokeWidth={3}
        onPointerDown={() => {
          if (mode === "edit" || mode === "label") onSelect?.(null);
        }}
      />
      {Array.from({ length: GRID_W / 2 - 1 }, (_, i) => (
        <line key={`v${i}`} x1={(i + 1) * CELL * 2} y1={4} x2={(i + 1) * CELL * 2} y2={VB_H - 4} stroke="#f0efed" strokeWidth={1} />
      ))}
      {Array.from({ length: GRID_H / 2 - 1 }, (_, i) => (
        <line key={`h${i}`} x1={4} y1={(i + 1) * CELL * 2} x2={VB_W - 4} y2={(i + 1) * CELL * 2} stroke="#f0efed" strokeWidth={1} />
      ))}

      {shelves.map((s) => {
        const isPreview = preview?.id === s.id;
        const x = (isPreview ? preview.x : s.x) * CELL;
        const y = (isPreview ? preview.y : s.y) * CELL;
        const w = s.w * CELL;
        const h = s.h * CELL;
        const c = FILL[s.kind];
        const selected = selectedId === s.id;
        const highlighted = highlightIds.includes(s.id);
        const pickable = s.kind === "shelf" || s.kind === "fridge";
        const dimmed = mode === "pick" && pickable && !s.included;
        const cat = categoryOf(s.category);
        const cx = x + w / 2;
        const cy = y + h / 2;
        const compact = Math.min(w, h) < 50; // 窄货架(竖条)用紧凑文字
        return (
          <g
            key={s.id}
            onPointerDown={(e) => pointerDown(e, s)}
            onPointerMove={(e) => pointerMove(e, s)}
            onPointerUp={() => pointerUp(s)}
            onPointerCancel={() => pointerUp(s)}
            style={{ cursor: mode === "view" ? "default" : "pointer" }}
            opacity={dimmed ? 0.35 : 1}
          >
            {highlighted && (
              <rect x={x - 5} y={y - 5} width={w + 10} height={h + 10} rx={8} fill="none" stroke="#ef4444" strokeWidth={4} className="wb-pulse" />
            )}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={5}
              fill={isPreview && preview.bad ? "#fee2e2" : c.fill}
              stroke={selected ? "#1c1917" : isPreview && preview.bad ? "#ef4444" : c.stroke}
              strokeWidth={selected ? 3 : 1.5}
              strokeDasharray={dimmed ? "5 4" : undefined}
            />
            {/* 品类 emoji + 编号 */}
            {compact ? (
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill={c.text}>
                {showCategory && cat ? `${cat.emoji}` : ""}{s.code}
              </text>
            ) : (
              <>
                <text x={cx} y={cy - (showCategory && cat ? 6 : 0)} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fill={c.text}>
                  {s.code}
                </text>
                {showCategory && cat && (
                  <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="central" fontSize={10} fill={c.text}>
                    {cat.emoji} {cat.zh}
                  </text>
                )}
              </>
            )}
            {/* pick 模式的勾选角标 */}
            {mode === "pick" && pickable && (
              <>
                <circle cx={x + w - 2} cy={y + 2} r={9} fill={s.included ? "#16a34a" : "#ffffff"} stroke={s.included ? "#16a34a" : "#9ca3af"} strokeWidth={1.5} />
                {s.included && (
                  <text x={x + w - 2} y={y + 2.5} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#fff" fontWeight={700}>
                    ✓
                  </text>
                )}
              </>
            )}
            {/* 录入状态角标 */}
            {showStatus && pickable && s.included && (
              <>
                <circle cx={x + w - 2} cy={y + 2} r={9} fill={s.status === "done" ? "#16a34a" : "#f59e0b"} />
                <text x={x + w - 2} y={y + 2.5} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#fff" fontWeight={700}>
                  {s.status === "done" ? "✓" : "拍"}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* 托盘拖入的落点预览 */}
      {ghost && (
        <rect
          x={ghost.x * CELL}
          y={ghost.y * CELL}
          width={ghost.w * CELL}
          height={ghost.h * CELL}
          rx={5}
          fill={ghost.valid ? "#bbf7d0" : "#fecaca"}
          stroke={ghost.valid ? "#16a34a" : "#ef4444"}
          strokeWidth={2}
          strokeDasharray="6 4"
          opacity={0.8}
          pointerEvents="none"
        />
      )}
    </svg>
  );
}
