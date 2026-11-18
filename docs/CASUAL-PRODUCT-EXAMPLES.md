# Casual product examples: content contracts

The three playable worlds in the Casual feed (`CasualReel.tsx`, scenes in `CasualWorldScenes.tsx` and
`TidalArchiveScene.tsx`) follow *Framework Desain Contoh Produk Realms* (18 November 2026). Each world
is written here as a content contract (framework §10) before its display. The scenes carry the
situation, the people, the odd detail and its resolution; the captions add one line, never an
explanation of how the product works.

The feed holds only these three worlds. A card is the world's own first frame (the Arrive beat) with
its first line, not a poster, and it opens that same moment in the reel. There are no duration or
other meta labels, no social numbers (there is no real data on this page), and no count of endings.

## The set

| Axis | The Tidal Archive | Rooftop Relay | Snowball Siege |
|---|---|---|---|
| Main feeling | Curious, then a chill | Adrenaline, then a laugh | Winning together, with a cost |
| Fantasy | Being expected | Being brave and quick | Being trusted to lead |
| Decision shape | Choosing what to pay attention to | Timed: the world doesn't wait | Collective: the team moves with you |
| Surprise source | You in the world before you came | Intent misread | A choice changes a relationship |
| Social scale | Alone, and one stranger | Alone, and one stranger | Team against team |
| Tone | Quiet | Light | Light |

Neighbours in the feed (Rooftop, Archive, Snowball) differ on at least four axes, decision shape and
surprise source among them. The grammar is the same in all three: tap a spot in the world, or let
the ring run out and the world takes its default.

## The Tidal Archive

```yaml
id: archive
kategori_mode: Mystery
sumbu:
  rasa_utama: penasaran, lalu merinding
  fantasi: ditunggu (being expected)
  bentuk_keputusan: memilih apa yang diperhatikan
  sumber_kejutan: diri sendiri di dunia
  skala_sosial: sendiri, satu orang asing
  nada: sunyi
frame_pertama:
  situasi: Someone in a flooding archive is waving a lamp at the stones, where you just landed.
  yang_terlihat: You on a stepping stone holding a torch that flickers; a figure (Ines) in the lit doorway swinging a lamp toward you; the relay on the roof blinking; the tide line.
tokoh:
  - nama: You
    keinginan: To know who is signalling, and why at you.
  - nama: Ines, the archivist
    keinginan: To be answered by whoever comes by the stones before the tide takes the archive.
taruhan: The tide is rising; the crossing and the archive's lower floor go under.
fakta_pengikat:
  - The tide is coming in.
  - The lamp and the roof light are aimed at you.
benih_kejutan: The roof relay blinks the same broken rhythm as your own torch.
pilihan:
  - label: Wave your torch
    menempel_pada: Your torch, raised toward Ines in the doorway
    rasa: warm
    akibat:
      umpan_balik: Ines lifts her lamp high.
      perubahan: The crossing rises out of the water and its lights come on, toward you.
      rasa: Being welcomed by someone who waited.
  - label: Read the roof light
    menempel_pada: The relay on the roof
    rasa: a chill
    akibat:
      umpan_balik: The relay's rings slow to your torch's rhythm.
      perubahan: A light on the far shore answers in the same rhythm; the tide climbs.
      rasa: The place has been sending your signal for a long time.
  - label: Step down to the arch
    menempel_pada: The arch under the east wing
    rasa: brave
    akibat:
      umpan_balik: The stepping stones light up one by one.
      perubahan: The arch glows; a torch just like yours hangs inside it.
      rasa: Going in alone, and finding you were already here.
default:
  akibat: You keep still; Ines raises the crossing for you anyway (the Wave outcome, captioned "You kept still").
resolusi_kejutan: Each outcome shows the archive already knows you - your rhythm on its relay, your torch in its arch, Ines waiting for you by name.
jejak: Wave - "Ines knows your face." Read - "You know the archive's signal." Step down - "You found your own torch."
sinyal_sosial:
  sumber_data: none
  tampilan: none
benang_ke_contoh_lain: none
hasil_rubrik: see "Rubric" below
```

