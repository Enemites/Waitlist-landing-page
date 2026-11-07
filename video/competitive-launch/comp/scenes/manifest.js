/* Scene order of the film. Each entry: { id, file, duration, overlap? }
 *  - file: path relative to this folder (default `${id}.js`)
 *  - duration: seconds (authoritative; overrides the duration given in Film.scene)
 *  - overlap: seconds THIS scene starts before the PREVIOUS scene ends (default 0). Both scenes
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
]);
