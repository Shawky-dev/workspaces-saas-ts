# Demo Tenant Logins

Use these accounts after running `POST /api/demo/load`.

| Tenant | Slug | Admin Email | Password |
| --- | --- | --- | --- |
| WorkSpaceOnUs | `workspace-on-us` | `admin@workspaceonus.test` | `Password123!` |
| ComfortZone | `comfort-zone` | `admin@comfortzone.test` | `Password123!` |

Tenant login API:

```http
POST /api/auth/{tenantSlug}/login
```

Example:

```json
{
  "email": "admin@workspaceonus.test",
  "password": "Password123!"
}
```
