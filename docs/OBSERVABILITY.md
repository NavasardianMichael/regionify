# Observability Stack: Grafana + Loki + Promtail

Centralized log aggregation for all Regionify Docker containers (server, postgres, redis). Promtail collects container stdout/stderr via the Docker socket, enriches Pino JSON logs with human-readable labels, and ships them to Loki. Grafana provides dashboards and alerting.

## Architecture

```
regionify-server  ─┐
regionify-postgres ─┼─ stdout/stderr ─▶ Promtail ─▶ Loki ─▶ Grafana
regionify-redis   ─┘                   (Docker SD)
```

- **Loki** — log store, TSDB v13, filesystem. No full-text index; uses labels for efficient filtering.
- **Promtail** — scrapes Docker container logs, parses Pino numeric levels (10→trace … 60→fatal), marks payment/order events with `important="true"` for long-term retention.
- **Grafana** — pre-provisioned with Loki datasource and Regionify dashboard.

## Log Retention

| Log type                                    | Retention |
| ------------------------------------------- | --------- |
| All logs (default)                          | 30 days   |
| `{important="true"}` — payment/order events | 1 year    |

The `important` label is set automatically by Promtail when the `action` field in a Pino log matches a business-critical action (see [Extending important-event detection](#extending-important-event-detection)).

## Environment Variables

All monitoring variables are consumed by the **Grafana container only** — none affect the application server or belong in `server/.env`.

Set these as shell exports before running `docker compose -f docker-compose.prod.yml up -d` (same convention as `REGIONIFY_ENV_FILE`).

### Required

| Variable                 | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin account password                                             |
| `GRAFANA_ROOT_URL`       | Full public URL of Grafana, e.g. `https://logs.regionify.mnavasardian.com` |

### Optional — ports

| Variable       | Default | Description                                                    |
| -------------- | ------- | -------------------------------------------------------------- |
| `GRAFANA_PORT` | `8002`  | Host port Grafana binds to (dev: `0.0.0.0`; prod: `127.0.0.1`) |

### Optional — email alerting

| Variable               | Default              | Description                                   |
| ---------------------- | -------------------- | --------------------------------------------- |
| `GF_SMTP_ENABLED`      | `false`              | Set to `true` to enable email alerts          |
| `GF_SMTP_HOST`         | `smtp.gmail.com:587` | SMTP host:port                                |
| `GF_SMTP_USER`         | _(empty)_            | SMTP username / Gmail address                 |
| `GF_SMTP_PASSWORD`     | _(empty)_            | SMTP password or Gmail app password           |
| `GF_SMTP_FROM_ADDRESS` | _(empty)_            | Sender email address for Grafana alert emails |

Gmail app passwords (free, 500 emails/day): [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

### Development — no new env vars

Dev Grafana uses hardcoded `admin/admin` and anonymous viewer access. SMTP is commented out. Nothing is added to `.env.development.local`.

### GitHub Secrets — no changes

The monitoring stack is fully server-side. The CI/CD pipeline is unchanged.

---

## Dev Setup

```bash
# Start everything (postgres, redis, loki, promtail, grafana)
docker compose up -d

# Open Grafana
open http://localhost:8002   # admin / admin
```

- Logs appear within ~5 seconds of first container activity.
- Explore → Loki → `{job="docker"}` to browse all logs.
- Promtail target status: http://localhost:9080/targets (Loki is internal-only, not exposed on the host)

---

## Production Setup

### 1. Export env vars

```bash
export GRAFANA_ADMIN_PASSWORD=<secure-password>
export GRAFANA_ROOT_URL=https://logs.regionify.mnavasardian.com

# Optional — email alerts:
export GF_SMTP_ENABLED=true
export GF_SMTP_USER=your@gmail.com
export GF_SMTP_PASSWORD=<gmail-app-password>
export GF_SMTP_FROM_ADDRESS=your@gmail.com
```

### 2. Start the stack

```bash
cd "$APP_DIR/server/current"
export REGIONIFY_ENV_FILE="$APP_DIR/server/.env.production"
docker compose -f docker-compose.prod.yml up -d
```

### 3. Verify log shipping

```bash
docker exec regionify-promtail wget -qO- http://loki:3100/ready
# Expected: ready
```

### 4. DNS — add an A record at your DNS provider

```
logs.regionify.mnavasardian.com  →  <server IP>
```

### 5. Nginx — create `/etc/nginx/sites-available/grafana`

```nginx
server {
    server_name logs.regionify.mnavasardian.com;

    location / {
        proxy_pass         http://127.0.0.1:8002;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
    }
}
```

Enable and issue SSL cert (certbot auto-adds HTTPS redirect):

```bash
sudo ln -s /etc/nginx/sites-available/grafana /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d logs.regionify.mnavasardian.com
```

### 6. Configure email alert contact point (Grafana UI, first time only)

1. Log in at `https://logs.regionify.mnavasardian.com`
2. **Alerting → Contact points** → Edit `grafana-default-email` → add your email address
3. **Alerting → Alert rules** → New rule:
   - Query: `sum(count_over_time({level="fatal"}[5m])) > 0`
   - Condition: IS ABOVE 0
   - Notify via: the contact point you configured

---

## Grafana Dashboard

The pre-provisioned **Regionify** dashboard (`monitoring/grafana/dashboards/regionify.json`) includes:

| Panel                 | Query                                            | Purpose                  |
| --------------------- | ------------------------------------------------ | ------------------------ |
| Active Errors (5 min) | `count_over_time({level=~"error\|fatal"}[5m])`   | Immediate error signal   |
| Fatal Errors (1 hr)   | `count_over_time({level="fatal"}[1h])`           | Critical failures        |
| Business Events       | `count_over_time({important="true"}[$__range])`  | Payment/order activity   |
| Log Volume by Level   | `sum by (level) (count_over_time(...[$__auto]))` | Traffic and error trends |
| HTTP Request Rate     | Parsed from pino-http JSON: 2xx / 4xx / 5xx      | Request health           |
| Log Stream            | `{service=~"$service"}`                          | Full live log viewer     |

The `$service` variable filters by container (server, postgres, redis or all).

---

## Extending Important-Event Detection

Add new business-critical action names to the template stage in **both** Promtail configs:

- [`monitoring/promtail/promtail-config.yml`](../monitoring/promtail/promtail-config.yml) (dev)
- [`monitoring/promtail/promtail-prod-config.yml`](../monitoring/promtail/promtail-prod-config.yml) (prod)

```yaml
- template:
    source: action
    template: |-
      {{- if or
        (eq .Value "payment_completed")
        (eq .Value "payment_failed")
        (eq .Value "order_created")
        (eq .Value "subscription_created")
        (eq .Value "subscription_cancelled")
        (eq .Value "your_new_action_here")   # ← add here
      -}}true{{- end -}}
```

Then log from the server using the `action` field:

```typescript
logger.info({ userId, orderId, action: 'order_created' }, 'Order created');
```

Restart Promtail after config changes:

```bash
# Dev
docker compose restart promtail

# Prod
docker compose -f docker-compose.prod.yml restart promtail
```

---

## Querying Logs

LogQL quick reference for Grafana Explore:

```logql
# All logs from the server
{service="server"}

# Errors only
{service="server", level="error"}

# Payment events (preserved 1 year)
{important="true"}

# HTTP 5xx responses (parsed from pino-http JSON)
{service="server"} | json | res_statusCode =~ "5.."

# Logs containing a specific user ID
{service="server"} |= "user-id-here"

# Logs in the last 10 minutes
{service="server"} | json | level="error"
```
