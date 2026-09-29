FROM oven/bun:1.3.14 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
ENV DATABASE_URL=file:./data/dev.db
RUN bunx --bun prisma generate --config prisma7.config.ts
RUN bun run check && bun run lint && bun run test && bun run build

FROM oven/bun:1.3.14

WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000

COPY --from=build --chown=bun:bun /app/build ./build
COPY --from=build --chown=bun:bun /app/node_modules ./node_modules
COPY --from=build --chown=bun:bun /app/generated ./generated
COPY --from=build --chown=bun:bun /app/package.json ./package.json
COPY --from=build --chown=bun:bun /app/prisma ./prisma
COPY --from=build --chown=bun:bun /app/prisma7.config.ts ./prisma7.config.ts

RUN mkdir -p /app/data && chown bun:bun /app/data
USER bun
EXPOSE 3000

CMD ["bun", "run", "start"]
