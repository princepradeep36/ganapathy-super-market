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

## Customer log-in (Google / Facebook)

Log in with e-mail works as soon as SMTP is set up (customers get a 6-digit code).
The Google and Facebook buttons only appear once their keys are in `.env`; run the
update command after adding them.

**Google** (console.cloud.google.com, signed in as the shop's Gmail):
1. Create a project, then *APIs & Services → OAuth consent screen*: External, app name
   TamilKadai, support e-mail, logo optional, authorised domain `tamilkadai.se`. Publish it.
2. *Credentials → Create credentials → OAuth client ID → Web application*.
   Authorised redirect URI: `https://tamilkadai.se/api/account/oauth/google/callback`
3. Put the values in `.env` as `GOOGLE_CLIENT_ID=` and `GOOGLE_CLIENT_SECRET=`.

**Facebook** (developers.facebook.com):
1. *Create app → Authenticate and request data from users with Facebook Login*.
2. *Facebook Login → Settings*: Valid OAuth redirect URI
   `https://tamilkadai.se/api/account/oauth/facebook/callback`
3. *App settings → Basic*: privacy policy URL `https://tamilkadai.se/info/privacy`,
   data deletion URL `https://tamilkadai.se/info/privacy`, app domain `tamilkadai.se`.
4. Switch the app to *Live*. Put *App ID* and *App secret* in `.env` as
   `FACEBOOK_APP_ID=` and `FACEBOOK_APP_SECRET=`.
