/* Engine test manifest: the demo scene plus an end card that crosses it (overlap 0.8 s).
 * Total = 8 + 3 - 0.8 = 10.2 s. Use with ?manifest=scenes/manifest.demo.js or
 * `node engine/render.mjs --manifest scenes/manifest.demo.js ...`. */
Film.manifest([
  { id: '_demo', file: '_demo.js', duration: 8 },
  { id: '_demo_outro', file: '_demo_outro.js', duration: 3, overlap: 0.8 },
]);
