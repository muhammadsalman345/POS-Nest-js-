# Runbook

## Install

```bash
npm install
```

## Configure

Copy `.env.example` to `.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-in-development"
JWT_EXPIRES_IN="7d"
PORT=3000
FRONTEND_URL="http://localhost:8100,http://localhost:4200"
```

## Prisma

```bash
npm run prisma:generate
touch prisma/dev.db
npx prisma db push
npm run db:seed
```

## Run

```bash
npm run start:dev
```

API: `http://localhost:3000/api`

Swagger: `http://localhost:3000/api/docs`
