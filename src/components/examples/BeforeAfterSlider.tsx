import { useRef, useState, useCallback, useEffect } from "react";
import { GripVertical } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  isBackgroundRemove?: boolean;
}

const BeforeAfterSlider = ({ beforeUrl, afterUrl, isBackgroundRemove }: BeforeAfterSliderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    updatePosition(e.clientX);
  }, [dragging, updatePosition]);

  const onPointerUp = useCallback(() => setDragging(false), []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[280px] overflow-hidden select-none touch-none cursor-col-resize"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Checkerboard for bg-remove */}
      {isBackgroundRemove && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-conic-gradient(#2A2A35 0% 25%, #1E1E25 0% 50%)`,
            backgroundSize: "16px 16px",
          }}
        />
      )}

      {/* BEFORE image (full) */}
      <img src={beforeUrl} alt="Before" className="absolute inset-0 w-full h-full object-cover" />

      {/* AFTER image (clipped) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
        {isBackgroundRemove && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-conic-gradient(#2A2A35 0% 25%, #1E1E25 0% 50%)`,
              backgroundSize: "16px 16px",
            }}
          />
        )}
        <img src={afterUrl} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      </div>

      {/* Divider */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white z-10" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 md:w-10 md:h-10 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-lg">
          <GripVertical className="w-3 h-3 md:w-4 md:h-4 text-primary" />
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-2 left-2 text-[10px] uppercase font-medium bg-black/70 text-white rounded px-2 py-0.5 z-20">
        Before
      </span>
      <span className="absolute top-2 right-2 text-[10px] uppercase font-medium bg-black/70 text-[#A78BFA] rounded px-2 py-0.5 z-20">
        After
      </span>
    </div>
  );
};

export default BeforeAfterSlider;
