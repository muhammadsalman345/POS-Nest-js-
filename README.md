# POS Nest JS Backend

NestJS + Prisma backend for the Kinetic POS frontend.

## Database

This project is currently configured for SQLite in `prisma/schema.prisma` for local development:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Use `DATABASE_URL="file:./dev.db"` for the local SQLite database.

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
touch prisma/dev.db
npx prisma db push
npm run db:seed
npm run start:dev
```

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
