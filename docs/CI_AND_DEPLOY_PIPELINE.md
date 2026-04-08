# CI and deploy pipeline — optimization notes

This document explains **workflow changes** made to reduce GitHub Actions time and runner cost, and to speed production Docker builds on the VPS. Use it when reviewing or onboarding.

**Source of truth:** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) and [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

---

## Summary

| Change                                              | Where                                     | Why                                                                                                     |
| --------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Single CI job instead of two sequential jobs        | `ci.yml`                                  | One checkout, one `pnpm install`, one runner per PR — less wall time and fewer billable minutes.        |
| `permissions: actions: write`                       | `ci.yml`, `deploy.yml`                    | Required so Docker BuildKit can **write** GitHub Actions cache entries when using `cache-to: type=gha`. |
| Docker Buildx + `build-push-action` with GHA cache  | `ci.yml`, `deploy.yml` (`build-server`)   | Reuses image layers between runs when the Dockerfile and copied files are unchanged.                    |
| `docker compose build` **without** `--no-cache`     | `deploy.yml` (SSH “Deploy server” script) | Lets the production host reuse Docker layer cache between deploys when inputs are unchanged.            |
| Path filters + `build-client` / `build-server` jobs | `deploy.yml`                              | Deploy only the side that changed (with shared/workspace rules); server deploy uses `server/releases`.  |

---

## 1. Consolidated CI job (`ci.yml`)

### Before

- Job **Lint & Type Check**: checkout → pnpm → Node → `pnpm install` → format / lint / typecheck.
- Job **Build**: same setup again → `pnpm install` → `pnpm build` → `docker build`.

The second job waited on the first (`needs:`), so every PR paid for **two** runner startups and **two** dependency installs (the pnpm store cache still helped, but setup and install were duplicated).

### After

- One job **`ci`** (display name **CI**) runs everything in order:
  1. Checkout
  2. Setup pnpm + Node (with `cache: pnpm`)
  3. `pnpm install --frozen-lockfile`
  4. `pnpm format:check`
  5. `pnpm lint`
  6. `pnpm typecheck`
  7. `pnpm build`
  8. Docker verify (see below)

### Why it is safe

- The same commands still run; only **parallelism between jobs** was removed. Failures still fail the workflow at the step that broke.
- **Branch protection:** If the repo required two status checks named like “Lint & Type Check” and “Build”, you must update protection to require the single check **CI** (or whatever you set as the job `name:`).

---

## 2. Workflow `permissions` (`ci.yml`, `deploy.yml`)

Both workflows declare:

```yaml
permissions:
  contents: read
  actions: write
```

### Why

- **`contents: read`** — checkout and read the repo (minimal access).
- **`actions: write`** — BuildKit’s **GitHub Actions cache** backend (`type=gha`) needs permission to **store** cache metadata and blobs for `cache-to`. Without this, cache export can fail or be skipped depending on org defaults.

### Deploy workflow

- The **`deploy`** job only uses SSH and artifacts; it does not need `actions: write` for its own steps. The permission is declared at **workflow** level, so it applies to all jobs. That is slightly broader than the minimum for the deploy job alone, but keeps the file simple and matches what **`build-server`** needs for Docker GHA cache.

---

## 3. Docker verify: Buildx + GHA cache (`ci.yml`, `deploy.yml`)

### Before

- Verify step: `docker build -f server/Dockerfile .`
- No layer cache between workflow runs (each run rebuilt from scratch unless the host had local cache, which GHA runners do not persist for classic `docker build`).

### After

1. **`docker/setup-buildx-action@v3`** — installs a Buildx builder (BuildKit).
2. **`docker/build-push-action@v6`** with:
   - **`context: .`**, **`file: server/Dockerfile`** — same image as before.
   - **`push: false`** — image is not pushed to a registry.
   - **`load: true`** — load the built image into the local Docker engine so the step still proves the image **builds** (multi-platform `load` limits still apply; default Linux amd64 on `ubuntu-latest` is fine).
   - **`tags: regionify-server:ci`** — local tag for the loaded image (not pushed).
   - **`cache-from: type=gha`** / **`cache-to: type=gha,mode=max`** — read/write BuildKit cache in GitHub Actions cache.

### Why it is safe

- Same Dockerfile and context as production and as the old `docker build` command.
- **`mode=max`** caches more intermediate layers (better hit rate, slightly larger cache entries).

### Caches are separate per workflow

- PR **CI** and **Deploy to Production** each maintain their own GHA cache scope (different workflow files). That is expected: both benefit independently.

### Fork pull requests

- Workflows triggered from **forks** often receive a **read-only** `GITHUB_TOKEN`. Saving cache (`cache-to`) may fail or be restricted. The **image build** should still succeed; if a fork PR ever fails on the cache step, investigate token permissions or temporarily rely on `cache-from` only (not implemented by default).

---

## 4. Production server: `docker compose build` without `--no-cache` (`deploy.yml`)

### Before (remote script over SSH)

```bash
docker compose -f docker-compose.prod.yml build --no-cache server
```

`--no-cache` forced Docker to **ignore** layer cache on every deploy, so every deploy did a full rebuild (more CPU, time, and disk I/O on the VPS).

### After

```bash
docker compose -f docker-compose.prod.yml build server
```

### Why it is safe

- Layers are still invalidated when **inputs to a `COPY` or `RUN` change** (normal Docker behavior).
- **`--no-cache`** is mainly for debugging suspected stale caches. If you ever need it, run a **one-off** manual build on the server with `--no-cache`.

### Unchanged around it

- Still: extract tarball under `$APP_DIR/server/releases/<sha>` → symlink `server/current` → install `.env.production` at `$APP_DIR/server/.env.production` → `cd server/current` → `docker compose build server` → `docker compose down server` → `docker compose up -d` → `docker image prune -f`.

---

## Quick reference: files touched

| File                                                              | Role                                                                                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)         | PR CI: lint, typecheck, build, Docker verify with GHA cache.                                                      |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | Push to `master`: path filters, conditional client/server builds, SSH deploy (server under `server/current`).     |
| [`server/Dockerfile`](../server/Dockerfile)                       | Image built in CI (`build-server`) and on the server.                                                             |
| [`docker-compose.prod.yml`](../docker-compose.prod.yml)           | Top-level `name:` for stable volumes; `env_file` points at `server/.env.production` relative to each release dir. |

---

## Optional follow-ups (not done here)

- **Pre-built images:** Push to a registry from CI and `docker compose pull` on the server — avoids building on the VPS entirely, but adds registry auth and operational complexity.
- **Persistent BuildKit cache on the VPS** — further speedups for server-side builds; more setup than removing `--no-cache`.
