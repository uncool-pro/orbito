# Design system

Starts as the **base kit** of Orbito: 25 neutral components for mobile and web, styled only through `tokens.json`. Make it yours by changing tokens first (colours, typeface, radius, spacing, elevation); change components only when the shape or behaviour must differ.

| Level | Builds on | Components |
|---|---|---|
| tokens | — | colour, font, type, space, radius, shadow, motion |
| atoms | tokens | Text, Icon, Button, IconButton, Badge, Avatar, Divider, Switch, Checkbox, Media |
| molecules | atoms | ListItem, TextField, SearchField, Chip, Card, Banner, SegmentedControl, EmptyState |
| organisms | molecules, atoms | AppBar, TabBar, Sheet, Dialog (mobile) · SideNav, PageHeader, DataTable (web) |
| templates | organisms and below | — (add page layouts here when screens start repeating one) |

Rules are checked by `npm run check:ds` and shown in the catalog (`#/ds/health`).
