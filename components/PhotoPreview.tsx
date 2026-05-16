import { ml } from "@/lib/i18n/ml";

export function PhotoPreview({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="figure">
      <img className="figure__img" src={src} alt={alt} />
      <figcaption className="figure__caption">
        <strong>{ml.snap.photoReady}</strong>
        <span>{ml.snap.photoSelected}</span>
      </figcaption>
    </figure>
  );
}
