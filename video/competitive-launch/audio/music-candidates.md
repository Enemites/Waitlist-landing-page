# Backup music beds (CC0 / public domain), archive.org

Backup only. The film's score is built with `audio/synth.py`, so nothing here is required.
Searched on 2026-11-07 with the archive.org advancedsearch API, keeping only items whose
`licenseurl` is CC0 (`creativecommons.org/publicdomain/zero/1.0/`) or the Public Domain Mark
(`.../publicdomain/mark/1.0/`).

## Do not trust the license field on its own

A lot of items carry CC0 or PDM but are commercial recordings that uploaders labelled wrongly.
Examples from the same search: game and film soundtracks (Sonic 3, Fallout: New Vegas, Skyrim
vinyl rip, Half-Life, Disney/Pixar "isolated score"), Pink Floyd and Nine Inch Nails bootlegs or
remixes, and a "Holst: Mars, remastered" upload with no performer credit. **None of these are
usable.** Only use a source where the rights holder itself released the recording.

## Usable candidates (the rights holder released them to the public domain)

Musopen (a non-profit) paid for these orchestral recordings in its 2012 Kickstarter and released
them to the public domain. The compositions are public domain as well.
- Item: https://archive.org/details/MusopenCollectionAsFlac. License: Public Domain Mark 1.0.
  The item description says: "This project raised money to purchase and release music to the
  public domain."
- Related Musopen items: https://archive.org/details/musopen-lossless-dvd (PDM) and
  https://archive.org/details/musopen-chopin (CC0, solo piano, not useful here).

| Piece (file in MusopenCollectionAsFlac) | Length | Why it might fit |
|---|---|---|
| Beethoven, Coriolan Overture (`Beethoven_CoriolanOverture/LudwigVanBeethoven-CoriolanOverture.flac`) | 8:19 | Opens with sharp tutti C-minor hits separated by silences, which reads as tactical "hit, wait, hit". Good under the VS reveal. |
| Brahms, Symphony No. 1, mvt 1 intro (`Brahms_SymphonyNo.1inCMinor/...-01-UnPocoSostenuto-Allegro.flac`) | 15:09 (intro is about the first 2:30) | Timpani pedal under rising strings: a slow-burning tension bed for the cold open. |
| Brahms, Tragic Overture (`Brahms_TragicOverture/JohannesBrahms-TragicOverture.flac`) | 13:50 | D minor, the film's key, so it works with synth layers on top. |
| Tchaikovsky, Symphony No. 6 "Pathetique", mvt 3 (`Tchaikovsky_SymphonyPathetique/`) | about 9 min | A driving march that builds. Material for a match montage. |
| Smetana, Vltava / The Moldau (`Smetana_Vltava/`) | about 12 min | Written about a river (the Floodgate map is a river). The "St. John's Rapids" section is turbulent. |

Caveats:
- These are classical orchestral recordings. Their timbre does not match the film's modern,
  restrained, synth-and-ticks identity. At most, use a short excerpt under synth layers.
- None of these have been checked by ear (nobody on the crew can listen). Measure them with
  `python3 audio/measure.py` before use.
- Before using one, download the FLAC (not the MP3) and keep a link to the item page in the
  credits file.

## Rejected

- Genetic Trance netlabel releases, e.g. https://archive.org/details/gt466MonoSyntax-DataTransfer386.
  CC0 from the label, but the files are 8 kbps MP3 and the genre is noise/drone.
- Bull of Heaven releases (PDM): long experimental noise and drone pieces. Wrong tone.
- "Calm Pills - Relaxing Ambient Music" (CC0): a DJ mix album, so the rights to the tracks in it are unclear.
