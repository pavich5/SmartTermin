# SmartTermin

SmartTermin is a production-ready booking and business management platform for salons, studios, and independent beauty professionals. This repository is a cleaned public showcase of the project, with private infrastructure details and production secrets removed.

![SmartTermin preview](web/public/hero-image.png)

## Repository layout

```text
.
├── api/                      # ASP.NET Core API and domain projects
│   ├── SmartTermin.Api/
│   ├── SmartTermin.DataAccess/
│   ├── SmartTermin.DomainModels/
│   ├── SmartTermin.DTOs/
│   ├── SmartTermin.Helpers/
│   ├── SmartTermin.Mappers/
│   └── SmartTermin.Services/
├── web/                      # React + Vite web application
├── docs/                     # Public project documentation
├── .env.example              # Shared environment template
└── vercel.json               # Example Vercel deployment config for the web app
```

## Stack

- ASP.NET Core 6
- Entity Framework Core 6
- MySQL
- React 18
- TypeScript
- Vite
- Firebase Cloud Messaging
- Paddle
- Cloudinary

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+
- .NET SDK 6.0
- MySQL 8+

### 1. Clone and install

```bash
git clone https://github.com/pavich5/SmartTermin.git
cd SmartTermin
cd web && npm install
cd ../api && dotnet restore SmartTermin.sln
```

### 2. Configure environment

1. Copy [`web/.env.example`](web/.env.example) to `web/.env.local`.
2. Copy [`api/SmartTermin.Api/appsettings.Local.json.example`](api/SmartTermin.Api/appsettings.Local.json.example) to `api/SmartTermin.Api/appsettings.Local.json` if you prefer local overrides.
3. Replace every placeholder value with your own local or staging credentials.

Reference templates:

- Shared template: [`.env.example`](.env.example)
- Web template: [`web/.env.example`](web/.env.example)
- API config: [`api/SmartTermin.Api/appsettings.json`](api/SmartTermin.Api/appsettings.json)
- API local override template: [`api/SmartTermin.Api/appsettings.Local.json.example`](api/SmartTermin.Api/appsettings.Local.json.example)

### 3. Run locally

API:

```bash
cd api
dotnet run --project SmartTermin.Api/SmartTermin.Api.csproj
```

Web:

```bash
cd web
npm run dev
```

Default local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:5271`
- Swagger: `http://localhost:5271/swagger`

## Development workflow

```bash
cd web
npm run build

cd ../api
dotnet build SmartTermin.sln
```

- Keep secrets out of source control.
- Prefer `appsettings.Local.json` or deployment environment variables for private values.
- Use Swagger for API exploration during development.

## Deployment

### Web

- [`vercel.json`](vercel.json) shows a simple Vercel deployment setup for the `web/` app.
- Configure the `VITE_*` variables from [`web/.env.example`](web/.env.example) in your hosting provider.

### API

- Deploy `api/SmartTermin.Api` to your preferred ASP.NET Core host.
- Supply all secrets through environment variables or private configuration files not committed to git.
- Keep `PADDLE_API_KEY`, database credentials, SMTP credentials, and Firebase service-account files outside the repository.

## Documentation

- API guide: [`docs/API.md`](docs/API.md)

## License

This project is released under the [MIT License](LICENSE).
