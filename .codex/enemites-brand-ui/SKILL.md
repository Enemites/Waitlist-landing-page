---
name: enemites-landing
description: Design system for Enemites landing pages and marketing pages. Read this fully before writing any HTML, CSS, JSX, or Tailwind for Enemites landing pages.
---

# Enemites — Landing Page Design System

---




---

## Colors

| Token | Hex | Role |
|---|---|---|
| `--nova-void` | `#0F1117` | Dark base background |
| `--nova-surface` | `#1C2030` | Cards, elevated panels, borders |
| `--nova-bone` | `#E8E4D9` | Light base background; primary text on dark |
| `--nova-white` | `#FFFFFF` | Landing page only — elevated panels above base |
| `--nova-brand` | `#D97757` | Brand orange — gradient anchor, brand CTA only |
| `--nova-red` | `#D4453A` | Urgency, delete, critical, countdown |
| `--nova-amber` | `#F2A93B` | Warning, caution |
| `--nova-green` | `#3DDC84` | EXP gain, positive outcome |

**Void and bone are the only base backgrounds.**

**Brand orange:** gradient text anchor and brand CTA button only. Never solid fill, solid text, border, or decorative use.

**Red, amber, green:** signals only — small icon, indicator, or second gradient color. Never dominant, never decorative, never on buttons or backgrounds.

### Surface hierarchy (dark context)
```
#0F1117  ← base (void)
#1C2030  ← cards, panels, borders (surface)
#252A3A  ← hover states
#333849  ← dividers
```

---

## Typography

| Role | Font | Size | Weight |
|---|---|---|---|
| Display | Space Grotesk | 40–56px | 600 |
| H1 | Space Grotesk | 28–32px | 500 |
| H2 | Space Grotesk | 20–24px | 500 |
| H3 | Inter | 16–18px | 500 |
| Body | Inter | 15–16px | 400 |
| Label | Inter | 12–13px | 500 |
| Data/numbers | JetBrains Mono | 13–15px | 400–500 |

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

- Display/H1: `letter-spacing: -0.02em`
- Body line-height: `1.6`. Everything else: `1.3–1.4`
- Max font-weight for body/UI: `500`. Never 700+.
- All numbers (scores, latency, EXP, %, timestamps): JetBrains Mono always.

---

## Button Rules

**Rule 1 — Border only when button color matches background:**
Border (`0.5px solid #1C2030`) only appears when button background = page background. If button already contrasts, no border.

**Rule 2 — Bone button only on bone background.**

**Rule 3 — Void and brand buttons appear on any background.**

**Brand CTA** — one per page/screen max, most important action only:
```css
background: #D97757; color: #E8E4D9; border: none;
border-radius: 8px; padding: 12px 24px;
font-family: Inter; font-weight: 500; font-size: 15px;
```

**Void button** (on bone or white background):
```css
background: #0F1117; color: #E8E4D9; border: none;
border-radius: 8px; padding: 12px 24px;
```

**Void button with border** (on void background):
```css
background: #0F1117; color: #E8E4D9;
border: 0.5px solid #1C2030;
border-radius: 8px; padding: 12px 24px;
```

**Bone button** (only on bone background):
```css
background: #E8E4D9; color: #0F1117;
border: 0.5px solid #1C2030;
border-radius: 8px; padding: 12px 24px;
```

**Red is never a button color.** Destructive actions: ghost button with red icon/text only.

---

## Components

### Cards
**Standard:** background `#1C2030`, border `0.5px solid #333849`, border-radius `12px`, padding `20px 24px`. No box-shadow.

**Selected/active:** background `#0F1117`, border `0.5px solid #1C2030`.

### Badges
Bold gradient text. No colored background boxes ever. Always 2 colors, always orange anchor.

| Tone | Gradient |
|---|---|
| Urgent | `#D97757` → `#D4453A` |
| Technical | `#D97757` → `#9DA3B4` |
| Process | `#D97757` → `#E8E4D9` |

```css
.badge { font-weight: 600; font-size: 12px;
  background: linear-gradient(90deg, var(--a), var(--b));
  background-size: 200% auto;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; animation: gradient-shift 3s linear infinite; }
.badge-urgent    { --a: #D97757; --b: #D4453A; }
.badge-technical { --a: #D97757; --b: #9DA3B4; }
.badge-process   { --a: #D97757; --b: #E8E4D9; }
@keyframes gradient-shift { 0% { background-position: 0%; } 100% { background-position: 200%; } }
```

### Gradient text
1–3 words max — only the words carrying the most meaning in a headline. Never a full sentence.

Always 2 colors, always orange anchor. Never 3 colors.

```css
.gradient-text {
  background: linear-gradient(90deg, var(--g-from), var(--g-to));
  background-size: 200% auto;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; animation: gradient-shift 4s linear infinite;
}
.gradient-urgent    { --g-from: #D97757; --g-to: #D4453A; }
.gradient-technical { --g-from: #D97757; --g-to: #9DA3B4; }
.gradient-process   { --g-from: #D97757; --g-to: #E8E4D9; }
```
One gradient text per screen max. Speed: 3–6 seconds.

### Data display
```html
<span style="font-family:'JetBrains Mono';font-size:14px;color:#E8E4D9;">4.2s</span>
<span style="font-family:'JetBrains Mono';font-size:11px;color:#9DA3B4;margin-left:6px;">latency</span>
```

### Icons
Phosphor Icons only. `regular` default, `bold` for emphasis. `16px` inline, `20px` standalone, `24px` max. Color inherits from text.

---

## Always Avoid

- Confetti (banned)
- Colored background badges/pills
- Red/amber/green as button, background, or decorative accent
- Brand orange as solid text, border, or decorative fill
- Bone buttons on void or dark backgrounds
- Border on button that already contrasts with its background
- Em dash "—" as dramatic pause in copy
- "Great job!", "Keep going!", "You're doing amazing!"
- Arbitrary purple-pink-blue gradients

---

## Landing Page Specific

### Base
- Background: void (`#0F1117`)
- White (`#FFFFFF`) for elevated sections/panels above void only — not as base. Text inside white panels uses void (`#0F1117`).

### Layout
Spacious — whitespace guides eye toward CTA.

### Navbar
Glassmorphism — iOS-style:
```css
backdrop-filter: blur(12px);
background: rgba(15, 17, 23, 0.6);
border-bottom: 0.5px solid rgba(255,255,255,0.08);
```

### Motion
Fully free — bounce, float, parallax, glassmorphism, glow all allowed.

### Gradient text
Freely used on hero headlines (1–3 key words).

### Buttons
- Brand CTA (`#D97757`) — one per page, most important action (e.g. "Join waitlist")
- Void with border — on void background
- Bone — on bone or white sections
- Glass/blur button — for navbar or glassmorphism sections:
```css
background: rgba(255,255,255,0.08);
backdrop-filter: blur(8px);
border: 0.5px solid rgba(255,255,255,0.15);
color: #E8E4D9;
border-radius: 8px; padding: 10px 20px;
```

### Images
Always include. Hero: full-bleed or large background with overlay. Section breaks for visual breathing room.
Art direction: atmospheric, dark-toned, spatial (control rooms, data landscapes, aerial views). No stock photos.

### Checklist
- [ ] Void base background
- [ ] White for elevated panels only, not as base
- [ ] Glassmorphism navbar
- [ ] Brand CTA one per page max
- [ ] Bone buttons only on bone/white sections
- [ ] Hero has image slot
- [ ] Gradient text on 1–3 hero words only
