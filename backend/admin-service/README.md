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

## OriginBI RAG Stack (Low Cost + High Quality)

This service includes a multi-stage RAG pipeline (planner, SQL generation, retrieval, synthesis).
To reduce cost without shrinking final answer richness, use a hybrid model stack.

### Recommended model stack

- Planner: `gemini-2.0-flash` (cheap, fast)
- Reflector: `gemini-2.0-flash` (cheap quality check)
- SQL generation: `gemini-2.5-flash` (higher reliability for complex joins)
- SQL synthesizer: `gemini-2.5-flash` (keep answer quality)
- Final RAG answer: `gemini-2.5-flash` (keep output quality)
- Embeddings: `gemini-embedding-001`
- Optional reranker: Cohere `rerank-v3.5`

### Why this works

- Cost drops by moving helper stages to cheaper models.
- Complex DB questions remain accurate because SQL + final synthesis stay on stronger models.
- Final answer token budget can stay high, so response detail is preserved.

### Production env template

```bash
# Core keys
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key
COHERE_API_KEY=your_key

# Model routing
GEMINI_PLANNER_MODEL=gemini-2.0-flash
GEMINI_REFLECTOR_MODEL=gemini-2.0-flash
GEMINI_FORMATTER_MODEL=gemini-2.0-flash

GEMINI_SQL_MODEL=gemini-2.5-flash
GEMINI_SQL_SYNTH_MODEL=gemini-2.5-flash
GEMINI_RAG_MODEL=gemini-2.5-flash
GEMINI_KNOWLEDGE_MODEL=gemini-2.5-flash

# Token budgets (do not reduce final answer richness)
AGENT_PLANNER_MAX_OUTPUT_TOKENS=320
AGENT_REFLECTOR_MAX_OUTPUT_TOKENS=180
FORMATTER_MAX_OUTPUT_TOKENS=520

SQL_MAX_OUTPUT_TOKENS=680
SQL_SYNTH_MAX_OUTPUT_TOKENS=860
RAG_MAX_OUTPUT_TOKENS=720
KNOWLEDGE_MAX_OUTPUT_TOKENS=860
```

### Complex query quality checklist

- Keep Text-to-SQL enabled for all data-heavy questions.
- Keep schema introspector and SQL validator active.
- Keep hybrid retrieval (vector + lexical + rerank) enabled.
- Use cache for repeated queries, but scope it by tenant/user.
- Monitor retry rate and fallback rate; if high, keep SQL on stronger model.

### Gemini 2.0 Flash support

Yes, `gemini-2.0-flash` is supported in this stack for planner/reflector/formatter stages.
For complex SQL and final long-form answers, `gemini-2.5-flash` remains the recommended default.

### Security note

- Never commit `.env` with live API keys.
- Rotate exposed keys immediately and store secrets in deployment secret manager.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
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
