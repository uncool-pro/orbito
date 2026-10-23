import { defineScreen } from '@uncool-pro/orbito-core';
import { DeviceScreen } from '@uncool-pro/orbito-runtime';

import { AppBar, Banner, Card, Divider, Icon, ListItem, Text } from '../../design-system';

// A placeholder so the board is not empty on day one. Delete it (and flows/start.flow.ts) once the first real screens exist.
export const meta = defineScreen({ code: 'ST-01', title: 'Start / Next steps', viewport: 'mobile', note: 'Placeholder from the project template. Delete it after the project kickoff.' });

export default function Start() {
  return (
    <DeviceScreen background="var(--color-bg)" top={<AppBar title="Your project is ready" />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2) var(--space-4) var(--space-5)' }}>
        <Banner title="This is a placeholder screen">It is built from the base design system, like every screen will be.</Banner>
        <Text tone="muted">Open Claude Code in this folder and say what you are building. Claude will ask about the product, the visual guidelines and the sources you already have.</Text>
        <Card title="Next steps" bare>
          <ListItem flush title="Kick off the project" subtitle="Run /orbito-init in Claude Code" leading={<Icon name="star" />} />
          <Divider inset />
          <ListItem flush title="See the design system" subtitle="#/ds in the browser" leading={<Icon name="image" />} />
          <Divider inset />
          <ListItem flush title="Check the rules" subtitle="npm run check:ds" leading={<Icon name="check" />} />
        </Card>
      </div>
    </DeviceScreen>
  );
}
