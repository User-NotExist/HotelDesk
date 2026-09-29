# Hotel Desk

A staff webapp for managing hotel rooms, guests, reservations, and check-in/checkout. It runs on Bun with SvelteKit, Prisma, and a local SQLite database. The UI uses Tailwind CSS and shadcn-svelte.

## Local setup

1. Install dependencies with `bun install`.
2. Copy `.env.example` to `.env`. Keep `DATABASE_URL="file:./dev.db"` unless you want the SQLite file elsewhere.
3. Run `bun run db:migrate` and `bun run db:generate`.
4. Start development with `bun run dev`.

Create at least one room and guest before making a reservation. A reservation needs one primary guest; additional guests can be added up to room capacity. Use **Walk-in** to create and check in a stay immediately.

For a populated hotel desk, run `bun run db:seed` after migrating. It fills 50 rooms and 200 fictional guest profiles, plus recent stays, current check-ins, arrivals, future reservations, and cancellations. It preserves existing bookings and skips conflicting open stays. Re-running it on the same day does not duplicate its records. Run it against a demo database only; the seed intentionally creates fictional hotel activity.

## Hotel LAN server

Run `bun run build`, then `bun run start` on the hotel server. Set `HOST=0.0.0.0`, `PORT=3000`, and `ORIGIN` to the stable URL staff use, such as `http://hotel-server:3000`. Set `TZ` to the hotel's timezone so "today" and check-in dates match local operations. Staff devices must be able to reach that host on the trusted hotel LAN. No login is included, so keep the server off public networks.

Back up `dev.db` regularly. The database file and `.env` are excluded from Git. To apply future schema migrations on an existing installation, run `bunx --bun prisma migrate deploy --config prisma7.config.ts` and then `bun run db:generate` before starting the server.

## Docker and Jenkins deployment

The `Dockerfile` builds and verifies the app with Bun. `compose.yaml` runs it on port 3000 and stores SQLite data in the `hotel-desk-data` volume. For a manual deployment, copy `.env.docker.example` to `.env.docker`. Set `ORIGIN` to the exact URL in the browser, including scheme, hostname or IP, and port (for example, `http://192.168.1.20:3000`). SvelteKit rejects form submissions with HTTP 403 when this differs. If `HOST_PORT` changes, include that port in `ORIGIN`. Then run:

```sh
docker compose build app
docker compose run --rm --no-deps app bunx --bun prisma migrate deploy --config prisma7.config.ts
docker compose up -d --wait app
```

For Jenkins, create one **Secret file** credential with ID `hotel-desk-env` containing the same env file. Configure a Pipeline job from this repository's `Jenkinsfile`. The Jenkins agent needs Docker Compose access to the Docker host that will run the app. The pipeline builds and checks the image, applies pending migrations, and updates the Compose service while retaining the `hotel-desk-data` volume. Keep the credential's `ORIGIN` equal to the browser URL, and expose port 3000 only on the trusted hotel LAN. Back up the Docker volume regularly.

## Checks

Run `bun run check`, `bun run lint`, `bun run test`, and `bun run build`.
