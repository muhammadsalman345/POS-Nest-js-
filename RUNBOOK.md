# Runbook

## Install

```bash
npm install
```

## Configure

Copy `.env.example` to `.env`:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE?ssl-mode=REQUIRED"
JWT_SECRET="change-me-in-development"
JWT_ACCESS_EXPIRES_IN="7d"
PORT=3000
FRONTEND_URL="http://localhost:8100,http://localhost:4200"
```

## Prisma

```bash
npm run prisma:generate
npm run prisma:deploy
npm run db:seed
```

For Aiven MySQL, use the service URI from the Aiven console and keep SSL required.

## Local MySQL

Use a local MySQL database for development and keep its connection string only in your local `.env` file:

```sql
CREATE DATABASE kinetic_pos_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kinetic_user'@'localhost' IDENTIFIED BY 'kinetic_password';
GRANT ALL PRIVILEGES ON kinetic_pos_dev.* TO 'kinetic_user'@'localhost';
FLUSH PRIVILEGES;
```

```env
DATABASE_URL="mysql://kinetic_user:kinetic_password@localhost:3306/kinetic_pos_dev"
```

Use development migrations locally:

```bash
npm run prisma:migrate
npm run db:seed
npm run start:dev
```

## Production MySQL

Production should use the same code but a different `DATABASE_URL` configured in the hosting provider, such as Aiven Apps environment variables. Do not commit the production `.env` file.

Use production migrations during deployment:

```bash
npm run prisma:deploy
npm run start:prod
```

## Aiven Apps

Deploy from the repository root and select `compose.yaml` as the manifest. Configure the app environment variables in Aiven before deployment:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE?ssl-mode=REQUIRED"
JWT_SECRET="change-me"
JWT_ACCESS_EXPIRES_IN="7d"
FRONTEND_URL="https://your-frontend-origin"
SUPER_ADMIN_EMAIL="admin@example.com"
SUPER_ADMIN_PHONE="03000000000"
SUPER_ADMIN_PASSWORD="Admin@123"
```

## Run

```bash
npm run start:dev
```

API: `http://localhost:3000/api`

Swagger: `http://localhost:3000/api/docs`
