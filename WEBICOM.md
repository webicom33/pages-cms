# Istanza Pages CMS di Webicom

Fork di pages-cms/pages-cms, installato da Webicom su Google Cloud Run (progetto `webicom-cms`,
servizio `webicom-cms`, regione `europe-west1`) all'indirizzo https://cms.webicom.it.

- **Copia locale canonica**: `~/Projects/pages-cms-webicom` (unica; nessun'altra cartella è l'istanza in produzione).
- **Procedura, stato e manutenzione**: `webicom lab/tasks/todo-cms-self-host.md`.
- **Segreti**: in Google Secret Manager (`cms-*`), caricati con `node scripts/env-to-secrets.mjs`
  da `.env.production` (gitignored). Mai nel repo.
- **Aggiornare**: `git fetch upstream && git merge upstream/main`, poi migrazioni e deploy (vedi todo).
