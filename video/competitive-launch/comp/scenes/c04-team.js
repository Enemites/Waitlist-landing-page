/* c04-team: v4 'Worlds' (docs/storyboard-v4.md), film 16.0-26.0. Local 0 = 16.0.
 * INK product world: forming a team, told as crisp collaboration-app UI on paper.
 *
 *   A 0.00-1.50  BRING FRIENDS   invite card springs in; 'Nora' is typed into the friend search, the cursor
 *                                invites her (0.50) and NC flies into the Atlas team bar (lands 0.76, VO
 *                                'friends' 0.62). Left: eyebrow + headline 'Bring friends.' (words on the VO).
 *   B 1.50-3.50  OR JOIN A TEAM  the card is scrolled away, a board of open teams streams up (vertical motion
 *                                blur), decelerates onto Atlas 2/3; Join (2.76), EK pops into the open slot,
 *                                '3/3 · READY' (3.0). Headline line 2 'Or join a team.' (deep amber) on the VO.
 *   T 3.50-4.00                  the Atlas row opens into the team's shared canvas (container transform).
 *   C 4.00-10.0  SHARE / DECIDE  three live cursors (name flags Jules / Nora / Emre) fly in, drop notes and sketch
 *                                on the VO ('Share' 4.60 'you' 5.08 'see' 5.24); on 'Decide' (6.02) the notes are
 *                                dragged into a three-lane plan (one lane per player), lanes fill ('how you'll
 *                                work together'), three agree checks land (8.0 / 8.25 / 8.5), AGREED (9.0).
 * Motion: springs with overshoot on UI, cursor moves accelerate and settle (bowed paths), strokes are drawn by the
 * cursor tip. All per-frame motion is a pure function of local time (onFrame); entrances are tl.fromTo.
 */
