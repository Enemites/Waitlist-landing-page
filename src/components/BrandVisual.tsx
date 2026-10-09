/** Decorative brand artwork, shared by the lab and the simulation environment. */
export default function BrandVisual({ className = "" }: { className?: string }) {
  return (
    <div className={`brand-visual ${className}`} aria-hidden="true">
      <div className="brand-visual-grid" />
      <picture>
        <source type="image/avif" srcSet="/assets/learning-sculpture-640.avif 640w, /assets/learning-sculpture-960.avif 960w" sizes="(max-width:767px) 100vw, 44vw" />
        <img src="/assets/learning-sculpture-960.webp" srcSet="/assets/learning-sculpture-640.webp 640w, /assets/learning-sculpture-960.webp 960w" sizes="(max-width:767px) 100vw, 44vw" alt="" className="brand-visual-image" fetchPriority="high" width="1536" height="1024" />
      </picture>
      <svg className="brand-visual-orbit" viewBox="0 0 600 600" fill="none">
        <circle cx="300" cy="300" r="278" stroke="currentColor" strokeDasharray="2 9" />
        <path d="M300 10v22M300 568v22M10 300h22M568 300h22" stroke="currentColor" />
        <circle cx="300" cy="22" r="4" fill="currentColor" />
      </svg>
      <span className="brand-cross brand-cross-top" />
      <span className="brand-cross brand-cross-bottom" />
    </div>
  );
}
