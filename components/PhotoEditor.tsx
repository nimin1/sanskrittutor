"use client";

import { useCallback, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { IconCheck, IconRefresh } from "@/components/Icons";
import { ml } from "@/lib/i18n/ml";

type Props = {
  src: string;
  onConfirm: (edited: Blob) => void;
  onCancel: () => void;
  busy?: boolean;
};

export function PhotoEditor({ src, onConfirm, onCancel, busy }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [straighten, setStraighten] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  const totalRotation = ((rotation + straighten) % 360 + 360) % 360;

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setPixelCrop(croppedAreaPixels);
  }, []);

  const cssFilter = useMemo(
    () => `brightness(${brightness}%) contrast(${contrast}%)`,
    [brightness, contrast],
  );

  function rotate90() {
    setRotation((r) => (r + 90) % 360);
  }

  function resetEdits() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setStraighten(0);
    setBrightness(100);
    setContrast(100);
  }

  async function handleConfirm() {
    if (!pixelCrop || working) return;
    setWorking(true);
    try {
      const blob = await renderEdited(src, pixelCrop, totalRotation, cssFilter);
      onConfirm(blob);
    } catch {
      setWorking(false);
    }
  }

  return (
    <div className="photo-editor">
      <div className="photo-editor__stage">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          rotation={totalRotation}
          aspect={undefined}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          restrictPosition={false}
          style={{
            containerStyle: { background: "#000" },
            mediaStyle: { filter: cssFilter },
          }}
        />
      </div>

      <div className="photo-editor__controls">
        <SliderRow
          label={ml.snap.editor.zoom}
          value={zoom}
          min={1}
          max={3}
          step={0.05}
          onChange={setZoom}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <SliderRow
          label={ml.snap.editor.straighten}
          value={straighten}
          min={-15}
          max={15}
          step={1}
          onChange={setStraighten}
          format={(v) => `${v > 0 ? "+" : ""}${v}°`}
        />
        <SliderRow
          label={ml.snap.editor.brightness}
          value={brightness}
          min={50}
          max={170}
          step={1}
          onChange={setBrightness}
          format={(v) => `${v}%`}
        />
        <SliderRow
          label={ml.snap.editor.contrast}
          value={contrast}
          min={50}
          max={170}
          step={1}
          onChange={setContrast}
          format={(v) => `${v}%`}
        />

        <div className="row" style={{ gap: 8, marginTop: 4 }}>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={rotate90}
            disabled={working || busy}
          >
            ↻ {ml.snap.editor.rotate90}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={resetEdits}
            disabled={working || busy}
          >
            {ml.snap.editor.reset}
          </button>
        </div>
      </div>

      <div className="row" style={{ gap: 12, marginTop: 16 }}>
        <button
          type="button"
          className="btn btn--primary"
          style={{ flex: 2 }}
          onClick={handleConfirm}
          disabled={!pixelCrop || working || busy}
        >
          <IconCheck size={16} />{" "}
          {working ? ml.snap.editor.processing : ml.snap.editor.useThis}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          style={{ flex: 1 }}
          onClick={onCancel}
          disabled={working || busy}
        >
          <IconRefresh size={16} /> {ml.snap.retake}
        </button>
      </div>
    </div>
  );
}

function SliderRow({
  label, value, min, max, step, onChange, format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="photo-editor__slider">
      <div className="photo-editor__slider-head">
        <span>{label}</span>
        <span className="meta">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/* ── Canvas rendering ────────────────────────────────────────
   Pulls the visible crop out of the source image, applies the
   user's rotation + brightness/contrast, and emits a JPEG blob.
   The math mirrors the official react-easy-crop crop-image
   recipe: rotate around the canvas centre, then slice.
   ────────────────────────────────────────────────────────── */
async function renderEdited(
  src: string,
  pixelCrop: Area,
  rotationDeg: number,
  cssFilter: string,
): Promise<Blob> {
  const image = await loadImage(src);
  const rotRad = (rotationDeg * Math.PI) / 180;
  const { width: bBoxW, height: bBoxH } = rotatedBoundingBox(
    image.width, image.height, rotRad,
  );

  const canvas = document.createElement("canvas");
  canvas.width = bBoxW;
  canvas.height = bBoxH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");

  ctx.filter = cssFilter;
  ctx.translate(bBoxW / 2, bBoxH / 2);
  ctx.rotate(rotRad);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  const cropped = document.createElement("canvas");
  cropped.width = Math.max(1, Math.round(pixelCrop.width));
  cropped.height = Math.max(1, Math.round(pixelCrop.height));
  const cctx = cropped.getContext("2d");
  if (!cctx) throw new Error("Canvas not supported.");

  cctx.drawImage(
    canvas,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, cropped.width, cropped.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    cropped.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.9,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = src;
  });
}

function rotatedBoundingBox(width: number, height: number, rotRad: number) {
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));
  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
}

