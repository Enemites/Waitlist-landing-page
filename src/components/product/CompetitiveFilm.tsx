import { Play } from "lucide-react";
import { useRef, useState } from "react";

const FILM_SRC = "/assets/scene/realms-competitive-launch.mp4";
const FILM_POSTER = "/assets/realms/competitive-launch-poster.webp";

// The Competitive launch film. Nothing loads until the visitor presses play; then native controls take over.
export default function CompetitiveFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  const start = () => {
    setStarted(true);
    const el = video.current;
    if (!el) return;
    void el.play().catch(() => {});
    // The play button unmounts on this click; keep keyboard focus on the now-controllable video.
    requestAnimationFrame(() => el.focus());
  };

  return <section className="competitive-film" aria-labelledby="competitive-film-heading">
    <div className="product-container">
      <header className="competitive-film-heading">
        <p className="product-eyebrow">Competitive / Launch film</p>
        <h2 id="competitive-film-heading">Watch a match <span>take shape.</span></h2>
      </header>
      <figure className="competitive-film-frame" data-started={started}>
        <video
          ref={video}
          controls={started}
          playsInline
          preload="none"
          poster={FILM_POSTER}
          width={1280}
          height={720}
          aria-label="Realms Competitive launch film"
          onPlay={() => setStarted(true)}
        >
          <source src={FILM_SRC} type="video/mp4" />
        </video>
        {!started && <button type="button" className="competitive-film-play" onClick={start}>
          <span className="competitive-film-play-icon" aria-hidden="true"><Play size={20} fill="currentColor" /></span>
          <span>Play the film</span>
          <span className="competitive-film-duration">1:14</span>
        </button>}
      </figure>
    </div>
  </section>;
}
