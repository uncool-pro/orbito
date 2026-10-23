import { defineDocs } from '@uncool-pro/orbito-core';

import { Button } from '../atoms/Button';
import { Dialog } from './Dialog';

export default defineDocs({
  component: 'Dialog',
  description: 'A decision that must be made before going on: confirm a delete, discard changes. Centred over a dimmed screen.',
  guidelines: {
    do: ['Title is the question; buttons are the answers ("Delete", "Keep").', 'Say what cannot be undone.'],
    dont: ["Don't use a dialog to show information that could be a Banner."],
  },
  variants: [
    {
      name: 'Confirm delete',
      width: 390,
      render: () => (
        <div style={{ position: 'relative', height: 320 }}>
          <Dialog title="Delete this invoice?" actions={<><Button variant="ghost" back>Keep</Button><Button variant="danger">Delete</Button></>}>
            It will be removed for everyone in your team. This cannot be undone.
          </Dialog>
        </div>
      ),
    },
  ],
});
