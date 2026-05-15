# SmartTermin API

## Local development

- Base URL: `http://localhost:5271`
- Swagger UI: `http://localhost:5271/swagger`

## Authentication

Most protected endpoints use bearer-token authentication.

```http
Authorization: Bearer <jwt-token>
```

## Configuration

The API reads configuration from:

1. `api/SmartTermin.Api/appsettings.json`
2. Optional local overrides such as `appsettings.Local.json`
3. Environment variables

## Public integration notes

- Webhook, payment, SMS, email, and notification integrations require your own provider credentials.
- Firebase service-account files are intentionally excluded from the repository.
- Placeholder config values in the public repository must be replaced before real deployments.

## Suggested next step

Run the API locally and inspect the generated Swagger document for the full endpoint surface:

```bash
cd api
dotnet run --project SmartTermin.Api/SmartTermin.Api.csproj
```

Then open `http://localhost:5271/swagger`.
