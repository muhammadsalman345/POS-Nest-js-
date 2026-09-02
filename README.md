# POS Nest JS Backend

NestJS + Prisma backend for the Kinetic POS frontend.

## Database

This project is configured for MySQL in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Use a MySQL connection string for `DATABASE_URL`. Local development uses `dev_db`, while production should use `live_db` from the hosting provider or managed MySQL service. Keep both values in environment variables, not in source control.

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run start:dev
```

For production deployments, run `npm run prisma:deploy` instead of `npm run prisma:migrate`.

## Fresh Database Reset

Local development:

```bash
npm run db:reset:dev
```

Local copy of the live database:

```bash
npm run db:reset:live
```

The reset commands are guarded: `dev` only resets `dev_db`, and `live` only resets `live_db`. Remote live databases require `--allow-remote-live`.

## Aiven Apps

For Aiven Apps, deploy from the repository root and select `compose.yaml` as the manifest. The backend app is built from `POS-Nest-js-/Dockerfile` and expects production environment variables to be configured in Aiven, especially `DATABASE_URL` pointing at `live_db`, `JWT_SECRET`, and `FRONTEND_URL`.

Default API URL:

```text
http://localhost:3000/api
```

Swagger:

```text
http://localhost:3000/api/docs
```

## Frontend Link

Set the frontend API URL in:

```text
POS-Ionic/src/environments/environment.ts
```

Default development value:

```ts
apiUrl: 'http://localhost:3000/api'
```



notes
npm run db:reset:dev
for reset db
npm run db:seed
for seed data 