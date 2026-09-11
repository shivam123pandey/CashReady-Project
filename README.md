# React + TypeScript + Vite

## Cash availability backend

The map uses OpenStreetMap for nearby ATM locations. Cash availability must come from a bank or ATM-network provider, so the project includes a server-side proxy at `/api/atm-status`. Provider credentials are never exposed to the browser.

1. Copy `.env.example` to `.env`.
2. Set `ATM_PROVIDER_URL` and `ATM_PROVIDER_API_KEY` from your provider.
3. Start the frontend and API together:

```bash
npm run dev
```

The provider endpoint should accept `latitude`, `longitude`, and `radius` query parameters and return JSON in this shape:

```json
{
  "available": true,
  "status": "cash_available",
  "lastUpdated": "2026-09-08T10:00:00Z"
}
```

Without a configured provider, the UI intentionally displays `Cash status unavailable`; it does not fabricate a cash balance.

## Demo authentication

The API seeds local demo accounts on first login:

- Customer: `customer@cashready.test` / `Customer@123`
- Banker: `banker@cashready.test` / `Banker@123`

Login requests are handled by `POST /api/auth/login`. Passwords are stored as scrypt hashes in the ignored `server/data/users.json` file. Replace this local store with a managed database before production deployment.

Banker analytics are loaded from `GET /api/banker/dashboard` using the bearer token returned by login. The endpoint only accepts users with the `banker` role and returns the KPI, cash trend, ATM health, replenishment queue, and recent activity data shown on the dashboard.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
