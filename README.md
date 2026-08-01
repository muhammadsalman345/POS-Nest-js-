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

Use a MySQL connection string for `DATABASE_URL`. Local development can point at your local MySQL database, while production should point at the Aiven MySQL service URI with SSL required. Keep both values in environment variables, not in source control.

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

## Aiven Apps

For Aiven Apps, deploy from the repository root and select `compose.yaml` as the manifest. The backend app is built from `POS-Nest-js-/Dockerfile` and expects production environment variables to be configured in Aiven, especially `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL`.

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
kinetic-pos/src/environments/environment.ts
```

Default development value:

```ts
apiUrl: 'http://localhost:3000/api'
```
