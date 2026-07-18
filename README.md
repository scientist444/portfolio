# Muhammad Umer Sajid — Engineering Portfolio

A light portfolio documenting embedded electronics, PCB, firmware and test engineering work in Muhammad Umer Sajid's own voice.

## Structure

```text
index.html                Portfolio home
project.html              Reusable case-study page
projects_data.js          Fourteen project case studies
style.css                 Design system and responsive layout
script.js                 Rendering, motion and accessibility
assets/projects/          Curated hardware, PCB and circuit excerpts
assets/motion/            Remotion project previews
assets/design/            Canva design reference and source notes
motion/                    Remotion source and compositions
pcb work/                 Local source archive
```

Fourteen projects use the same dedicated case-study route. Each page includes requirements, architecture, a readable circuit or system schematic, implementation notes, validation and next steps.

```text
project.html?project=ankle-band
project.html?project=smart-stethoscope
project.html?project=arduino-opta-plc
project.html?project=p2p-lora
```

## Local preview

From the repository root:

```powershell
python -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## Motion previews

The project cards use silent, loopable MP4 previews rendered with Remotion. To edit or re-render them:

```powershell
cd motion
npm install
npm run studio
```

The compositions are registered in `motion/src/Root.tsx`. Rendered outputs belong in `assets/motion/`.

## Design sources

- [Canva project-thumbnail system](https://www.canva.com/d/V8Fyj57cpBvINkY)
- [Figma portfolio file](https://www.figma.com/design/rIsG2O42rxb2kTOPJeiRhN)
- [FigJam project architecture board](https://www.figma.com/board/Hitthu4d3jmHEeV1CW8Rg2)
- [Repository design mapping](assets/design/README.md)

The code-native cards implement the same fields requested in the Canva direction: project name, hardware image, schematic preview, technology labels, role and project status. The responsive layout and shared CSS tokens are documented alongside the Figma source link.

## Contact

- Email: [umersajid20208@gmail.com](mailto:umersajid20208@gmail.com)
- GitHub: [scientist444](https://github.com/scientist444)
- LinkedIn: [Muhammad Umer Sajid](https://www.linkedin.com/in/muhammed-umer-sajid-361084282)
