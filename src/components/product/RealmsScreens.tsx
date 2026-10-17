type ScreenEntry = 'casual' | 'competitive';

const screenCopy = {
  casual: {
    heading: <>Another world.<br /><span>Another first move.</span></>,
    copy: 'Find an unfamiliar place. Open its story. Decide where it goes next.',
    main: 'Concept screenshot of the Realms world library, featuring The Glasshouse, Northbound, and Pressure Drop.',
    detail: 'A separate Glasshouse journal screenshot with a situation, a field note, and a decision to open the roof vents.',
    detailHeight: 486,
  },
  competitive: {
    heading: <>From the lobby.<br /><span>Into the match.</span></>,
    copy: 'Meet the other side. Assign your roles. Take one shared plan into the challenge.',
    main: 'Concept screenshot of the Realms match lobby, with Atlas and Vega team rosters, roles, and the shared challenge.',
    detail: 'A separate team planning screenshot with coordination messages, assigned responsibilities, and the next team move.',
    detailHeight: 460,
  },
};

/** Static screenshot artwork. The software UI within these images has no page controls. */
export default function RealmsScreens({ entry }: { entry: ScreenEntry }) {
  const content = screenCopy[entry];
  return <section id={`${entry}-screens`} className="realms-screens" data-screen-entry={entry} aria-labelledby={`${entry}-screens-heading`}>
    <div className="product-container">
      <div className="realms-screens-heading">
        <h2 id={`${entry}-screens-heading`}>{content.heading}</h2>
        <p>{content.copy}</p>
      </div>
      <figure className="realms-screen-composition">
        <div className="realms-screen-stage">
          <img className="realms-screen-main" src={`/assets/realms/screens/${entry}-main-1800.webp`} srcSet={`/assets/realms/screens/${entry}-main-900.webp 900w, /assets/realms/screens/${entry}-main-1800.webp 1800w`} sizes="(max-width: 767px) 90vw, 76vw" width="1200" height="760" alt={content.main} loading="lazy" decoding="async" draggable={false} />
          <img className="realms-screen-detail" src={`/assets/realms/screens/${entry}-detail-900.webp`} srcSet={`/assets/realms/screens/${entry}-detail-600.webp 600w, /assets/realms/screens/${entry}-detail-900.webp 900w`} sizes="(max-width: 767px) 61vw, 37vw" width="600" height={content.detailHeight} alt={content.detail} loading="lazy" decoding="async" draggable={false} />
        </div>
        <figcaption className="realms-screen-caption">Illustrated interface concepts. Realms is in development.</figcaption>
      </figure>
    </div>
  </section>;
}
