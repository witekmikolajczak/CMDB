# Running CMDB with Docker Compose for Development

## Quick Start

1. Copy `.env.example` to `.env` in `apps/api` and adjust as needed.
2. Run:

    docker compose up -d

3. Your app will be available at http://localhost:3000 (API) and http://localhost:5173 (Web).

4. Code changes are reflected instantly. To restart:

    docker compose up -d --build

## Details
- App code is bind-mounted for live reload.
- Postgres data is persisted in the `pgdata` volume.
- Default Postgres credentials: user `cmdb`, password `cmdb`, db `cmdb`.
- Change ports in `docker-compose.yml` if needed.
