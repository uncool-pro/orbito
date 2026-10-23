# Leafy design system (example)

Atomic structure: each level builds only on the levels below it.

| Level | Folder | Builds on | Examples |
|---|---|---|---|
| tokens | `tokens.css` | — | colours, type, space, radius, motion |
| atoms | `atoms/` | tokens | Text, Button, Icon |
| molecules | `molecules/` | atoms | ListItem, Field, PlantThumb |
| organisms | `organisms/` | molecules, atoms | AppBar, TabBar |
| screens | `../screens/` | organisms, molecules, atoms | — |

Rules: no raw colours, sizes or fonts outside `tokens.css`; screens import from `design-system` only; a new element starts as a component here, then goes into a screen.
