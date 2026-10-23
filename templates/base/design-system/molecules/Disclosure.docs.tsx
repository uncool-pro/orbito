import { defineDocs } from '@uncool-pro/orbito-core';

import { Disclosure } from './Disclosure';

export default defineDocs({
  component: 'Disclosure',
  description: 'A question with a hidden answer: FAQ and optional details. Native `<details>`, so it works without scripts, also in a static export.',
  guidelines: {
    do: ['Write the title as the visitor would ask it: "Can I cancel any time?".', 'Answer in the first sentence; details after.'],
    dont: ["Don't hide what every visitor needs (price, what they get): disclosures are for doubts, not for the offer."],
  },
  variants: [
    { name: 'Closed', width: 560, render: () => <Disclosure title="Can I cancel any time?">Yes. Cancel in your account settings; you keep access until the end of the paid month.</Disclosure> },
    { name: 'Open', width: 560, render: () => <Disclosure title="Do I need to install anything?" open>No. Everything works in the browser.</Disclosure> },
  ],
});
