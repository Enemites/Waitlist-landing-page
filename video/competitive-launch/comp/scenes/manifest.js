/* Scene order of the film. Each entry: { id, file, duration, overlap? }
 *  - file: path relative to this folder (default `${id}.js`)
 *  - duration: seconds (authoritative; overrides the duration given in Film.scene)
 *  - overlap: seconds THIS scene starts before the PREVIOUS scene ends (default 0).
 *  - at: makes the entry an OVERLAY at an absolute film time (drawn above, does not shift the sequence). Both scenes
 *    render during the overlap; the later scene is on top, so it owns the transition.
 * The film duration is sum(duration) - sum(overlap). Later scenes are stacked above earlier ones.
 *
 * Engine demo (not part of the film). Uncomment to test, or render it without editing this file:
 *   node engine/render.mjs --manifest scenes/manifest.demo.js --out .work/engine-test/demo.mp4
 */
Film.manifest([
  { id: 's01-hook-live', file: 's01-hook-live.js', duration: 3 },
  { id: 's02-freeze-rewind', file: 's02-freeze-rewind.js', duration: 2 },
  { id: 's03-every-great-plan', file: 's03-every-great-plan.js', duration: 8, overlap: 1 },
  { id: 's04-hinge-title', file: 's04-hinge-title.js', duration: 4 },
  { id: 's05-one-world', file: 's05-one-world.js', duration: 6 },
  { id: 's06-form-your-team', file: 's06-form-your-team.js', duration: 6 },
  { id: 's07-find-your-opposition', file: 's07-find-your-opposition.js', duration: 6 },
  { id: 's08-make-your-move', file: 's08-make-your-move.js', duration: 10 },
  { id: 's09-last-seen', file: 's09-last-seen.js', duration: 2 },
  { id: 's10-coordinate-commit-adapt', file: 's10-coordinate-commit-adapt.js', duration: 6 },
  { id: 's11-the-match', file: 's11-the-match.js', duration: 4 },
  { id: 's12-on-the-record', file: 's12-on-the-record.js', duration: 2 },
  { id: 's13-see-whose-strategy-holds', file: 's13-see-whose-strategy-holds.js', duration: 6 },
  { id: 's14-make-your-next-move', file: 's14-make-your-next-move.js', duration: 8 },
  // ---- revision v3 inserts: OVERLAYS at absolute film times (docs/revision-v3.md) ----
  { id: 'x05-iso-world', file: 'x05-iso-world.js', at: 18.25, duration: 1.75 },
  { id: 'x05-versus', file: 'x05-versus.js', at: 20.0, duration: 2.0 },
  { id: 'x06-player-cards', file: 'x06-player-cards.js', at: 25.0, duration: 1.0 },
  { id: 'x08-gate-schematic', file: 'x08-gate-schematic.js', at: 39.0, duration: 1.5 },
  { id: 'x10-formation', file: 'x10-formation.js', at: 46.0, duration: 2.0 },
  { id: 'x11-archive-flash', file: 'x11-archive-flash.js', at: 52.5, duration: 2.0 },
  { id: 'x13-iso-plans', file: 'x13-iso-plans.js', at: 58.0, duration: 1.5 },
]);
