# Migración de `environment.apiUrl` a Supabase

## Ya migrado en código

| Antes (Express) | Ahora |
|-----------------|--------|
| `GET/POST/DELETE .../performance/*` | `PerformanceService` → `supabase.from('BodyWeightRecord' \| 'ExerciseRecord')` |
| `POST .../access/scan` | `QrScannerComponent` → `supabase.functions.invoke('access-scan')` |
| IA vía nombres erróneos | `AiService` → `ai-chat`, `ai-save-plan`, `DELETE .../ai-sessions` |
| `localStorage.auth_token` en interceptor | `authInterceptor` → `supabase.auth.getSession().access_token` |

## Pendiente (otros servicios en `core/services`)

Muchos servicios siguen usando `HttpClient` + `environment.apiUrl`. Migración recomendada:

- Sustituir por `supabase.from('NombreTablaPrisma')` con RLS ya definida en `supabase/migrations/`, o
- Invocar Edge Functions nuevas (`machines-create`, `bulk-import`, etc.).

## Contrato Edge `access-scan`

Respuesta JSON: `{ success, type, message, user }` (igual que el controlador Express previo).
