# HonoJS Docker Compose Demo

This project is the Hono, PostgreSQL, and Drizzle ORM migration of the original NestJS Docker example. It preserves the original routes, controller/service/module split, CRUD behavior, and static book-management page.

  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Project setup

```bash
$ pnpm install
```

Copy `.env.example` to `.env`, then start PostgreSQL and the application.

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run build
$ pnpm run start:prod
```

The API is available at `http://localhost:3000`, and the book-management page is available at `http://localhost:3000/books`.

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Database migrations

```bash
$ pnpm run db:generate
$ pnpm run db:migrate
```

Application startup also applies committed Drizzle migrations, matching the original project's automatic schema synchronization.

## Docker Compose

```bash
$ pnpm run docker:up
$ pnpm run docker:prod:up
$ pnpm run docker:down
```
