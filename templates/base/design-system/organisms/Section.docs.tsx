import { defineDocs } from '@uncool-pro/orbito-core';

import { Button } from '../atoms/Button';
import { Grid } from '../atoms/Grid';
import { Text } from '../atoms/Text';
import { Section } from './Section';

export default defineDocs({
  component: 'Section',
  description: 'One full-width band of a web page or landing page, with its content in a centred column. A landing is a sequence of sections; each answers one question of the visitor and has an `id` the navigation and the buttons can link to.',
  guidelines: {
    do: ['Give every section an `id` named after its content (`pricing`, `faq`) so links can reach it.', 'Alternate tones to separate sections instead of drawing lines.', 'Keep one main action per section, named after what happens ("See pricing").'],
    dont: ["Don't put two sections with the same layout one after another: vary the composition.", "Don't leave out the title except in the hero, which carries the page's h1."],
  },
  variants: [
    {
      name: 'With title and lead',
      width: 960,
      render: () => (
        <Section id="how-it-works" title="How it works" lead="Three steps from sign-up to the first result.">
          <Grid>
            <Text>Create an account.</Text>
            <Text>Connect your calendar.</Text>
            <Text>Get your first report.</Text>
          </Grid>
        </Section>
      ),
    },
    {
      name: 'Accent band with an action',
      width: 960,
      render: () => (
        <Section id="start" tone="accent" title="Ready to try it?">
          <div>
            <Button href="#pricing">See pricing</Button>
          </div>
        </Section>
      ),
    },
  ],
});
