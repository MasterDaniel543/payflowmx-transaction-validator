# SLA, SLO, SLI y Presupuesto de Errores — Transaction-Validator

## 1) SLA del servicio
- Objetivo externo (acordado con usuarios): `99.5%` de disponibilidad mensual.
- Medición: porcentaje de solicitudes servidas exitosamente en el mes.
- Fórmula (Prometheus, ventana 30 días):
  - `sum(increase(http_request_duration_seconds_count{status_code=~"2.."}[30d])) / sum(increase(http_request_duration_seconds_count[30d]))`

## 2) SLO internos
- Disponibilidad: `99.7%` semanal.
  - `sum(increase(http_request_duration_seconds_count{status_code=~"2.."}[7d])) / sum(increase(http_request_duration_seconds_count[7d]))`
- Latencia: `p95 < 250 ms` (rolling 5m, observado continuamente).
  - `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
- Cumplimiento de latencia (<250 ms) mensual: `>= 95%` de solicitudes bajo 250 ms.
  - `sum(increase(http_request_duration_seconds_count{status_code=~".*"}[30d]))` → total solicitudes
  - `sum(increase(http_request_duration_seconds_bucket{le="0.25"}[30d]))` → solicitudes ≤ 250 ms
  - SLI latencia mensual: `sum(increase(http_request_duration_seconds_bucket{le="0.25"}[30d])) / sum(increase(http_request_duration_seconds_count[30d]))`

## 3) SLI detallados y medibles
- SLI de disponibilidad (por ruta):
  - `sum(increase(http_request_duration_seconds_count{status_code=~"2.."}[7d])) by (path) / sum(increase(http_request_duration_seconds_count[7d])) by (path)`
- SLI de tasa de errores 5xx (global):
  - `sum(increase(http_request_duration_seconds_count{status_code=~"5.."}[7d])) / sum(increase(http_request_duration_seconds_count[7d]))`
- SLI de latencia p95 (por ruta):
  - `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, path))`
- SLI de cumplimiento de latencia (<250 ms) por ruta (mensual):
  - `sum(increase(http_request_duration_seconds_bucket{le="0.25"}[30d])) by (path) / sum(increase(http_request_duration_seconds_count[30d])) by (path)`

Notas de medición:
- Si la retención de Prometheus no alcanza 30 días, usar `7d` o `24h` para evidencias y extrapolar el cálculo mensual.
- Todas las métricas provienen del histograma/counter definido en la app (`http_request_duration_seconds_*`). Instrumentación: `FIN/src/app.js:28-37`.

## 4) Presupuesto de errores
- Para SLA `99.5%` mensual: presupuesto de errores = `0.5%` del tiempo del mes.
  - Mes de 30 días: `30 * 24 * 60 = 43,200` minutos.
  - Presupuesto de errores: `0.005 * 43,200 = 216` minutos/mes.
  - En porcentaje: `0.5%`.
- Para SLO semanal `99.7%`:
  - Semana: `7 * 24 * 60 = 10,080` minutos.
  - Presupuesto: `0.003 * 10,080 ≈ 30.24` minutos/semana.
- Alternativa por eventos (si no se mide downtime):
  - Presupuesto de eventos 5xx mensual: `sum(increase(http_request_duration_seconds_count[30d])) * 0.005`.
  - Incumplimiento si `sum(increase(http_request_duration_seconds_count{status_code=~"5.."}[30d]))` > presupuesto de eventos.

## 5) Justificación técnica (basada en el servicio real)
- Disponibilidad observada:
  - Consulta: `sum(increase(http_request_duration_seconds_count{status_code=~"2.."}[7d])) / sum(increase(http_request_duration_seconds_count[7d]))`
  - Comparar con SLO `99.7%`. Si < `99.7%`, se consumió presupuesto semanal (`≈30.24 min`).
- Latencia observada:
  - p95 (global): `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
  - Cumplimiento mensual <250 ms: `sum(increase(http_request_duration_seconds_bucket{le="0.25"}[30d])) / sum(increase(http_request_duration_seconds_count[30d]))` debe ser `≥ 95%`.
- Errores 5xx observados:
  - `sum(increase(http_request_duration_seconds_count{status_code=~"5.."}[7d])) / sum(increase(http_request_duration_seconds_count[7d]))`
  - Si aumenta, evaluar causas (endpoint `/fail` usado para pruebas vs errores reales).
- Evidencias recomendadas:
  - Capturas de Prometheus Graph con las consultas anteriores en ventanas `24h / 7d`.
  - Link “Share” de Prometheus con las consultas configuradas.
  - Correlación con Jaeger (traceId `X-Trace-Id`) y con logs Loki por `traceId`.

## Anexos (consultas rápidas)
- Disponibilidad mensual: `sum(increase(http_request_duration_seconds_count{status_code=~"2.."}[30d])) / sum(increase(http_request_duration_seconds_count[30d]))`
- Cumplimiento latencia <250 ms mensual: `sum(increase(http_request_duration_seconds_bucket{le="0.25"}[30d])) / sum(increase(http_request_duration_seconds_count[30d]))`
- Error rate 5xx mensual: `sum(increase(http_request_duration_seconds_count{status_code=~"5.."}[30d])) / sum(increase(http_request_duration_seconds_count[30d]))`
