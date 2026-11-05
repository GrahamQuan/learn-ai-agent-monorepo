# 028-postgres-crud（Hono + PostgreSQL + Drizzle）

保留原项目的 controller/service/module 和查询行为；schema 位于 `src/db/schema/`。

首次初始化空的 serverless PostgreSQL 数据库：在本目录配置 `.env` 中的 `DATABASE_URL` 和 Embedding 凭据，然后运行：

```bash
pnpm db:setup
```

初始迁移先启用 pgvector，再创建三张业务表；迁移成功后才运行 seed。
数据库服务须支持 pgvector，连接用户须有启用扩展和建表的权限。
再次运行会跳过已应用的迁移，但 seed 会追加一组示例数据。只想更新表结构时运行 `pnpm db:migrate`。

从仓库根目录执行：

```bash
pnpm --filter 028-postgres-crud dev
pnpm --filter 028-postgres-crud typecheck
pnpm --filter 028-postgres-crud build
pnpm --filter 028-postgres-crud test
pnpm --filter 028-postgres-crud test:e2e
```

数据库建表后，可在仓库根目录运行 `pnpm --filter 028-postgres-crud db:seed`。
脚本复现 `pgsql-test/src/index.mjs` 的最终示例数据：李四、一个会话、两条普通消息和四条带向量的消息。
它使用 `.env` 的 Embedding 配置生成 1024 维向量，需要有效的 `OPENAI_API_KEY`。
每次运行都会新增一组数据，不清空已有记录；终端会输出本次的用户和会话 ID，供接口查询使用。

在本示例目录可以用以下命令管理数据库（在仓库根目录运行时加上 `--filter 028-postgres-crud`）：

| 命令 | 用途 |
| --- | --- |
| `pnpm db:setup` | 在配置的数据库执行迁移并写入示例数据 |
| `pnpm db:generate` | 根据实体定义生成 SQL 迁移到 `drizzle/`，不修改数据库 |
| `pnpm db:check` | 检查已生成的迁移快照是否一致 |
| `pnpm db:migrate` | 将尚未应用的迁移执行到 `DATABASE_URL` 指向的数据库 |
| `pnpm db:push` | 将实体结构直接同步到数据库，适用于本地开发 |
| `pnpm db:pull` | 从已有数据库反向生成 schema 到 `drizzle/` |
| `pnpm db:studio` | 打开 Drizzle Studio 查看和编辑数据 |
| `pnpm db:seed` | 写入一组会话和消息示例 |

若已用原项目 SQL 建表，请先核对现有结构，不要再执行包含相同建表语句的初始迁移。

默认端口 3005，原请求示例见 `test-curl.md`。HTTP 测试使用内存请求和服务 mock，
不代表真实 PostgreSQL 或 Embedding API 已联调。
Hono 的 JSON 解析错误返回 400 和稳定消息；不复刻 Nest/Express 随解析器版本变化的错误文本。

以下保留源项目的 NestJS 模板文档及注释作为迁移参考，不作为当前运行说明。

<details>
<summary>原始 NestJS 模板文档</summary>

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

</details>