## Rooftop Relay

```yaml
id: rooftop
kategori_mode: Action
sumbu:
  rasa_utama: adrenalin, lalu lucu
  fantasi: berani dan cepat
  bentuk_keputusan: berwaktu (the ring is short; the drone doesn't wait)
  sumber_kejutan: niat yang salah dibaca
  skala_sosial: sendiri, satu orang asing
  nada: ringan
frame_pertama:
  situasi: A drone is diving at you on a rooftop while you hold a package.
  yang_terlihat: You crouched with a yellow package; a drone with a searchlight closing in; a white card dangling under the drone; laundry line and a gap to the next roof.
tokoh:
  - nama: You, the courier
    keinginan: Deliver the package and lose the drone.
  - nama: Pip, a kid on the far roof with a controller
    keinginan: Get the drone to you.
taruhan: The delivery, and not getting caught.
fakta_pengikat:
  - The drone is chasing you.
  - Something white hangs from it.
benih_kejutan: The drone's card is the same size as the empty spot on your package; Pip is on the far roof steering.
pilihan:
  - label: Jump the gap
    menempel_pada: The edge of the roof
    rasa: brave
    akibat:
      umpan_balik: You leap.
      perubahan: The drone dives alongside and drops the card onto your package mid-air; Pip cheers on the far roof.
      rasa: Thrill, then "oh, it was helping."
  - label: Ride the line
    menempel_pada: The laundry line
    rasa: funny
    akibat:
      umpan_balik: You hook the line and slide.
      perubahan: The drone catches in the laundry line beside you and the card drops onto your box; Pip cheers on the far roof.
      rasa: Absurd escape.
  - label: Duck inside
    menempel_pada: The stairwell door
    rasa: clever
    akibat:
      umpan_balik: The door shuts.
      perubahan: The drone lands at the door with the card; Pip calls out "You dropped this!"
      rasa: Clever, then sheepish.
default:
  akibat: You freeze and duck inside (the Duck outcome, captioned "You froze").
resolusi_kejutan: The drone was never hunting you. It is Pip's, chasing you to give back the address label that fell off the package - which is for Pip.
jejak: Jump - "Pip saw you fly." Ride - "You rode the laundry line." Duck - "Pip's drone found you anyway."
sinyal_sosial:
  sumber_data: none
  tampilan: none
benang_ke_contoh_lain: none
hasil_rubrik: see "Rubric" below
```

## Snowball Siege

```yaml
id: snowball
kategori_mode: Team battle
sumbu:
  rasa_utama: menang bersama, dengan harga
  fantasi: dipercaya memimpin
  bentuk_keputusan: kolektif (your team moves when you choose)
  sumber_kejutan: pilihan mengubah hubungan
  skala_sosial: tim lawan tim
  nada: ringan
frame_pertama:
  situasi: Blue is pelting your fort, and one blue kid has turned their back on the fight.
  yang_terlihat: Your team (red) ducking behind a half wall; blue's thrower mid-throw; snowballs in the air; behind blue's wall, Kit patting a half-built snowman that wears a red scarf.
tokoh:
  - nama: Bo, your teammate
    keinginan: To win, and to hear the plan from you.
  - nama: Rex, blue's thrower
    keinginan: To knock your wall down.
  - nama: Kit, on blue
    keinginan: To finish the snowman before anyone sees.
taruhan: Your wall and your flag.
fakta_pengikat:
  - One more volley and your wall falls.
  - Kit, on the other team, is building something in your colour.
benih_kejutan: A snowman in a red scarf behind the blue wall.
pilihan:
  - label: Charge together
    menempel_pada: The open field
    rasa: bold
    akibat:
      umpan_balik: Your whole team runs out with you.
      perubahan: Blue's flag turns red; the snowman is knocked flat in the rush; Kit sits by it.
      rasa: Victory with a sting.
  - label: Build the wall higher
    menempel_pada: Your wall
    rasa: safe
    akibat:
      umpan_balik: Bo stacks blocks beside you.
      perubahan: The wall doubles; nobody gets through; behind blue's wall Kit finishes the snowman and lifts its arm, waving at your fort.
      rasa: Safe, and a little curious.
  - label: Call a truce
    menempel_pada: Blue's thrower
    rasa: warm
    akibat:
      umpan_balik: Both teams lower their arms and walk out.
      perubahan: Kit rolls the snowman to the middle; it wears your team's scarf; both teams finish it together. No flag changes hands.
      rasa: Warm; the other team becomes friends.
default:
  akibat: Nobody calls it, so your team builds the wall (the Build outcome, captioned "Nobody called it").
resolusi_kejutan: Kit was building the snowman for your team. What you choose decides whether it gets smashed, waved from behind a wall, or finished together - and whether blue stays a rival.
jejak: Charge - "You took the flag." Build - "Kit waved at your fort." Truce - "Kit is on your side now."
sinyal_sosial:
  sumber_data: none
  tampilan: none
benang_ke_contoh_lain: none
hasil_rubrik: see "Rubric" below
```

