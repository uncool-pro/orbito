# Orbito as one sealed image: the engine and its packages live here, never on the person's computer.
# The project's folders are mounted from outside (see templates/base/compose.yaml). Details: DOCKER.md
FROM node:25-slim@sha256:81db02c4b671288a03915da9534dbd54f96d0e7c24d80ccc54f5b36b2e684370

WORKDIR /orbito
COPY package.json package-lock.json ./
COPY packages ./packages
COPY templates ./templates
COPY demo ./demo
COPY skills ./skills
COPY agents ./agents
COPY docker ./docker
COPY CHANGELOG.md DOCKER.md ./

# versions exactly as in the lockfile, no install scripts; test tools are not needed at run time
RUN npm ci --ignore-scripts --no-audit --no-fund \
  && rm -rf node_modules/vitest node_modules/@vitest node_modules/@playwright node_modules/playwright node_modules/playwright-core \
  && ln -s /orbito/node_modules /node_modules \
  && mkdir /project /work \
  && chown node /project /work

ENV ORBITO_CONTAINER=1
USER node
EXPOSE 5190
ENTRYPOINT ["node", "/orbito/docker/entry.mjs"]
CMD ["serve"]
