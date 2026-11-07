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
  // { id: '_demo', file: '_demo.js', duration: 8 },
  // { id: '_demo_outro', file: '_demo_outro.js', duration: 3, overlap: 0.8 },
]);
