# Orbito as one sealed image: the engine and its packages live here, never on the person's computer.
# The project's folders are mounted from outside (see templates/base/compose.yaml). Details: DOCKER.md
# Debian 13 (trixie) with Node 24 LTS, pinned by digest: the image changes only through a pull request here
FROM node:24-trixie-slim@sha256:4d00acb4bcc42c454c4eb801526f7ad7f772ea3bd4fd168c5cc2e384abcbb9d4

WORKDIR /orbito
COPY package.json package-lock.json ./
COPY packages ./packages
COPY templates ./templates
COPY demo ./demo
COPY skills ./skills
COPY agents ./agents
COPY docker ./docker
COPY CHANGELOG.md DOCKER.md ./

# versions exactly as in the lockfile, no install scripts; test tools are not needed at run time, and neither are the
# package managers themselves: once the packages are in, npm, npx, corepack and yarn leave the image (fewer programs
# that could fetch and run code, and their own bundled libraries no longer show up in vulnerability scans)
RUN npm ci --ignore-scripts --no-audit --no-fund \
  && rm -rf node_modules/vitest node_modules/@vitest node_modules/@playwright node_modules/playwright node_modules/playwright-core \
  && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-* /root/.npm \
  && ln -s /orbito/node_modules /node_modules \
  && mkdir /project /work \
  && chown node /project /work

ENV ORBITO_CONTAINER=1
USER node
EXPOSE 5190
ENTRYPOINT ["node", "/orbito/docker/entry.mjs"]
CMD ["serve"]
