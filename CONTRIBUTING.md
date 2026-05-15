# Contributing to SmartTermin

Thanks for helping improve SmartTermin.

## Local setup

1. Install the prerequisites listed in [README.md](README.md).
2. Configure `web/.env.local`.
3. Create `api/SmartTermin.Api/appsettings.Local.json` from `api/SmartTermin.Api/appsettings.Local.json.example`, or use environment variables.

## Development expectations

- Keep pull requests focused and easy to review.
- Do not commit secrets, production credentials, or service-account files.
- Prefer small, well-named commits.
- Update documentation when behavior, setup, or public APIs change.

## Before opening a pull request

Run:

```bash
cd web && npm run build
cd ../api && dotnet build SmartTermin.sln
```

If your change affects API behavior, verify Swagger still loads and document the change in [`docs/API.md`](docs/API.md) when needed.
