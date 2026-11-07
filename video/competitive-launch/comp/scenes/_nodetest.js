Film.scene({ id: '_nodetest', duration: 3, build(ctx) {
  const F = Floodgate.world(ctx, { scale: 1.5 });
  const N = NodeMark.create(ctx, { parent: F.wg, x: 684, y: 484 });
  N.born(0.2); N.step(1.5); N.move(1.0, 1.5, { x: 760, y: 540 });
} });
