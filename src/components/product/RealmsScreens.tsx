type ScreenEntry = 'casual' | 'competitive';

const screenCopy = {
  casual: {
    heading: <>Another world.<br /><span>Another first move.</span></>,
    copy: 'Find an unfamiliar place. Read the situation. Decide what happens next.',
    alt: 'Concept screenshot of a Casual world in play: a topographic map of the Tidal Archive, a story note, and three first moves with their cost to the power reserve.',
  },
  competitive: {
    heading: <>From the lobby.<br /><span>Into the match.</span></>,
    copy: 'Meet the other side. Assign your roles. Take one shared plan into the challenge.',
    alt: 'Concept screenshot of a Competitive match: Atlas and Vega on a river map, the team roster, a team channel with the agreed plan, and the floodgate objective.',
  },
};

/** Static interface artwork rendered by scripts/render-realms-screens.mjs from design/screen-compositions. */
export default function RealmsScreens({ entry }: { entry: ScreenEntry }) {
  const content = screenCopy[entry];
  return <section id={`${entry}-screens`} className="realms-screens" data-screen-entry={entry} aria-labelledby={`${entry}-screens-heading`}>
    <div className="product-container">
      <div className="realms-screens-heading">
        <h2 id={`${entry}-screens-heading`}>{content.heading}</h2>
        <p>{content.copy}</p>
      </div>
      <figure className="realms-screen-composition">
        <div className="realms-screen-frame">
          <img className="realms-screen-main" src={`/assets/realms/screens/${entry}-main-2000.webp`} srcSet={`/assets/realms/screens/${entry}-main-1000.webp 1000w, /assets/realms/screens/${entry}-main-2000.webp 2000w`} sizes="(max-width: 1240px) 94vw, 1170px" width="1600" height="1000" alt={content.alt} loading="lazy" decoding="async" draggable={false} />
        </div>
        <figcaption className="realms-screen-caption">Interface concept. Realms is in development.</figcaption>
      </figure>
    </div>
  </section>;
}
