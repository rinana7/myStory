# My Story: Abandoned but not Forgotten

An interactive storybook for the **2026 NASA Space Apps Challenge** challenge *Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars*.

Open the book, answer one question, then meet five machines NASA left behind. Each page zooms into a NASA image and plays a silent, caption-driven story with typewriter text, timelines, scanner-style panels, and a quiet ending.

**Live site:** https://rinana7.github.io/myStory/

## The five machines

| Machine | Where | Ending |
|---|---|---|
| Apollo 17 rover and ALSEP science station | Moon | Stations shut down in 1977 |
| NEAR Shoemaker | Asteroid 433 Eros | Landed, then lost to the cold |
| Opportunity | Mars | Silenced by a planet-wide dust storm |
| Dawn | Ceres | Out of fuel, still in orbit |
| Ingenuity | Mars | Rotor blade damaged after 72 flights |

## How it works

- No build step and no backend: plain HTML, CSS and JavaScript.
- All text, scene scripts, sources and image credits live in `data/machines.json`. Adding a machine means adding an entry.
- `js/app.js` runs the book, `js/story.js` plays the scenes, `js/typewriter.js` does the typing effect.
- Finishing a robot's story earns its postage stamp, slammed onto the book page with a postmark. Earned stamps are remembered for the visit only (browser session storage) and shown together on the last page.
- Fonts (Orbitron, Share Tech Mono) load from Google Fonts, so the page needs an internet connection.

## Run it locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765 (a local server is needed because the page loads a JSON file).

## Accuracy and how facts are marked

- Facts come only from NASA and NSSDCA pages (listed below and on each book page). Each scene carries a source tag in the data file.
- Scenes that are the storyteller's own reflection are labeled **STORY VOICE** on screen and are never quoted as NASA's or a machine's words.
- Where NASA pages disagree, the data file's `notes` say so, and the page avoids the disputed number or shows the source.
- The reader's answer on the first page stays in the browser's memory. It is not saved or sent anywhere.

## Accessibility

- Works with the keyboard (arrow keys, Space, Escape) and with swipe on touch screens.
- Respects the reduced-motion setting: no autoplay, no zoom, text appears at once.
- Typed text is also in the page in full for screen readers; every image has alt text.

## NASA data and resources used

- [NASA Photojournal: Final Eros images, last closest image of Eros](https://science.nasa.gov/photojournal/final-eros-images-last-closest-image-of-eros/)
- [NASA release: After three years on Mars, Ingenuity helicopter mission ends (Jan. 25, 2024)](https://www.nasa.gov/news-release/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/)
- [NASA: A Collision Worth a Thousand Boulders (2001, updated 2024)](https://science.nasa.gov/solar-system/a-collision-worth-a-thousand-boulders/)
- [NASA: Apollo 17 mission](https://www.nasa.gov/mission/apollo-17/)
- [NASA: Dawn at Ceres](https://science.nasa.gov/mission/dawn/science/ceres/)
- [NASA: Dawn at Vesta](https://science.nasa.gov/mission/dawn/science/vesta/)
- [NASA: Dawn ion propulsion](https://science.nasa.gov/mission/dawn/technology/ion-propulsion/)
- [NASA: Dawn mission](https://science.nasa.gov/mission/dawn/)
- [NASA: Dawn mission status](https://science.nasa.gov/mission/dawn/mission-status/)
- [NASA: Dawn science overview](https://science.nasa.gov/mission/dawn/science/overview/)
- [NASA: Ingenuity Mars Helicopter](https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/)
- [NASA: Ingenuity by the numbers](https://science.nasa.gov/resource/ingenuity-mars-helicopter-by-the-numbers/)
- [NASA: MER science highlights](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-highlights/)
- [NASA: NEAR Shoemaker mission](https://science.nasa.gov/mission/near-shoemaker/)
- [NASA: NEAR Shoemaker stories](https://science.nasa.gov/mission/near-shoemaker/stories/)
- [NASA: Opportunity rover page](https://science.nasa.gov/mission/mer-opportunity/)
- [NASA: Spirit and Opportunity (overview)](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/)
- [NSSDCA: Apollo 17 Command and Service Module, ID 1972-096A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-096A)
- [NSSDCA: Apollo 17 Lunar Module / ALSEP, ID 1972-096C](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-096C)
- [NSSDCA: Apollo 17 mission info](https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo17info.html)
- [NSSDCA: Lunar Roving Vehicle](https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html)
- [NSSDCA: Opportunity, ID 2003-032A](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A)
- [NASA technical paper: The Lunar Roving Vehicle: Historical perspective (Morea, NASA Marshall, 1992)](https://ntrs.nasa.gov/citations/19930004820)
- NASA Image and Video Library (see [docs/image-credits.md](docs/image-credits.md))

## Super Intelligence (SI) disclosure

An SI tool, Claude (by Anthropic), helped research the NASA source pages, draft the story text, and write the code. The creator chose the concept, the look and the story direction. The five postage-stamp illustrations (`images/stamps/`) are SI-generated art and carry a visible "SI-generated art" mark; all other images are NASA images. Per NASA's guidance, SI output is not attributed to NASA, and NASA did not review this project.

## Disclaimer

This project is not affiliated with or endorsed by NASA. NASA is not responsible for its accuracy. No NASA logos are used.
