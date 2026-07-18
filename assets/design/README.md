# Portfolio design sources

## Canva

The approved Canva thumbnail reference is stored as `canva-thumbnail-system.png` and remains editable in [Canva](https://www.canva.com/d/V8Fyj57cpBvINkY).

Its content model is implemented in every `.project-card`:

- project name → `.thumbnail-caption h3`
- hardware image / motion preview → `.project-media video`
- schematic or interface visual → `.diagram-peek`
- technology labels → `.thumbnail-tags`
- role and stage → `.thumbnail-role`
- completion state → `.project-status`

## Figma

The responsive portfolio source is linked in [Figma](https://www.figma.com/design/rIsG2O42rxb2kTOPJeiRhN), with the system map in [FigJam](https://www.figma.com/board/Hitthu4d3jmHEeV1CW8Rg2).

The production website uses Manrope for interface typography, IBM Plex Mono for engineering labels, a warm light background, dark green text, and lime accents. Shared values live as CSS custom properties at the top of `style.css`.

## Responsive structure

- Desktop: two-column project grid with prominent video and schematic previews.
- Tablet: balanced two-column cards with simplified case navigation.
- Mobile: single-column cards, compact schematic previews, and stacked case-study evidence.
