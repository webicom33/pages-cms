# Istanza Pages CMS di Webicom

Fork di pages-cms/pages-cms, installato da Webicom su Google Cloud Run (progetto `webicom-cms`,
servizio `webicom-cms`, regione `europe-west1`) all'indirizzo https://cms.webicom.it.

- **Copia locale canonica**: `~/Projects/pages-cms-webicom` (unica; nessun'altra cartella è l'istanza in produzione).
- **Procedura, stato e manutenzione**: `webicom lab/tasks/todo-cms-self-host.md`.
- **Segreti**: in Google Secret Manager (`cms-*`), caricati con `node scripts/env-to-secrets.mjs`
  da `.env.production` (gitignored). Mai nel repo.
- **Aggiornare**: `git fetch upstream && git merge upstream/main`, poi migrazioni e deploy (sotto).

## Deploy (Cloud Run)

```
S=""; for k in DATABASE_URL BETTER_AUTH_SECRET CRYPTO_KEY GITHUB_APP_ID GITHUB_APP_NAME GITHUB_APP_PRIVATE_KEY GITHUB_APP_WEBHOOK_SECRET GITHUB_APP_CLIENT_ID GITHUB_APP_CLIENT_SECRET SMTP_USER SMTP_PASSWORD; do n="cms-$(echo $k | tr 'A-Z_' 'a-z-')"; S="$S${S:+,}${k}=${n}:latest"; done
gcloud run deploy webicom-cms --source . --project webicom-cms --region europe-west1 \
  --allow-unauthenticated --min-instances 0 --max-instances 2 --memory 1Gi \
  --set-secrets "$S" \
  --set-env-vars "BASE_URL=https://cms.webicom.it,EMAIL_PROVIDER=smtp,SMTP_HOST=smtp-relay.brevo.com,SMTP_PORT=587,EMAIL_FROM=Webicom CMS <noreply@webicom.it>,POSTGRES_MAX_CONNECTIONS=1" \
  --set-build-env-vars "BASE_URL=https://cms.webicom.it,BETTER_AUTH_SECRET=build-only-placeholder-not-used-at-runtime-0000,GOOGLE_NODE_RUN_SCRIPTS=build:cloudrun"
```

- In zsh scrivere `${n}` e non `$n:latest`: `:l` è un modificatore zsh e mangia la `l`.
- `build:cloudrun` = `next build` senza il `postbuild` upstream (lancia le migrazioni e fallisce in
  Cloud Build). Le migrazioni si lanciano a parte dal Mac: `npm run db:migrate` (legge `.env.production`).
- Fix al manifest GitHub App in `scripts/setup-github-app.mjs`: GitHub rifiuta `secret` e
  `email_addresses`; Email addresses: Read-only va messo a mano nelle impostazioni dell'app.