(function () {
  'use strict';
  const ID = 'c04-team';
  const B = Brand, C = Brand.C;
  const W = 1920, H = 1080;
  const CH = C.map, INK = C.ink, AM = C.amber, AMD = C.amberDeep;
  const GROUND = '#e9e4db';                       // page ground: ink with a breath of bone (cards stay pure ink)
  const ch = (a) => `rgba(15,13,10,${a})`;
  const S = `[data-scene="${ID}"]`;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, t0, d) => clamp((t - t0) / d, 0, 1);
  const io3 = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const o3 = (u) => 1 - Math.pow(1 - u, 3);
  const o4 = (u) => 1 - Math.pow(1 - u, 4);
  const i2 = (u) => u * u;
  // damped spring step response, normalised to unit time (z damping ratio, n oscillations over the span)
  const spring = (z, n) => { const w = 2 * Math.PI * n, k = z * w / Math.sqrt(1 - z * z); return (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - Math.exp(-k * u) * (Math.cos(w * u) + (k / w) * Math.sin(w * u))); };
  const SP_POP = spring(0.5, 1.5);     // ~16% overshoot: avatars, notes, badges
  const SP_MOVE = spring(0.66, 1.2);   // ~7%: drags, panels
  const SP_SOFT = spring(0.8, 1.0);    // ~1.5%: large containers
  // cursor 'intent' ease: quick launch, long settle, a hair of overshoot
  const INTENT = (u) => { const a = o4(u); return a + 0.035 * Math.sin(Math.PI * clamp((u - 0.55) / 0.45, 0, 1)) * (u > 0.55 ? 1 : 0); };

  const PEOPLE = [
    { key: 'jules', name: 'Jules', ini: 'JK', col: AM, fg: CH },
    { key: 'nora', name: 'Nora', ini: 'NC', col: CH, fg: INK },
    { key: 'emre', name: 'Emre', ini: 'EK', col: AMD, fg: INK },
  ];

  const ICON = {
    x: `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>`,
    mag: `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="2.4" fill="none"/><path d="M15.5 15.5L20.5 20.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
    check: `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5.5 12.5L10 17L18.5 7.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 6V18M6 12H18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
    ptr: `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M6 3.5L6 19L10 15.2L12.8 21L15.6 19.8L12.9 14.2L18.5 14.2Z" fill="currentColor"/></svg>`,
    note: `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5 4.5H19V14L14 19.5H5Z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" fill="none"/><path d="M14 19.5V14H19" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" fill="none"/></svg>`,
    pen: `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M4.5 19.5L5.5 15L16 4.5L19.5 8L9 18.5Z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" fill="none"/><path d="M13.5 7L17 10.5" stroke="currentColor" stroke-width="2.2"/></svg>`,
    rect: `<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="4.5" y="6" width="15" height="12" rx="2.5" stroke="currentColor" stroke-width="2.2" fill="none"/></svg>`,
    text: `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5.5 6.5H18.5M12 6.5V19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
    share: `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 15V4.5M7.5 9L12 4.5L16.5 9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M5 13V19.5H19V13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10.5V8A4 4 0 0 1 16 8V10.5" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>`,
  };
  // the pointer (tip at 0,0), drawn at 1.3x
  const ARROW = 'M0 0 L0 31 L7.8 23.9 L12.9 35.6 L18.6 33.2 L13.5 21.6 L23.8 21.6 Z';

  Film.scene({
    id: ID,
    duration: 10,
    build(ctx) {
      const { root, tl } = ctx;
      ctx.css(`
        ${S} { background:${GROUND}; }
        ${S} .c04-abs { position:absolute; }
        ${S} .c04-page { position:absolute; inset:0; transform-origin:1380px 560px; }
        ${S} .c04-eyebrow { position:absolute; left:134px; top:384px; display:flex; align-items:center; gap:16px; font:600 22px/1 var(--mono); letter-spacing:.14em; color:${ch(0.62)}; text-transform:uppercase; white-space:pre; }
        ${S} .c04-eyebrow .dia { width:12px; height:12px; background:${AM}; transform:rotate(45deg); flex:none; }
        ${S} .c04-hl { position:absolute; left:128px; font:640 112px/1 var(--display); letter-spacing:-0.055em; color:${CH}; white-space:nowrap; }
        ${S} .c04-hl .ln { overflow:hidden; padding:0 .08em .16em; margin:0 -.08em -.16em; }
        ${S} .c04-hl .w { display:inline-block; }
        ${S} .c04-card { position:absolute; background:${INK}; border-radius:30px; box-shadow:0 46px 90px -40px rgba(15,13,10,.34), 0 10px 24px -14px rgba(15,13,10,.22), 0 0 0 1.5px rgba(15,13,10,.06); }
        ${S} .c04-av { position:absolute; border-radius:50%; display:flex; align-items:center; justify-content:center; font:750 30px/1 var(--display); letter-spacing:-0.02em; box-sizing:border-box; }
        ${S} .c04-slot { position:absolute; border-radius:50%; border:2.5px dashed ${ch(0.26)}; box-sizing:border-box; color:${ch(0.3)}; display:flex; align-items:center; justify-content:center; }
        ${S} .c04-mono { font:600 18px/1 var(--mono); letter-spacing:.14em; text-transform:uppercase; white-space:pre; }
        ${S} .c04-btn { position:absolute; border-radius:999px; display:flex; align-items:center; justify-content:center; gap:10px; font:650 26px/1 var(--display); letter-spacing:-0.01em; white-space:pre; box-sizing:border-box; }
        ${S} .c04-ico { display:inline-block; flex:none; }
        ${S} .c04-row { position:absolute; left:0; width:744px; height:116px; }
        ${S} .c04-row .hair { position:absolute; left:20px; right:20px; bottom:0; height:1.5px; background:${ch(0.08)}; }
        ${S} .c04-em { position:absolute; left:20px; top:28px; width:60px; height:60px; border-radius:16px; display:flex; align-items:center; justify-content:center; font:750 28px/1 var(--display); letter-spacing:-0.02em; }
        ${S} .c04-ws { position:absolute; inset:0; background:${INK}; overflow:hidden; }
        ${S} .c04-cam { position:absolute; inset:0; transform-origin:960px 540px; }
        ${S} .c04-lane { position:absolute; top:146px; width:448px; height:650px; border-radius:28px; background:${INK}; box-sizing:border-box; border:2px solid ${ch(0.09)}; box-shadow:0 30px 60px -36px rgba(15,13,10,.3); }
        ${S} .c04-note { position:absolute; width:384px; height:164px; border-radius:16px; box-sizing:border-box; padding:22px 26px; box-shadow:0 22px 40px -22px rgba(15,13,10,.45), 0 3px 8px -4px rgba(15,13,10,.25); }
        ${S} .c04-note .by { font:600 16px/1 var(--mono); letter-spacing:.16em; text-transform:uppercase; opacity:.62; }
        ${S} .c04-note .tx { position:absolute; left:26px; bottom:24px; font:720 38px/1 var(--display); letter-spacing:-0.035em; white-space:nowrap; }
        ${S} .c04-task { position:absolute; left:32px; display:flex; align-items:center; gap:16px; font:600 27px/1 var(--display); letter-spacing:-0.02em; color:${CH}; white-space:nowrap; }
        ${S} .c04-task .bx { width:22px; height:22px; border-radius:7px; border:2.5px solid ${ch(0.3)}; box-sizing:border-box; flex:none; }
        ${S} .c04-cur { position:absolute; left:0; top:0; }
        ${S} .c04-flag { position:absolute; left:24px; top:44px; height:40px; padding:0 16px; border-radius:12px; display:flex; align-items:center; font:700 23px/1 var(--display); letter-spacing:-0.01em; white-space:nowrap; box-shadow:0 0 0 2.5px ${INK}, 0 8px 18px -10px rgba(15,13,10,.5); }
      `);

      // =========================================================================================
      // PAGE (A + B): headline left, product UI right
      // =========================================================================================
      const page = ctx.el('div', 'c04-page', root);
      const eb = ctx.el('div', 'c04-eyebrow', page, '<span class="dia"></span><span class="txt"></span>');
      tl.fromTo(eb.querySelector('.dia'), { scale: 0, rotation: -90 }, { scale: 1, rotation: 45, duration: 0.45, ease: 'back.out(2)' }, 0.0);
      B.scrambleTo(tl, eb.querySelector('.txt'), '01 · FORM YOUR TEAM', 0.04, 0.5);

      // headline: two lines in masks; words rise ~3 frames ahead of the VO word
      const hl = ctx.el('div', 'c04-hl', page);
      hl.style.top = '432px';
      const mkLine = (words, color) => {
        const ln = ctx.el('div', 'ln', hl);
        ln.style.color = color;
        return words.map((w, i) => { const s = ctx.el('span', 'w', ln, w); if (i < words.length - 1) ln.appendChild(document.createTextNode(' ')); return s; });
      };
      const L1 = mkLine(['Bring', 'friends.'], CH);
      const L2 = mkLine(['Or', 'join', 'a', 'team.'], AMD);
      [0.30, 0.52].forEach((t, i) => tl.fromTo(L1[i], { yPercent: 118 }, { yPercent: 0, duration: 0.75, ease: 'expo.out' }, t));
      [1.32, 1.48, 1.72, 1.90].forEach((t, i) => tl.fromTo(L2[i], { yPercent: 118 }, { yPercent: 0, duration: 0.75, ease: 'expo.out' }, t));
      tl.to(L1, { color: ch(0.26), duration: 0.4, ease: 'power2.out' }, 1.34);
      // exit as the Atlas row opens (3.5)
      tl.to([...L1, ...L2], { yPercent: -118, duration: 0.32, ease: 'power2.in', stagger: 0.025 }, 3.42);
      tl.to(eb, { opacity: 0, duration: 0.2, ease: 'none' }, 3.45);

      // ---- A: invite card ----------------------------------------------------------------
      const CARD = { x: 990, y: 262, w: 800, h: 560 };
      const inv = ctx.el('div', 'c04-card', page);
      Object.assign(inv.style, { left: CARD.x + 'px', top: CARD.y + 'px', width: CARD.w + 'px', height: CARD.h + 'px' });
      const invTitle = ctx.el('div', 'c04-abs', inv, 'Invite to your team');
      Object.assign(invTitle.style, { left: '48px', top: '48px', font: '680 42px/1 var(--display)', letterSpacing: '-0.035em', color: CH });
      const invX = ctx.el('div', 'c04-abs', inv, ICON.x);
      Object.assign(invX.style, { right: '44px', top: '48px', width: '38px', height: '38px', color: ch(0.42) });
      // team bar
      const tb = ctx.el('div', 'c04-abs', inv);
      Object.assign(tb.style, { left: '48px', top: '126px', width: '704px', height: '156px', borderRadius: '22px', background: ch(0.045) });
      const tbEm = ctx.el('div', 'c04-em', tb, '<i style="display:block;width:22px;height:22px;background:#efbd70;transform:rotate(45deg)"></i>');
      Object.assign(tbEm.style, { left: '26px', top: '42px', width: '72px', height: '72px', borderRadius: '20px', background: CH });
      const tbName = ctx.el('div', 'c04-abs', tb, 'Atlas');
      Object.assign(tbName.style, { left: '122px', top: '44px', font: '700 38px/1 var(--display)', letterSpacing: '-0.035em', color: CH });
      const tbMeta = ctx.el('div', 'c04-abs c04-mono', tb, 'TEAM · <span class="cnt">1/3</span>');
      Object.assign(tbMeta.style, { left: '124px', top: '96px', color: ch(0.5) });
      const tbCnt = tbMeta.querySelector('.cnt');
      const SLOT = 92, SLOTX = [704 - 26 - SLOT * 3 - 28, 704 - 26 - SLOT * 2 - 14, 704 - 26 - SLOT];
      const tbSlots = SLOTX.map((x, i) => {
        const s = ctx.el('div', 'c04-slot', tb, `<span style="width:30px;height:30px;display:block">${ICON.plus}</span>`);
        Object.assign(s.style, { left: x + 'px', top: '32px', width: SLOT + 'px', height: SLOT + 'px' });
        return s;
      });
      const tbJK = ctx.el('div', 'c04-av', tb, 'JK');
      Object.assign(tbJK.style, { left: SLOTX[0] + 'px', top: '32px', width: SLOT + 'px', height: SLOT + 'px', background: AM, color: CH, fontSize: '32px', boxShadow: `0 0 0 4px ${INK}` });
      // search field
      const sf = ctx.el('div', 'c04-abs', inv);
      Object.assign(sf.style, { left: '48px', top: '312px', width: '704px', height: '84px', borderRadius: '18px', boxSizing: 'border-box', border: `2px solid ${ch(0.14)}`, background: INK });
      const sfRing = ctx.el('div', 'c04-abs', sf);
      Object.assign(sfRing.style, { inset: '-6px', borderRadius: '23px', border: `3px solid ${AM}`, opacity: 0 });
      const sfMag = ctx.el('div', 'c04-abs', sf, ICON.mag);
      Object.assign(sfMag.style, { left: '24px', top: '24px', width: '34px', height: '34px', color: ch(0.55) });
      const sfPh = ctx.el('div', 'c04-abs', sf, 'Search friends');
      Object.assign(sfPh.style, { left: '76px', top: '24px', font: '500 32px/1 var(--display)', letterSpacing: '-0.02em', color: ch(0.34) });
      const sfQ = ctx.el('div', 'c04-abs', sf, '');
      Object.assign(sfQ.style, { left: '76px', top: '24px', font: '600 32px/1 var(--display)', letterSpacing: '-0.02em', color: CH, whiteSpace: 'pre' });
      const sfCaret = ctx.el('div', 'c04-abs', sf);
      Object.assign(sfCaret.style, { left: '78px', top: '20px', width: '3px', height: '42px', background: AMD, borderRadius: '2px' });
      // result row
      const res = ctx.el('div', 'c04-abs', inv);
      Object.assign(res.style, { left: '48px', top: '424px', width: '704px', height: '96px' });
      const resAv = ctx.el('div', 'c04-av', res, 'NC');
      Object.assign(resAv.style, { left: '4px', top: '14px', width: '68px', height: '68px', background: CH, color: INK, fontSize: '25px' });
      const resNm = ctx.el('div', 'c04-abs', res, 'Nora C.');
      Object.assign(resNm.style, { left: '96px', top: '18px', font: '680 32px/1 var(--display)', letterSpacing: '-0.03em', color: CH });
      const resSt = ctx.el('div', 'c04-abs c04-mono', res, '<i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#efbd70;margin-right:10px;vertical-align:1px"></i>ONLINE');
      Object.assign(resSt.style, { left: '97px', top: '60px', color: ch(0.5), fontSize: '16px' });
      const resBtn = ctx.el('div', 'c04-btn', res, 'Invite');
      Object.assign(resBtn.style, { right: '4px', top: '18px', width: '160px', height: '60px', background: CH, color: INK });
      const resDone = ctx.el('div', 'c04-btn', res, `<span class="c04-ico" style="width:26px;height:26px">${ICON.check}</span>Invited`);
      Object.assign(resDone.style, { right: '4px', top: '18px', width: '172px', height: '60px', background: AM, color: CH, opacity: 0 });
      // the flying NC (screen space inside the page)
      const fly = ctx.el('div', 'c04-av', page, 'NC');
      Object.assign(fly.style, { left: '0px', top: '0px', width: SLOT + 'px', height: SLOT + 'px', background: CH, color: INK, fontSize: '32px', boxShadow: `0 0 0 4px ${INK}`, opacity: 0 });

      // A timeline
      // the card springs up into place on the cut (frame 0 already shows it, low)
      tl.fromTo(inv, { y: 150, scale: 0.955, rotation: 1.2 }, { y: 0, scale: 1, rotation: 0, duration: 0.6, ease: SP_MOVE }, 0);
      tl.fromTo(sfRing, { opacity: 0 }, { opacity: 0.85, duration: 0.15, ease: 'none' }, 0.1);
      tl.fromTo(sfPh, { opacity: 1 }, { opacity: 0, duration: 0.04, ease: 'none', immediateRender: false }, 0.14);
      tl.fromTo(res, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.3, ease: SP_MOVE }, 0.33);
      tl.to(resBtn, { scale: 0.92, duration: 0.06, ease: 'power2.out' }, 0.5);
      tl.to(resBtn, { opacity: 0, duration: 0.06, ease: 'none' }, 0.54);
      tl.fromTo(resDone, { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.35, ease: SP_POP }, 0.54);
      tl.to(resAv, { opacity: 0.18, duration: 0.08, ease: 'none' }, 0.54);
      tl.to(sfRing, { opacity: 0, duration: 0.25, ease: 'none' }, 0.8);
      // card scrolls away (1.40-1.64)
      tl.to(inv, { y: -980, duration: 0.3, ease: 'power3.in' }, 1.38);

      const QUERY = 'Nora';
      const TYPE_AT = [0.15, 0.2, 0.25, 0.3];
      // slot geometry in page space (for the flight)
      const slotC = (i) => [CARD.x + 48 + SLOTX[i] + SLOT / 2, CARD.y + 126 + 32 + SLOT / 2];
      const resC = [CARD.x + 48 + 4 + 34, CARD.y + 424 + 14 + 34];
      const FLY0 = 0.54, FLY1 = 0.78;

      // ---- B: board of open teams --------------------------------------------------------
      const BOARD = { x: 990, y: 150, w: 800, h: 780 };
      const board = ctx.el('div', 'c04-card', page);
      Object.assign(board.style, { left: BOARD.x + 'px', top: BOARD.y + 'px', width: BOARD.w + 'px', height: BOARD.h + 'px', overflow: 'hidden' });
      const bdTitle = ctx.el('div', 'c04-abs', board, 'Join a team');
      Object.assign(bdTitle.style, { left: '48px', top: '46px', font: '680 42px/1 var(--display)', letterSpacing: '-0.035em', color: CH });
      const bdChip = ctx.el('div', 'c04-abs c04-mono', board, '<i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#efbd70;margin-right:12px;vertical-align:1px"></i>OPEN SLOTS');
      Object.assign(bdChip.style, { right: '44px', top: '42px', padding: '13px 18px', borderRadius: '999px', border: `2px solid ${ch(0.14)}`, color: ch(0.62), fontSize: '17px' });
      const bdRule = ctx.el('div', 'c04-abs', board);
      Object.assign(bdRule.style, { left: '0', right: '0', top: '122px', height: '1.5px', background: ch(0.08) });
      const VP = { top: 124, h: 656 };
      const vp = ctx.el('div', 'c04-abs', board);
      Object.assign(vp.style, { left: '28px', top: VP.top + 'px', width: '744px', height: VP.h + 'px', overflow: 'hidden' });
      const list = ctx.el('div', 'c04-abs', vp);
      Object.assign(list.style, { left: '0', top: '0', width: '744px', height: '2000px' });
      // vertical motion blur for the fast scroll (SVG filter on the list; stdDeviation set per frame)
      const fsv = ctx.svg('svg', { width: 0, height: 0, style: 'position:absolute;left:0;top:0' }, root);
      const fdefs = ctx.svg('defs', {}, fsv);
      const filt = ctx.svg('filter', { id: `${ID}-vblur`, x: '-5%', y: '-20%', width: '110%', height: '140%' }, fdefs);
      const fblur = ctx.svg('feGaussianBlur', { stdDeviation: '0 0' }, filt);

      const TEAMS = [
        ['Kestrel', 1, 'K', 0], ['Low Tide', 2, 'L', 1], ['Meridian', 1, 'M', 2], ['Northwind', 2, 'N', 0], ['Halcyon', 1, 'H', 1],
        ['Ironbark', 2, 'I', 2], ['Saltmarsh', 1, 'S', 0], ['Cobalt', 2, 'C', 1], ['Fenwick', 1, 'F', 2], ['Lantern', 2, 'L', 0],
        ['Driftwood', 1, 'D', 1], ['Atlas', 2, '', 3], ['Quarry', 1, 'Q', 2], ['Juniper', 2, 'J', 0], ['Harbour', 1, 'H', 1],
      ];
      const ATLAS_I = 11, ROW_H = 116;
      const EMS = [[CH, C.bone], [C.bone, CH], ['#d8d1c5', CH], [CH, AM]];
      const GEN = [CH, C.bone2, C.bone, '#7d756b'];
      const rr = ctx.rng('c04-board');
      const rows = TEAMS.map(([name, n, glyph, ev], i) => {
        const row = ctx.el('div', 'c04-row', list);
        row.style.top = (i * ROW_H) + 'px';
        const hi = ctx.el('div', 'c04-abs', row);
        Object.assign(hi.style, { left: '4px', right: '4px', top: '4px', bottom: '4px', borderRadius: '20px', background: 'rgba(239,189,112,.16)', border: `2.5px solid ${AM}`, opacity: 0 });
        ctx.el('div', 'hair', row);
        const em = ctx.el('div', 'c04-em', row, ev === 3 ? '<i style="display:block;width:20px;height:20px;background:#efbd70;transform:rotate(45deg)"></i>' : glyph);
        em.style.background = EMS[ev][0]; em.style.color = EMS[ev][1];
        const nm = ctx.el('div', 'c04-abs', row, name);
        Object.assign(nm.style, { left: '102px', top: '30px', font: '680 31px/1 var(--display)', letterSpacing: '-0.03em', color: CH });
        const sub = ctx.el('div', 'c04-abs c04-mono', row, `OPEN · ${3 - n} SLOT${3 - n > 1 ? 'S' : ''}`);
        Object.assign(sub.style, { left: '103px', top: '72px', color: ch(0.46), fontSize: '15px' });
        // members + open slots (44 px, overlapping)
        const AV = 46, GX = 36, AX = 344;
        const avs = [];
        for (let k = 0; k < 3; k++) {
          let a;
          if (k < n) {
            const isAtlas = ev === 3;
            const txt = isAtlas ? ['JK', 'NC'][k] : String.fromCharCode(65 + rr.int(0, 25)) + String.fromCharCode(65 + rr.int(0, 25));
            const bg = isAtlas ? [AM, CH][k] : GEN[(i + k) % GEN.length];
            const fg = bg === CH || bg === '#7d756b' || bg === C.bone2 ? INK : CH;
            a = ctx.el('div', 'c04-av', row, txt);
            Object.assign(a.style, { width: AV + 'px', height: AV + 'px', background: bg, color: fg, fontSize: '16px', boxShadow: `0 0 0 3px ${INK}` });
          } else {
            a = ctx.el('div', 'c04-slot', row, '');
            Object.assign(a.style, { width: AV + 'px', height: AV + 'px', borderWidth: '2px', background: INK });
          }
          a.style.left = (AX + k * GX) + 'px'; a.style.top = (58 - AV / 2) + 'px'; a.style.zIndex = String(3 - k);
          avs.push(a);
        }
        const cnt = ctx.el('div', 'c04-abs', row, `${n}/3`);
        Object.assign(cnt.style, { left: '486px', top: '45px', font: '600 25px/1 var(--mono)', letterSpacing: '.04em', color: ch(0.7) });
        const join = ctx.el('div', 'c04-btn', row, 'Join');
        Object.assign(join.style, { right: '20px', top: '30px', width: '118px', height: '56px', background: CH, color: INK, fontSize: '24px' });
        return { row, hi, avs, cnt, join, nm };
      });
      const AT = rows[ATLAS_I];
      const atSub = AT.row.querySelector('.c04-mono');
      const ek = ctx.el('div', 'c04-av', AT.row, 'EK');
      Object.assign(ek.style, { width: '46px', height: '46px', left: (344 + 72) + 'px', top: '35px', background: AMD, color: INK, fontSize: '16px', boxShadow: `0 0 0 3px ${INK}`, zIndex: 1 });
      const ready = ctx.el('div', 'c04-btn', AT.row, `<span class="c04-ico" style="width:24px;height:24px">${ICON.check}</span><span style="font:700 21px/1 var(--mono);letter-spacing:.1em">3/3 · READY</span>`);
      Object.assign(ready.style, { right: '20px', top: '30px', width: '236px', height: '56px', background: AM, color: CH, transformOrigin: '100% 50%' });
      const readyRing = ctx.el('div', 'c04-abs', AT.row);
      Object.assign(readyRing.style, { right: '20px', top: '30px', width: '236px', height: '56px', borderRadius: '999px', border: `3px solid ${AM}`, boxSizing: 'border-box', opacity: 0 });

      // list scroll: a fast stream that settles with Atlas centred in the viewport
      const OFF0 = 120, OFF1 = -(ATLAS_I * ROW_H - (VP.h - ROW_H) / 2);
      const SC0 = 1.46, SCD = 1.1;
      const scrollY = (t) => lerp(OFF0, OFF1, o4(seg(t, SC0, SCD)));
      // the board arrives from below as the card leaves (one continuous scroll)
      tl.fromTo(board, { y: 980 }, { y: 0, duration: 0.5, ease: 'expo.out' }, 1.44);
      tl.fromTo(AT.hi, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.4, ease: SP_POP }, 2.5);
      rows.forEach((r, i) => { if (i !== ATLAS_I) tl.to(r.row, { opacity: 0.38, duration: 0.4, ease: 'power2.out' }, 2.6); });
      tl.to(AT.join, { scale: 0.9, duration: 0.06, ease: 'power2.out' }, 2.76);
      tl.fromTo(ek, { scale: 0 }, { scale: 1, duration: 0.42, ease: SP_POP }, 2.84);
      tl.to(AT.avs[2], { opacity: 0, duration: 0.05, ease: 'none' }, 2.84);
      tl.to([AT.join, AT.cnt], { opacity: 0, duration: 0.06, ease: 'none' }, 2.98);
      tl.fromTo(ready, { opacity: 0, scaleX: 0.5, scaleY: 0.9 }, { opacity: 1, scaleX: 1, scaleY: 1, duration: 0.45, ease: SP_POP }, 2.98);
      const RINGS = [{ el: readyRing, at: 3.0, dur: 0.5, s0: 1, s1: 1.3, a0: 0.9 }];

      // =========================================================================================
      // T + C: the Atlas row opens into the shared canvas
      // =========================================================================================
      const rowScreen = { x: BOARD.x + 28, y: BOARD.y + VP.top + (VP.h - ROW_H) / 2, w: 744, h: ROW_H };
      // the sheet: a rounded window that grows from the Atlas row to full frame; its content (wsIn) stays
      // screen-fixed while the title bar rides the sheet's top edge (the row becomes the window's title bar)
      const sheet = ctx.el('div', 'c04-ws', root);
      const wsIn = ctx.el('div', 'c04-abs', sheet);
      Object.assign(wsIn.style, { left: '0', top: '0', width: W + 'px', height: H + 'px' });
      const T0 = 3.5, T1 = 3.98;
      const R0 = { x: rowScreen.x + 4, y: rowScreen.y + 4, w: rowScreen.w - 8, h: rowScreen.h - 8 };
      const expoIO = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2);
      tl.fromTo(sheet, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'none' }, T0);
      tl.to(page, { scale: 0.93, duration: T1 - T0, ease: 'expo.inOut' }, T0);
      const ws = wsIn;
      const cam = ctx.el('div', 'c04-cam', ws);
      // dot grid (static, drawn once)
      {
        const { g } = ctx.canvas({ parent: cam });
        g.fillStyle = ch(0.15);
        for (let y = 20; y < H + 40; y += 40) for (let x = 20; x < W + 40; x += 40) { g.beginPath(); g.arc(x, y, 1.9, 0, Math.PI * 2); g.fill(); }
      }
      // sketch layer (canvas space)
      const sk = ctx.svg('svg', { class: 'brand-svg' }, cam);
      // lanes (the plan)
      const LX = [236, 736, 1236], LY = 146, LW = 448, LH = 650;
      const TASKS = [['Call the timing', 'Track their route'], ['Restore the grid', 'Guard the plant'], ['Watch the river', 'Signal on contact']];
      const lanes = PEOPLE.map((p, i) => {
        const ln = ctx.el('div', 'c04-lane', cam);
        ln.style.left = LX[i] + 'px';
        const av = ctx.el('div', 'c04-av', ln, p.ini);
        Object.assign(av.style, { left: '30px', top: '28px', width: '56px', height: '56px', background: p.col, color: p.fg, fontSize: '20px' });
        const nm = ctx.el('div', 'c04-abs', ln, p.name);
        Object.assign(nm.style, { left: '104px', top: '33px', font: '700 32px/1 var(--display)', letterSpacing: '-0.03em', color: CH });
        const tag = ctx.el('div', 'c04-abs c04-mono', ln, `LANE 0${i + 1}`);
        Object.assign(tag.style, { right: '30px', top: '42px', color: ch(0.42), fontSize: '15px' });
        const slot = ctx.el('div', 'c04-abs', ln);
        Object.assign(slot.style, { left: '30px', top: '102px', width: '384px', height: '164px', borderRadius: '16px', border: `2.5px dashed ${ch(0.16)}`, boxSizing: 'border-box' });
        const tasks = TASKS[i].map((txt, k) => {
          const tk = ctx.el('div', 'c04-task', ln, `<span class="bx"></span><span>${txt}</span>`);
          tk.style.top = (306 + k * 58) + 'px';
          return tk;
        });
        const ghost = ctx.el('div', 'c04-task', ln, `<span class="c04-ico" style="width:22px;height:22px;color:${ch(0.3)}">${ICON.plus}</span><span style="color:${ch(0.3)};font-weight:550">Add a step</span>`);
        ghost.style.top = (306 + 2 * 58) + 'px';
        const agreeDot = ctx.el('div', 'c04-abs', ln);
        Object.assign(agreeDot.style, { left: '30px', bottom: '34px', width: '64px', height: '64px', borderRadius: '50%', boxSizing: 'border-box', border: `2.5px dashed ${ch(0.3)}` });
        const agreeFill = ctx.el('div', 'c04-abs', ln, `<span style="display:block;width:36px;height:36px;margin:14px">${ICON.check}</span>`);
        Object.assign(agreeFill.style, { left: '30px', bottom: '34px', width: '64px', height: '64px', borderRadius: '50%', background: AM, color: CH });
        const agreeRing = ctx.el('div', 'c04-abs', ln);
        Object.assign(agreeRing.style, { left: '30px', bottom: '34px', width: '64px', height: '64px', borderRadius: '50%', border: `3px solid ${AM}`, boxSizing: 'border-box', opacity: 0 });
        const agreeTx = ctx.el('div', 'c04-abs', ln, 'Agree');
        Object.assign(agreeTx.style, { left: '114px', bottom: '54px', font: '650 27px/1 var(--display)', letterSpacing: '-0.02em', color: ch(0.42) });
        const agreeTx2 = ctx.el('div', 'c04-abs', ln, 'Agreed');
        Object.assign(agreeTx2.style, { left: '114px', bottom: '54px', font: '700 27px/1 var(--display)', letterSpacing: '-0.02em', color: CH, opacity: 0 });
        const border = ctx.el('div', 'c04-abs', ln);
        Object.assign(border.style, { inset: '-2px', borderRadius: '28px', border: `3px solid ${AM}`, opacity: 0 });
        return { ln, tasks, agreeFill, agreeRing, agreeTx, agreeTx2, border, slot, ghost };
      });
      const LANE_AT = [5.94, 6.0, 6.06];
      lanes.forEach((L, i) => {
        tl.fromTo(L.ln, { opacity: 0, scale: 0.94, y: 26 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: SP_MOVE }, LANE_AT[i]);
        L.tasks.forEach((tk, k) => {
          const at = [6.48, 6.6, 6.72][i] + k * 0.38;
          tl.fromTo(tk, { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: 0.35, ease: SP_MOVE }, at);
        });
        tl.fromTo(L.ghost, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' }, [6.48, 6.6, 6.72][i] + 0.8);
      });
      const CHECK_AT = [8.0, 8.25, 8.5];
      lanes.forEach((L, i) => {
        const at = CHECK_AT[i];
        tl.fromTo(L.agreeFill, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.42, ease: SP_POP }, at + 0.02);
        tl.fromTo(L.agreeFill.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.2, ease: 'power2.out' }, at + 0.06);
        RINGS.push({ el: L.agreeRing, at: at + 0.02, dur: 0.45, s0: 1, s1: 1.9, a0: 0.95 });
        tl.to(L.agreeTx, { opacity: 0, duration: 0.05, ease: 'none' }, at + 0.02);
        tl.fromTo(L.agreeTx2, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: SP_MOVE }, at + 0.02);
        tl.fromTo(L.border, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'none' }, at + 0.02);
        L.tasks.forEach((tk) => { const bx = tk.querySelector('.bx'); tl.to(bx, { background: AM, borderColor: AM, duration: 0.15, ease: 'none' }, at + 0.1); });
      });

      // notes: positioned at their lane slot; transform carries the scattered offset + drop pop + drag
      const NOTE_TX = ['Scout north', 'Power first', 'Hold the bridge'];
      const NOTE_HOME = PEOPLE.map((p, i) => [LX[i] + 2 + 30, LY + 2 + 102]);
      const NOTE_SCAT = [[300, 228], [1262, 206], [1300, 668]];   // top-left in the scattered state
      const NOTE_ROT = [-4, 3.2, -2.2];
      const NOTE_DROP = [4.6, 5.08, 5.26];
      const NOTE_GRAB = [326, 22];                                   // click / grab point inside a note
      const NOTE_DRAG = [6.0, 6.07, 6.14], DRAG_D = 0.5;
      const notes = PEOPLE.map((p, i) => {
        const n = ctx.el('div', 'c04-note', cam, `<div class="by">${p.name}</div><div class="tx">${NOTE_TX[i]}</div>`);
        Object.assign(n.style, { left: NOTE_HOME[i][0] + 'px', top: NOTE_HOME[i][1] + 'px', background: p.col, color: p.fg, transformOrigin: `${NOTE_GRAB[0]}px ${NOTE_GRAB[1]}px`, visibility: 'hidden' });
        return n;
      });
      // note top-left in canvas space at time t (pure)
      function noteState(i, t) {
        const u = seg(t, NOTE_DRAG[i], DRAG_D), e = SP_MOVE(u);
        const x = lerp(NOTE_SCAT[i][0], NOTE_HOME[i][0], e), y = lerp(NOTE_SCAT[i][1], NOTE_HOME[i][1], e);
        const pu = seg(t, NOTE_DROP[i], 0.45);
        let sc = lerp(0.25, 1, SP_POP(pu));
        const lift = Math.sin(Math.PI * clamp(u * 1.4, 0, 1));         // picked up, carried, put down
        sc *= 1 + 0.045 * lift;
        const rot = lerp(NOTE_ROT[i], 0, o3(clamp(u * 1.3, 0, 1)));
        return { x, y, sc, rot, vis: t >= NOTE_DROP[i], lift };
      }

      // sketches (canvas space): Emre's river + bridge, Jules' north arrow, Nora's power bolt
      const RIVER = 'M210 600 C 380 520, 520 680, 740 622 S 1010 520, 1190 590 S 1430 664, 1700 560';
      const strokeDefs = [
        { who: 2, d: RIVER, t0: 4.42, t1: 4.98, w: 7 },
        { who: 2, d: null, t0: 5.02, t1: 5.08, w: 7, bridge: 0 },
        { who: 2, d: null, t0: 5.1, t1: 5.16, w: 7, bridge: 1 },
        { who: 0, d: 'M760 470 C 754 400, 758 330, 762 262', t0: 4.8, t1: 5.08, w: 6.5 },
        { who: 0, d: 'M728 300 L762 258 L798 298', t0: 5.13, t1: 5.3, w: 6.5 },
        { who: 1, d: 'M1196 232 L1150 330 L1206 330 L1160 436', t0: 5.32, t1: 5.62, w: 6.5 },
      ];
      const riverEl = ctx.svg('path', { d: RIVER, fill: 'none', stroke: 'none' }, sk);
      const riverL = riverEl.getTotalLength();
      // the bridge: two ticks across the river around x 1480
      let bridgeAt = 0;
      { let best = 1e9; for (let s = 0; s <= riverL; s += 2) { const p = riverEl.getPointAtLength(s); if (Math.abs(p.x - 1478) < best) { best = Math.abs(p.x - 1478); bridgeAt = s; } } }
      const BR = [-26, 26].map((ds) => {
        const p = riverEl.getPointAtLength(bridgeAt + ds), q = riverEl.getPointAtLength(bridgeAt + ds + 2);
        const tx = q.x - p.x, ty = q.y - p.y, L = Math.hypot(tx, ty) || 1, nx = -ty / L, ny = tx / L;
        return `M${(p.x - nx * 44).toFixed(1)} ${(p.y - ny * 44).toFixed(1)} L${(p.x + nx * 44).toFixed(1)} ${(p.y + ny * 44).toFixed(1)}`;
      });
      const strokes = strokeDefs.map((s) => {
        const d = s.d || BR[s.bridge];
        const el = ctx.svg('path', { d, fill: 'none', stroke: PEOPLE[s.who].col, 'stroke-width': s.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sk);
        const L = el.getTotalLength();
        return Object.assign({}, s, { el, L, d });
      });
      const strokeU = (s, t) => io3(seg(t, s.t0, s.t1 - s.t0)) * 0.85 + seg(t, s.t0, s.t1 - s.t0) * 0.15;
      const strokePt = (s, u) => { const p = s.el.getPointAtLength(s.L * u); return [p.x, p.y]; };
      tl.to(sk, { opacity: 0, duration: 0.22, ease: 'power1.in' }, 5.92);

      // AGREED badge
      const badge = ctx.el('div', 'c04-abs', cam);
      Object.assign(badge.style, { left: '960px', top: '944px', height: '104px', display: 'flex', alignItems: 'center', gap: '22px', padding: '0 40px 0 22px', borderRadius: '999px', background: CH, color: INK, boxShadow: '0 30px 60px -26px rgba(15,13,10,.6)', whiteSpace: 'nowrap' });
      badge.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;width:66px;height:66px;border-radius:50%;background:${AM};color:${CH}"><span style="display:block;width:40px;height:40px">${ICON.check}</span></span>`
        + `<span style="font:700 46px/1 var(--mono);letter-spacing:.2em">AGREED</span>`
        + `<span style="display:flex;margin-left:8px">${PEOPLE.map((p, i) => `<span style="width:46px;height:46px;border-radius:50%;background:${p.col};color:${p.fg};font:750 16px/46px var(--display);text-align:center;box-shadow:0 0 0 3px ${CH};margin-left:${i ? -6 : 0}px">${p.ini}</span>`).join('')}</span>`;
      const badgeIn = badge.firstChild;
      tl.fromTo(badge, { scale: 0.4, opacity: 0, xPercent: -50, yPercent: -50 }, { scale: 1, opacity: 1, xPercent: -50, yPercent: -50, duration: 0.55, ease: SP_POP }, 9.0);
      tl.fromTo(badgeIn.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.22, ease: 'power2.out' }, 9.08);
      const burst = ctx.el('div', 'c04-abs', cam);
      Object.assign(burst.style, { left: '960px', top: '944px', width: '520px', height: '104px', marginLeft: '-260px', marginTop: '-52px', borderRadius: '999px', border: `4px solid ${AM}`, boxSizing: 'border-box', opacity: 0 });
      RINGS.push({ el: burst, at: 9.04, dur: 0.6, s0: 0.92, s1: 1.4, a0: 0.9 });

      // camera: settle from a slight push to 1.0 as the plan forms, then a slow push into AGREED
      const camP = { s: 1.06, y: 0 };
      tl.fromTo(camP, { s: 1.06 }, { s: 1.0, duration: 2.4, ease: 'power2.inOut' }, 4.0);
      tl.to(camP, { s: 1.035, y: -10, duration: 1.0, ease: 'power2.out' }, 9.0);

      // ---- chrome (fixed UI) ----
      const bar = ctx.el('div', 'c04-abs', sheet);
      Object.assign(bar.style, { left: '0', top: '0', width: '100%', height: '96px', background: INK, borderBottom: `1.5px solid ${ch(0.09)}` });
      const barEm = ctx.el('div', 'c04-em', bar, '<i style="display:block;width:17px;height:17px;background:#efbd70;transform:rotate(45deg)"></i>');
      Object.assign(barEm.style, { left: '40px', top: '22px', width: '52px', height: '52px', borderRadius: '14px', background: CH });
      const barT = ctx.el('div', 'c04-abs', bar, `Atlas<span class="sub"><span style="color:${ch(0.3)};margin:0 14px">/</span><span style="color:${ch(0.55)};font-weight:550">Opening plan</span></span>`);
      Object.assign(barT.style, { left: '112px', top: '31px', font: '700 32px/1 var(--display)', letterSpacing: '-0.03em', color: CH, whiteSpace: 'pre' });
      const live = ctx.el('div', 'c04-abs c04-mono', bar, '<i class="dot" style="display:inline-block;width:11px;height:11px;border-radius:50%;background:#efbd70;margin-right:12px;vertical-align:1px"></i>LIVE');
      Object.assign(live.style, { right: '420px', top: '37px', color: ch(0.6), fontSize: '17px' });
      const liveDot = live.querySelector('.dot');
      const barAvs = PEOPLE.map((p, i) => {
        const a = ctx.el('div', 'c04-av', bar, p.ini);
        Object.assign(a.style, { right: (196 + (2 - i) * 42) + 'px', top: '22px', width: '52px', height: '52px', background: p.col, color: p.fg, fontSize: '18px', boxShadow: `0 0 0 3.5px ${INK}`, zIndex: 3 - i });
        return a;
      });
      const shareBtn = ctx.el('div', 'c04-btn', bar, `<span class="c04-ico" style="width:24px;height:24px">${ICON.share}</span>Share`);
      Object.assign(shareBtn.style, { right: '40px', top: '22px', width: '136px', height: '52px', background: CH, color: INK, fontSize: '23px' });
      // toolbar
      const tbx = ctx.el('div', 'c04-abs', ws);
      Object.assign(tbx.style, { left: '36px', top: '348px', width: '76px', height: '384px', borderRadius: '24px', background: INK, boxShadow: '0 20px 44px -24px rgba(15,13,10,.45), 0 0 0 1.5px rgba(15,13,10,.07)' });
      ['ptr', 'note', 'pen', 'rect', 'text'].forEach((k, i) => {
        const b = ctx.el('div', 'c04-abs', tbx, ICON[k]);
        Object.assign(b.style, { left: '14px', top: (14 + i * 72) + 'px', width: '48px', height: '48px', padding: '10px', boxSizing: 'border-box', borderRadius: '14px', color: i === 0 ? CH : ch(0.55), background: i === 0 ? 'rgba(239,189,112,.5)' : 'transparent' });
      });
      // zoom readout
      const zoom = ctx.el('div', 'c04-abs c04-mono', ws, '100%');
      Object.assign(zoom.style, { right: '40px', bottom: '40px', padding: '14px 18px', borderRadius: '14px', background: INK, color: ch(0.62), fontSize: '18px', boxShadow: '0 0 0 1.5px rgba(15,13,10,.08)' });
      // chrome slides in after the container transform
      tl.fromTo(tbx, { x: -140 }, { x: 0, duration: 0.5, ease: SP_MOVE }, 3.86);
      tl.fromTo(zoom, { y: 90 }, { y: 0, duration: 0.5, ease: SP_MOVE }, 3.92);
      tl.fromTo(liveDot, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, 3.95);
      tl.fromTo(live, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 3.88);
      tl.fromTo(barT.querySelector('.sub'), { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none' }, 3.7);

      // =========================================================================================
      // Cursors
      // =========================================================================================
      const curLayer = ctx.el('div', 'c04-abs', root);
      Object.assign(curLayer.style, { left: '0', top: '0', width: W + 'px', height: H + 'px', pointerEvents: 'none' });
      function mkCursor(col, fg, name) {
        const c = ctx.el('div', 'c04-cur', curLayer);
        const sv = ctx.svg('svg', { viewBox: '-4 -4 40 52', width: 52, height: 68, style: 'position:absolute;left:-5px;top:-5px;overflow:visible' }, c);
        ctx.svg('path', { d: ARROW, fill: col, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round', transform: 'scale(1.0)' }, sv);
        let flag = null;
        if (name) { flag = ctx.el('div', 'c04-flag', c, name); Object.assign(flag.style, { background: col, color: fg, transformOrigin: '0% 0%' }); }
        const ring = ctx.el('div', 'c04-abs', curLayer);
        Object.assign(ring.style, { left: '0', top: '0', width: '80px', height: '80px', marginLeft: '-40px', marginTop: '-40px', borderRadius: '50%', border: `3px solid ${col === CH ? CH : col}`, boxSizing: 'border-box', opacity: 0 });
        return { c, flag, ring, sv };
      }
      // segment tracks: [{t0,t1,to,ease,bow} | {t0,t1,path:(u)->[x,y]} | {t0,t1,follow:(t)->[x,y]}]
      function track(start, segs) {
        return (t) => {
          let p = start;
          for (const s of segs) {
            if (t < s.t0) return p;
            const u = clamp((t - s.t0) / (s.t1 - s.t0), 0, 1);
            let q;
            if (s.follow) q = s.follow(Math.min(t, s.t1));
            else if (s.path) q = s.path(u);
            else {
              const e = (s.ease || INTENT)(u);
              const [ax, ay] = p, [bx, by] = s.to;
              let x = lerp(ax, bx, e), y = lerp(ay, by, e);
              if (s.bow) { const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, k = s.bow * Math.sin(Math.PI * clamp(e, 0, 1)) * L; x += -dy / L * k; y += dx / L * k; }
              q = [x, y];
            }
            if (t <= s.t1) return q;
            p = s.follow ? s.follow(s.t1) : s.path ? s.path(1) : s.to;
          }
          return p;
        };
      }
      const nz = ctx.noise2D('c04-cursors');
      const wob = (k, t, a) => [nz(k * 17.3, t * 0.9) * a, nz(k * 17.3 + 50, t * 0.9) * a];

      // the viewer's own pointer in A/B (screen space, no flag)
      const you = mkCursor(CH, INK, null);
      const joinC = [BOARD.x + 28 + 744 - 20 - 59, rowScreen.y + 58];
      const btnC = [CARD.x + 48 + 704 - 4 - 80, CARD.y + 424 + 48];
      const youPos = track([1540, 1150], [
        { t0: 0.04, t1: 0.46, to: [btnC[0] + 6, btnC[1] + 4], bow: 0.1 },
        { t0: 0.62, t1: 1.3, to: [btnC[0] - 60, btnC[1] + 110], ease: io3 },
        { t0: 1.36, t1: 1.7, to: [1610, 930], ease: io3 },
        { t0: 2.32, t1: 2.72, to: [joinC[0] + 8, joinC[1] + 6], bow: -0.12 },
        { t0: 2.92, t1: 3.45, to: [joinC[0] + 150, joinC[1] + 170], ease: io3 },
      ]);
      const YOU_CLICKS = [0.5, 2.76];

      // named cursors in the canvas (canvas space; mapped through the camera)
      const curs = PEOPLE.map((p) => mkCursor(p.col, p.fg, p.name));
      const grab = (i) => (t) => { const s = noteState(i, t); return [s.x + NOTE_GRAB[0], s.y + NOTE_GRAB[1]]; };
      const SK = (k) => (u) => strokePt(strokes[k], strokeU(strokes[k], strokes[k].t0 + u * (strokes[k].t1 - strokes[k].t0)));
      const taskEnd = (i, k) => [LX[i] + 2 + 32 + 40 + [[200, 230], [222, 210], [208, 232]][i][k], LY + 2 + 306 + k * 58 + 20];
      const agreeC = (i) => [LX[i] + 2 + 30 + 32 + 6, LY + 2 + LH - 34 - 32 + 4];
      const tracks = [
        // Jules: from the top-left, drops 'Scout north' (4.6), draws the north arrow, drags his note into lane 1
        track([-90, -60], [
          { t0: 3.86, t1: 4.5, to: [NOTE_SCAT[0][0] + NOTE_GRAB[0], NOTE_SCAT[0][1] + NOTE_GRAB[1]], bow: 0.08 },
          { t0: 4.66, t1: 4.8, to: SK(3)(0), ease: io3 },
          { t0: 4.8, t1: 5.08, path: SK(3) },
          { t0: 5.08, t1: 5.13, to: SK(4)(0), ease: io3 },
          { t0: 5.13, t1: 5.3, path: SK(4) },
          { t0: 5.42, t1: 5.94, to: grab(0)(5.94), bow: 0.1 },
          { t0: 6.0, t1: 6.0 + DRAG_D, follow: grab(0) },
          { t0: 6.5, t1: 6.72, to: taskEnd(0, 0), ease: io3 },
          { t0: 6.88, t1: 7.08, to: taskEnd(0, 1), ease: io3 },
          { t0: 7.5, t1: 7.94, to: agreeC(0), bow: -0.08 },
          { t0: 8.12, t1: 8.9, to: [agreeC(0)[0] + 150, agreeC(0)[1] + 120], ease: io3 },
        ]),
        // Nora: from the top-right, drops 'Power first' (5.08), draws the bolt
        track([2010, -70], [
          { t0: 4.2, t1: 4.98, to: [NOTE_SCAT[1][0] + NOTE_GRAB[0], NOTE_SCAT[1][1] + NOTE_GRAB[1]], bow: -0.08 },
          { t0: 5.14, t1: 5.3, to: SK(5)(0), ease: io3 },
          { t0: 5.32, t1: 5.62, path: SK(5) },
          { t0: 5.66, t1: 6.02, to: grab(1)(6.02), bow: 0.1 },
          { t0: 6.07, t1: 6.07 + DRAG_D, follow: grab(1) },
          { t0: 6.62, t1: 6.84, to: taskEnd(1, 0), ease: io3 },
          { t0: 7.0, t1: 7.2, to: taskEnd(1, 1), ease: io3 },
          { t0: 7.66, t1: 8.18, to: agreeC(1), bow: 0.08 },
          { t0: 8.36, t1: 9.1, to: [agreeC(1)[0] + 300, agreeC(1)[1] - 120], ease: io3 },
        ]),
        // Emre: from the bottom-left, draws the river + the bridge, drops 'Hold the bridge' (5.26)
        track([-90, 1160], [
          { t0: 3.8, t1: 4.36, to: SK(0)(0), bow: -0.06 },
          { t0: 4.42, t1: 4.98, path: SK(0) },
          { t0: 4.98, t1: 5.02, to: SK(1)(0), ease: io3 },
          { t0: 5.02, t1: 5.08, path: SK(1) },
          { t0: 5.08, t1: 5.1, to: SK(2)(0), ease: io3 },
          { t0: 5.1, t1: 5.16, path: SK(2) },
          { t0: 5.16, t1: 5.24, to: [NOTE_SCAT[2][0] + NOTE_GRAB[0], NOTE_SCAT[2][1] + NOTE_GRAB[1]], ease: io3 },
          { t0: 5.5, t1: 6.06, to: grab(2)(6.1), ease: io3 },
          { t0: 6.14, t1: 6.14 + DRAG_D, follow: grab(2) },
          { t0: 6.74, t1: 6.96, to: taskEnd(2, 0), ease: io3 },
          { t0: 7.12, t1: 7.32, to: taskEnd(2, 1), ease: io3 },
          { t0: 7.84, t1: 8.42, to: agreeC(2), bow: -0.08 },
          { t0: 8.6, t1: 9.3, to: [agreeC(2)[0] + 250, agreeC(2)[1] + 150], ease: io3 },
        ]),
      ];
      const CLICKS = [[4.6, 8.0], [5.08, 8.25], [5.26, 8.5]];
      const DRAWS = [[[4.8, 5.08], [5.13, 5.3]], [[5.32, 5.62]], [[4.42, 4.98], [5.02, 5.08], [5.1, 5.16]]];
      const DRAGS = [[6.0, 6.5], [6.07, 6.57], [6.14, 6.64]];
      const ENTER = [3.86, 4.2, 3.8];

      const pressAt = (clicks, t) => { let p = 0; for (const c of clicks) { const d = t - c; if (d >= -0.04 && d < 0.12) p = Math.max(p, 1 - Math.abs(d - 0.02) / 0.1); } return clamp(p, 0, 1); };
      const ringAt = (clicks, t) => { for (let k = clicks.length - 1; k >= 0; k--) { const d = t - clicks[k]; if (d >= 0 && d < 0.4) return d / 0.4; } return -1; };
      function placeCursor(cu, x, y, press, rngU, show, flagK) {
        cu.c.style.display = show ? '' : 'none';
        if (!show) { cu.ring.style.opacity = 0; return; }
        const sc = 1 - 0.14 * press;
        cu.c.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${sc.toFixed(3)})`;
        if (cu.flag) cu.flag.style.transform = `scale(${flagK.toFixed(3)})`;
        if (rngU >= 0) {
          const r = o3(rngU);
          cu.ring.style.opacity = (0.85 * (1 - rngU)).toFixed(3);
          cu.ring.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${(0.2 + 0.9 * r).toFixed(3)})`;
        } else cu.ring.style.opacity = 0;
      }
      const camMap = (x, y) => [960 + (x - 960) * camP.s, 540 + (y - 540) * camP.s + camP.y];

      // =========================================================================================
      // per frame
      // =========================================================================================
      ctx.onFrame((t) => {
        // ---- A: typing + caret ----
        const nch = TYPE_AT.filter((a) => t >= a).length;
        const q = QUERY.slice(0, nch);
        if (sfQ.textContent !== q) sfQ.textContent = q;
        const qW = nch ? sfQ.offsetWidth : 0;
        sfCaret.style.left = (77 + qW) + 'px';
        sfCaret.style.opacity = t >= 0.1 && t < 0.9 && (t < 0.36 || Math.floor((t - 0.36) / 0.27) % 2 === 0) ? 1 : 0;
        // NC flight: arc from the result avatar to slot 2, then a pop in place
        const fu = seg(t, FLY0, FLY1 - FLY0);
        if (t >= FLY0) {
          const [ax, ay] = resC, [bx, by] = slotC(1);
          const e = io3(fu);
          const x = lerp(ax, bx, e), y = lerp(ay, by, e) - Math.sin(Math.PI * e) * 120;
          const land = SP_POP(seg(t, FLY1, 0.4));
          const sc = fu < 1 ? lerp(68 / SLOT, 1.08, e) : lerp(1.08, 1, land) + 0.0;
          const invY = gsap.getProperty(inv, 'y');
          fly.style.opacity = 1;
          fly.style.transform = `translate(${(x - SLOT / 2).toFixed(2)}px, ${(y - SLOT / 2 + invY).toFixed(2)}px) scale(${sc.toFixed(3)})`;
          fly.style.boxShadow = fu < 1 ? `0 ${(22 * Math.sin(Math.PI * e)).toFixed(1)}px ${(40 * Math.sin(Math.PI * e)).toFixed(1)}px -16px rgba(15,13,10,.5), 0 0 0 4px ${INK}` : `0 0 0 4px ${INK}`;
        } else fly.style.opacity = 0;
        const cntTxt = t >= FLY1 ? '2/3' : '1/3';
        if (tbCnt.textContent !== cntTxt) tbCnt.textContent = cntTxt;
        tbSlots[1].style.opacity = t >= FLY1 ? 0 : 1;

        // ---- B: board scroll + motion blur ----
        { const st = t >= 2.98 ? 'TEAM FULL' : 'OPEN · 1 SLOT'; if (atSub.textContent !== st) atSub.textContent = st; }
        const sy = scrollY(t);
        list.style.transform = `translateY(${sy.toFixed(2)}px)`;
        const v = Math.abs(scrollY(t + 1 / 60) - scrollY(t - 1 / 60));        // px per frame
        const blur = clamp(v * 0.2, 0, 12);
        if (blur > 0.4 && t > SC0 && t < SC0 + SCD) { fblur.setAttribute('stdDeviation', `0 ${blur.toFixed(2)}`); list.style.filter = `url(#${ID}-vblur)`; }
        else list.style.filter = 'none';

        // ---- T: the sheet ----
        if (t < T0) sheet.style.display = 'none';
        else {
          sheet.style.display = '';
          const u = expoIO(seg(t, T0, T1 - T0));
          const x = lerp(R0.x, 0, u), y = lerp(R0.y, 0, u), w = lerp(R0.w, W, u), h = lerp(R0.h, H, u);
          Object.assign(sheet.style, { left: x.toFixed(2) + 'px', top: y.toFixed(2) + 'px', width: w.toFixed(2) + 'px', height: h.toFixed(2) + 'px',
            borderRadius: (22 * Math.sqrt(1 - u)).toFixed(2) + 'px', boxShadow: u < 1 ? `0 40px 90px -30px rgba(15,13,10,${(0.4 * (1 - u * u)).toFixed(3)}), 0 0 0 ${(2.5 * (1 - u)).toFixed(2)}px ${AM}` : 'none' });
          wsIn.style.left = (-x).toFixed(2) + 'px'; wsIn.style.top = (-y).toFixed(2) + 'px';
        }
        // ---- ring bursts ----
        RINGS.forEach((r) => {
          const u = (t - r.at) / r.dur;
          if (u < 0 || u >= 1) { r.el.style.opacity = 0; return; }
          r.el.style.opacity = (r.a0 * (1 - u)).toFixed(3);
          r.el.style.transform = `scale(${lerp(r.s0, r.s1, o3(u)).toFixed(4)})`;
        });
        // ---- C: camera ----
        cam.style.transform = `translateY(${camP.y.toFixed(2)}px) scale(${camP.s.toFixed(4)})`;
        const zt = `${Math.round(camP.s * 100)}%`;
        if (zoom.textContent !== zt) zoom.textContent = zt;
        liveDot.style.opacity = t < 4 ? 1 : (0.55 + 0.45 * Math.cos((t - 4) * Math.PI * 2 / 1.0)).toFixed(3);

        // ---- notes ----
        notes.forEach((n, i) => {
          const s = noteState(i, t);
          n.style.visibility = s.vis ? 'visible' : 'hidden';
          if (!s.vis) return;
          n.style.transform = `translate(${(s.x - NOTE_HOME[i][0]).toFixed(2)}px, ${(s.y - NOTE_HOME[i][1]).toFixed(2)}px) rotate(${s.rot.toFixed(2)}deg) scale(${s.sc.toFixed(4)})`;
          n.style.zIndex = s.lift > 0.02 ? 5 : 2;
          n.style.boxShadow = `0 ${(22 + 26 * s.lift).toFixed(1)}px ${(40 + 30 * s.lift).toFixed(1)}px -22px rgba(15,13,10,${(0.45 + 0.1 * s.lift).toFixed(2)}), 0 3px 8px -4px rgba(15,13,10,.25)`;
        });

        // ---- sketches ----
        strokes.forEach((s) => {
          const u = strokeU(s, t);
          s.el.style.strokeDasharray = `${s.L.toFixed(1)} ${(s.L + 10).toFixed(1)}`;
          s.el.style.strokeDashoffset = (s.L * (1 - u)).toFixed(2);
          s.el.style.visibility = t >= s.t0 ? 'visible' : 'hidden';
        });

        // ---- cursors ----
        {
          const [x, y] = youPos(t);
          const show = t < 3.62;
          placeCursor(you, x, y, pressAt(YOU_CLICKS, t), ringAt(YOU_CLICKS, t), show, 1);
          you.c.style.opacity = t < 3.5 ? 1 : clamp(1 - (t - 3.5) / 0.12, 0, 1);
        }
        curs.forEach((cu, i) => {
          const show = t >= ENTER[i];
          let [x, y] = tracks[i](t);
          const busy = DRAWS[i].some(([a, b]) => t >= a - 0.02 && t <= b + 0.02) || DRAGS[i].length && t >= DRAGS[i][0] && t <= DRAGS[i][1];
          if (!busy) { const [wx, wy] = wob(i, t, 3.5); x += wx; y += wy; }
          const [sx, sy2] = camMap(x, y);
          const fk = SP_POP(seg(t, ENTER[i] + 0.12, 0.4));
          placeCursor(cu, sx, sy2, pressAt(CLICKS[i], t), ringAt(CLICKS[i], t), show, fk);
        });
      });
    },
  });
})();
