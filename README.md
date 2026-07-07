# Trace QA

A GitHub App that uses AI to review pull requests and run ephemeral Playwright tests on demand.

## What it does

- **PR analysis** — On open, sync, or reopen, fetches the diff and posts a comment with likely bugs, missing edge cases, affected user flows, and suggested tests.
- **On-demand test runs** — Comment `/run-trace-qa` on a PR to generate a Playwright spec from the diff, dispatch a GitHub Actions workflow, and post results when the run completes.
- **Failure analysis** — When tests fail, summarizes failures and suggests fixes in a PR comment.

## How it works

```
PR opened/synced  →  LLM analysis  →  PR comment
PR comment /run-trace-qa  →  generate spec  →  GitHub Actions (trace-qa.yml)  →  results comment
```

The generated Playwright spec is passed to CI as a workflow input — it is never committed to the target repo.

## Setup

### 1. Create a GitHub App

Configure webhook URL (`/api/github/webhook`), subscribe to `pull_request`, `issue_comment`, `workflow_run`, `push`, and `installation` events, and grant read/write access to pull requests, issues, actions, and contents.

### 2. Add the workflow to target repos

Copy [`.github/workflows/trace-qa.yml`](.github/workflows/trace-qa.yml) into each repo you want to test.

### 3. Configure environment variables

```bash
# GitHub App
GITHUB_APP_ID=
GITHUB_APP_SLUG=          # e.g. trace-qa
GITHUB_PRIVATE_KEY=       # PEM contents, or use GITHUB_PRIVATE_KEY_PATH
GITHUB_WEBHOOK_SECRET=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini  # optional
```

### 4. Run locally

```bash
npm install
npm run dev
```

Expose the webhook endpoint (e.g. with ngrok) so GitHub can reach `http://localhost:3000/api/github/webhook`.

## Development

```bash
npm run dev      # start Next.js
npm run build    # production build
npm run lint     # eslint
npx playwright test  # run local Playwright tests
```

## Project structure

```
app/                  Next.js app and webhook API route
lib/analysis/         LLM analysis and Playwright spec generation
lib/github/           GitHub App client, PR helpers, webhook handlers
.github/workflows/    trace-qa.yml — CI workflow dispatched into target repos
tests/                Local and generated Playwright specs
```
