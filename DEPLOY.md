# Deploying to the Hetzner server

The server runs the same `docker-compose.yml` plus `docker-compose.prod.yml`,
which adds Caddy in front for automatic HTTPS and hides port 3000.

## First time

```sh
git clone git@github.com:princepradeep36/ganapathy-super-market.git /opt/ganapathy-super-market
cd /opt/ganapathy-super-market
cp .env.example .env   # then fill in real values, SITE_URL=https://<domain>, INSECURE_COOKIES=0
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Updating after a push

```sh
cd /opt/ganapathy-super-market
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Switching to a new domain

1. Point the domain's `@` and `www` A records at the server's IPv4 address.
2. In `.env`, set `SITE_DOMAINS` to the new names and `SITE_URL=https://<domain>`.
3. Run the update command above. Caddy fetches the certificate by itself.

Database dumps are written nightly to `/opt/ganapathy-super-market/backups`.
