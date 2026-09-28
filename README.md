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

## Checks

Run `bun run check`, `bun run lint`, `bun run test`, and `bun run build`.