## Rubric

Checked against framework §9 after building, on screen, with every caption, label and chip hidden
where the item calls for it (1, 2, 9, 10), at reel size and at feed-card size. "Partial" is a real
gap, not a pass.

| # | Item | Archive | Rooftop | Snowball |
|---|---|---|---|---|
| 1 | Situation readable from the first frame without text | Partial: a figure in a lit doorway swings a lamp out over the water toward a small figure with a torch; readable at reel size, but at phone card size both people are tiny | Pass: you crouched with a package, a drone with a card diving at you | Pass: two teams, a snowball volley, one blue kid turned toward a snowman |
| 2 | People who want different things | Pass (you, Ines) | Pass (you, Pip) | Pass (Bo, Rex, Kit) |
| 3 | Stakes clear | Pass: the tide line and the half-sunk crossing | Pass: the drone closing in | Pass: your wall and your flag |
| 4 | Value without input (default) | Pass: Ines raises the crossing anyway | Pass: you freeze, duck inside, the drone knocks | Pass: the team builds, Kit's snowman waves |
| 5 | At most two facts to catch | Pass | Pass | Pass |
| 6 | Choices differ in feeling | Pass: warm / chill / brave | Pass: brave / funny / clever | Pass: bold / safe / warm |
| 7 | No clearly right choice | Pass: each one loses something (tide, crossing, company) | Pass: breath, a shirt, lateness | Pass: the snowman, the win, the flag |
| 8 | Three layers for every choice | Pass | Pass | Pass |
| 9 | Outcomes differ | Pass: crossing raised / far light answering / arch lit and you gone | Pass: mid-air / tangled on the line / drone at the door | Pass: snowman flat / waving over the wall / finished in the middle |
| 10 | Surprise resolved | Partial: the shared rhythm and the torch in the arch show it; "she was waiting for you" needs the caption | Pass: in every outcome the drone brings the card and Pip celebrates | Pass: the snowman in your scarf is smashed, shown to you, or shared |
| 11 | Trail is an asset | Pass | Pass | Pass |
| 12 | Indicators and numbers honest | Pass: none shown | Pass: none shown | Pass: none shown |
| 13 | No explanatory or meta text | Pass | Pass | Pass |
| 14 | Differs from neighbours on two axes | Pass | Pass | Pass |

Known limits, not covered by a pass above: the figures are stick figures without faces, so
expression is carried by pose, facing and colour; there is no audio; there are no social signals
because the page has no real data; there is no thread between worlds (framework §6.3 is optional).
The static "Interface concept" screenshot below the reel was drawn for the earlier Archive story
(a power reserve and three ways in) and no longer matches it.
