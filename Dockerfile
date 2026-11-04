# Orbito as one sealed image: the engine and its packages live here, never on the person's computer.
# The project's folders are mounted from outside (see templates/base/compose.yaml). Details: DOCKER.md
FROM node:24-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c

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
