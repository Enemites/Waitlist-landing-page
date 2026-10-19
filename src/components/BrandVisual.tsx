/** Abstract company ornament: inquiry, convergence, and an open field of possibilities. */
const artworkSizes = "(max-width: 767px) calc(100vw - 64px), (max-width: 1023px) 634px, (max-width: 1100px) 46vw, 620px";

export default function BrandVisual({ className = "" }: { className?: string }) {
  return (
    <div className={`brand-visual ${className}`}>
      <picture>
        <source
          type="image/avif"
          srcSet="/assets/lab-inquiry-abstract-640.avif 640w, /assets/lab-inquiry-abstract-960.avif 960w, /assets/lab-inquiry-abstract-1536.avif 1536w"
          sizes={artworkSizes}
        />
        <img
          src="/assets/lab-inquiry-abstract-960.webp"
          srcSet="/assets/lab-inquiry-abstract-640.webp 640w, /assets/lab-inquiry-abstract-960.webp 960w, /assets/lab-inquiry-abstract-1536.webp 1536w"
          sizes={artworkSizes}
          alt="Abstract charcoal and terracotta line fields converging around an open center."
          className="brand-visual-image"
          fetchPriority="high"
          width="1536"
          height="1024"
        />
      </picture>
    </div>
  );
}
