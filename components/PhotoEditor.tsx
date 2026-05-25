"use client";

import { useMemo, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { IconCheck, IconRefresh } from "@/components/Icons";
import { ml } from "@/lib/i18n/ml";

type Props = {
  src: string;
  onConfirm: (edited: Blob) => void;
  onCancel: () => void;
  busy?: boolean;
};

/**
 * Photo editor for the snap flow.
 *
 * Uses react-image-crop because it gives draggable corner+edge handles
 * (so the learner can adjust the crop window height/width directly),
 * which is what she expects from a phone photos app. The image itself
 * stays anchored — the crop rectangle is what she manipulates.
 *
 * Rotation and brightness/contrast are applied on top via canvas at
 * confirm-time. We also preview the brightness/contrast live via CSS
 * filter on the image element while she adjusts.
 */
export function PhotoEditor({ src, onConfirm, onCancel, busy }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    x: 5,
    y: 5,
    width: 90,
    height: 90,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [rotation, setRotation] = useState(0);
  const [straighten, setStraighten] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [working, setWorking] = useState(false);

  const totalRotation = ((rotation + straighten) % 360 + 360) % 360;

  const cssFilter = useMemo(
    () => `brightness(${brightness}%) contrast(${contrast}%)`,
    [brightness, contrast],
  );

  function rotate90() {
    setRotation((r) => (r + 90) % 360);
    /* Reset crop because the image dimensions just flipped. */
    setCrop({ unit: "%", x: 5, y: 5, width: 90, height: 90 });
    setCompletedCrop(null);
  }

  function resetEdits() {
    setRotation(0);
    setStraighten(0);
    setBrightness(100);
    setContrast(100);
    setCrop({ unit: "%", x: 5, y: 5, width: 90, height: 90 });
    setCompletedCrop(null);
  }

  async function handleConfirm() {
    const image = imgRef.current;
    if (!image || working) return;
    setWorking(true);
    try {
      const cropToUse: PixelCrop =
        completedCrop && completedCrop.width > 0 && completedCrop.height > 0
          ? completedCrop
          : fullImageCrop(image);
      const blob = await renderEdited(image, cropToUse, totalRotation, cssFilter);
      onConfirm(blob);
    } catch {
      setWorking(false);
    }
  }

  return (
    <div className="photo-editor">
      <div className="photo-editor__stage">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          keepSelection
          ruleOfThirds
        >
          <img
            ref={imgRef}
            src={src}
            alt=""
            style={{
              filter: cssFilter,
              transform: `rotate(${totalRotation}deg)`,
              maxWidth: "100%",
              maxHeight: "60vh",
              display: "block",
            }}
          />
        </ReactCrop>
      </div>

      <div className="photo-editor__controls">
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
          disabled={working || busy}
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

function fullImageCrop(image: HTMLImageElement): PixelCrop {
  return {
    unit: "px",
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  };
}

/* ── Canvas rendering ────────────────────────────────────────
   Renders the source image rotated, then slices out the user's
   crop selection (which was made against the *displayed* image,
   so we scale by naturalWidth/displayedWidth to map back).
   Brightness/contrast bake in via ctx.filter.
   ────────────────────────────────────────────────────────── */
async function renderEdited(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  rotationDeg: number,
  cssFilter: string,
): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const cropX = pixelCrop.x * scaleX;
  const cropY = pixelCrop.y * scaleY;
  const cropW = pixelCrop.width * scaleX;
  const cropH = pixelCrop.height * scaleY;

  const rotRad = (rotationDeg * Math.PI) / 180;
  const { width: bBoxW, height: bBoxH } = rotatedBoundingBox(
    image.naturalWidth, image.naturalHeight, rotRad,
  );

  const rotated = document.createElement("canvas");
  rotated.width = bBoxW;
  rotated.height = bBoxH;
  const rctx = rotated.getContext("2d");
  if (!rctx) throw new Error("Canvas not supported.");

  rctx.filter = cssFilter;
  rctx.translate(bBoxW / 2, bBoxH / 2);
  rctx.rotate(rotRad);
  rctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  /* The crop selection was drawn over the unrotated displayed image, but
     react-image-crop applies its own coordinates against the rendered DOM
     element (which we visually rotated via CSS). So pixelCrop is already in
     the rotated frame from the user's perspective. We slice from the rotated
     canvas using the same offset/size, mapped back through the rotation. */
  const offsetX = (bBoxW - image.naturalWidth) / 2;
  const offsetY = (bBoxH - image.naturalHeight) / 2;

  const cropped = document.createElement("canvas");
  cropped.width = Math.max(1, Math.round(cropW));
  cropped.height = Math.max(1, Math.round(cropH));
  const cctx = cropped.getContext("2d");
  if (!cctx) throw new Error("Canvas not supported.");

  cctx.drawImage(
    rotated,
    cropX + offsetX, cropY + offsetY, cropW, cropH,
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

function rotatedBoundingBox(width: number, height: number, rotRad: number) {
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));
  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
}
