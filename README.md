# Muhammad Umer Sajid — Engineering Portfolio

A light portfolio documenting embedded electronics, PCB, firmware and test engineering work in Muhammad Umer Sajid's own voice.

## Structure

```text
index.html                Portfolio home
project.html              Reusable case-study page
projects_data.js          Featured and earlier project content
style.css                 Design system and responsive layout
script.js                 Rendering, motion and accessibility
assets/projects/          Curated hardware, PCB and circuit excerpts
assets/motion/            Privacy-safe Remotion previews
motion/                    Remotion source and compositions
PCB WORK/                 Local source archive (not published)
```

Eight featured projects use dedicated case-study routes. Each page includes requirements, architecture, a focused circuit or hardware excerpt, implementation notes, validation and next steps.

```text
project.html?project=ankle-band
project.html?project=smart-stethoscope
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

## Content policy

- Show system architecture and selected engineering evidence.
- Do not publish complete schematics, production firmware or sensitive component values.
- Use verified status and test language; avoid unsupported performance metrics.
- Keep `PCB WORK/` local. It contains source material used to prepare the public case studies.

## Contact

- Email: [umersajid20208@gmail.com](mailto:umersajid20208@gmail.com)
- GitHub: [scientist444](https://github.com/scientist444)
- LinkedIn: [Muhammad Umer Sajid](https://www.linkedin.com/in/muhammed-umer-sajid-361084282)
