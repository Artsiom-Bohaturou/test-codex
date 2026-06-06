# Distributed CMS architecture

This demo is intentionally runnable on one laptop, but the production shape should treat every CMS as a separate server or deployment boundary.

## Production topology

```txt
┌────────────────────────────────────────────────────────────────────┐
│ Shared infrastructure                                               │
│                                                                    │
│  RabbitMQ cluster / managed RabbitMQ                               │
│  Exchange: cms.events, type: topic                                 │
│  TLS endpoint: amqps://rabbitmq.example.com:5671                   │
└──────────────▲──────────────────────▲──────────────────────▲───────┘
               │ outbound AMQPS        │ outbound AMQPS        │ outbound AMQPS
               │                       │                       │
┌──────────────┴─────────────┐ ┌───────┴──────────────┐ ┌──────┴───────────────┐
│ Server A                   │ │ Server B             │ │ Server C             │
│ Main dashboard             │ │ Client Payload CMS   │ │ Client WordPress     │
│                            │ │                      │ │                      │
│ apps/main-dashboard        │ │ Payload/Next app     │ │ WordPress app        │
│ Dashboard Payload/Next app │ │ Client worker        │ │ WordPress bridge     │
│ Dashboard worker           │ │                      │ │ WordPress plugin     │
│ Queue: main-dashboard.*    │ │ Queue: client.*      │ │ Queue: wordpress.*   │
└────────────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

The important rule: **clients do not need to talk directly to each other**. Every server connects to RabbitMQ with its own credentials and only receives the routing keys it is allowed to consume.

## Server responsibilities

### Server A — main dashboard

Runs the central Payload/Next dashboard and a dashboard worker.

Responsibilities:

- Render all synced client posts.
- Store normalized copies or references in dashboard collections.
- Publish dashboard commands such as `dashboard.client.payload-blog.post.publish.requested`.
- Consume `client.*.post.upserted` confirmation/sync events.

Required environment:

```bash
RABBITMQ_URL=amqps://dashboard-user:***@rabbitmq.example.com:5671
RABBITMQ_EXCHANGE=cms.events
DASHBOARD_PUBLIC_URL=https://dashboard.example.com
```

### Server B — client Payload CMS

Runs the client-owned Payload/Next CMS and a worker/consumer next to it.

Responsibilities:

- Publish local content changes to RabbitMQ.
- Consume dashboard commands addressed to this client.
- Create/update posts in the local Payload CMS.
- Publish a confirmation event after the local write succeeds.

Example bindings:

```txt
Consume: dashboard.client.payload-blog.#
Publish: client.payload-blog.#
```

### Server C — client WordPress

Runs WordPress plus a bridge process. The bridge may be a Node service, PHP worker, or another small integration service.

Responsibilities:

- Poll or receive WordPress changes and publish normalized events.
- Consume dashboard commands addressed to WordPress.
- Call the WordPress REST API or a custom WordPress plugin to create posts.
- Publish a confirmation event after WordPress creates the post.

Example bindings:

```txt
Consume: dashboard.client.wordpress-blog.#
Publish: client.wordpress-blog.#
```

## Message flows

### Client CMS to dashboard

```txt
Client editor publishes post
  -> client worker/plugin normalizes post
  -> publish client.<client-id>.post.upserted
  -> RabbitMQ exchange cms.events
  -> dashboard queue main-dashboard.incoming
  -> dashboard upserts normalized synced post
```

### Dashboard to client CMS

```txt
Dashboard user creates post and selects plugin
  -> dashboard publishes dashboard.client.<client-id>.post.publish.requested
  -> RabbitMQ exchange cms.events
  -> selected client command queue
  -> client worker creates post in its local CMS
  -> client publishes client.<client-id>.post.upserted
  -> dashboard consumes confirmation and displays synced post
```

## Plugin contract

Each dashboard plugin represents a remote client server. A plugin should define:

- `id`: stable client identifier used in event data.
- `label`: human-readable client name.
- `server`: the production server/deployment where the client integration runs.
- `routingKey`: RabbitMQ command routing key for dashboard-to-client commands.
- `confirmations`: event patterns the dashboard expects back from the client.

Example:

```js
{
  id: 'payload-blog',
  label: 'Client Payload CMS blog',
  server: 'client-payload-server',
  routingKey: 'dashboard.client.payload-blog.post.publish.requested',
  confirmations: ['client.payload-blog.post.upserted'],
}
```

## Security and networking

- Use `amqps://` with TLS in production.
- Give every server its own RabbitMQ user and vhost permissions.
- Prefer outbound-only connections from client servers to RabbitMQ; avoid exposing client CMS admin APIs to the public internet.
- Restrict each client queue to only its own command routing keys.
- Sign webhooks and REST calls with HMAC or use platform-native credentials such as WordPress Application Passwords.
- Add dead-letter queues and retries for all command queues.
- Store idempotency keys such as `commandId`, `lastEventId`, `source`, and `externalId`.

## How the local Docker Compose maps to production

The local `docker-compose.yml` runs all servers on one Docker network only for development convenience:

```txt
local container main-dashboard     -> production Server A
local container client-payload-blog -> production Server B
local containers wordpress + bridge -> production Server C
local container rabbitmq           -> shared RabbitMQ/managed broker
```

When deploying for real, split those services onto separate hosts and point all of them at the same RabbitMQ endpoint.
