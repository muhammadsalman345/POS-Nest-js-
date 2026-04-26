# Runbook

## Install

```bash
npm install
```

## Configure

Copy `.env.example` to `.env` and set a MySQL database URL:

```env
DATABASE_URL="mysql://root:password@localhost:3306/second_hand_mobile_pos"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
```

## Prisma

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

## Run

```bash
npm run start:dev
```

API: `http://localhost:3000/api`

Swagger: `http://localhost:3000/api/docs`
