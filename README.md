# CMS RabbitMQ local demo

This repository is a small local example of the architecture you described:

- **Main Payload CMS dashboard**: `main-dashboard` receives normalized content events from client CMSs and can send publish commands back to a selected client.
- **Client Payload CMS blog**: `client-payload-blog` represents a client-owned Payload CMS blog. It publishes local post events and consumes dashboard publish commands.
- **Client WordPress blog**: the official WordPress Docker image runs locally with a local demo publisher plugin, while `wordpress-bridge` polls its REST API, accepts webhook posts, and consumes dashboard publish commands.
- **RabbitMQ**: `rabbitmq` is the message bus between all CMS systems.
- **Client plugins**: `apps/main-dashboard/src/plugins/index.js` is the dashboard plugin registry. Add another plugin entry and a matching consumer queue to connect another CMS later.
- **Distributed architecture**: every CMS is designed to run on a different server; the local Docker Compose file only simulates those servers on one network for development.

> The JavaScript CMS systems in this demo are now real Next.js + Payload CMS applications. The main dashboard stores synced posts in a Payload collection, and the client Payload blog stores posts in its own Payload collection. RabbitMQ consumers run as separate worker processes next to each app because long-running queue consumers should not live in normal Next.js request handlers.

## Architecture

Detailed production architecture is documented in [`docs/architecture.md`](docs/architecture.md). The running dashboard also exposes an architecture page at <http://localhost:3000/architecture>.

In production, split the demo into separate deployment boundaries:

- **Server A**: main dashboard Payload/Next app and dashboard worker.
- **Server B**: client Payload CMS app and client worker.
- **Server C**: client WordPress, WordPress bridge, and WordPress plugin.
- **Shared infrastructure**: RabbitMQ cluster or managed RabbitMQ reachable by all servers over TLS.


```txt
Client Payload blog form
  -> client.payload-blog.post.upserted
  -> RabbitMQ topic exchange cms.events
  -> main-dashboard.incoming queue
  -> Main dashboard aggregated posts

WordPress REST API
  -> wordpress-bridge polling/webhook
  -> client.wordpress-blog.post.upserted
  -> RabbitMQ topic exchange cms.events
  -> main-dashboard.incoming queue
  -> Main dashboard aggregated posts

Main dashboard create-post form
  -> selected dashboard client plugin
  -> dashboard.client.<client>.post.publish.requested
  -> RabbitMQ topic exchange cms.events
  -> selected client command queue
  -> client creates/publishes the post
  -> client emits a normal client.*.post.upserted event
  -> main-dashboard.incoming queue
  -> Main dashboard aggregated posts
```

## Run locally

Start the whole stack:

```bash
docker compose up --build
```

Open:

- Main dashboard: <http://localhost:3000>
- Client Payload CMS blog: <http://localhost:3001>
- WordPress: <http://localhost:8080>
- RabbitMQ management UI: <http://localhost:15672> with `app` / `app`
- WordPress bridge health: <http://localhost:3002>

## Try the client-to-dashboard flows

### Payload CMS client flow

1. Open <http://localhost:3001>.
2. Submit the post form.
3. Open <http://localhost:3000>.
4. The new client blog post should appear in the main dashboard.

### WordPress flow

1. Open <http://localhost:8080/wp-admin> and sign in with `admin` / `admin`.
2. Create and publish a WordPress post.
3. Wait up to 10 seconds for `wordpress-bridge` to poll `/wp-json/wp/v2/posts`.
4. Open <http://localhost:3000> and confirm the WordPress post appears.

You can also send a fake WordPress webhook directly:

```bash
curl -X POST http://localhost:3002/webhooks/wordpress \
  -H 'Content-Type: application/json' \
  -d '{
    "id": 123,
    "status": "publish",
    "link": "http://localhost:8080/example-post",
    "modified_gmt": "2026-06-06T10:00:00",
    "title": { "rendered": "Webhook WordPress post" },
    "excerpt": { "rendered": "This arrived through the WordPress bridge webhook." }
  }'
```

## Try the dashboard-to-client publishing flow

1. Open the main dashboard at <http://localhost:3000>.
2. In **Create post on a client CMS**, choose one installed client plugin:
   - `Client Payload CMS blog`
   - `Client WordPress blog`
3. Enter a title and content.
4. Click **Publish to selected client**.
5. The dashboard publishes a RabbitMQ command to the selected plugin routing key.
6. The selected client consumes that command and emits a normal `client.*.post.upserted` event.
7. Refresh <http://localhost:3000> and the post should appear in the aggregated post table.

For the Payload CMS client, the post is also visible in the local client UI at <http://localhost:3001>. For WordPress, the bridge calls the local `cms-demo-local-publisher` WordPress plugin, which creates a real WordPress post and returns the normalized REST payload.

## Plugin model

The dashboard does not hard-code every client publishing route in the form. Instead, it reads installed clients from `apps/main-dashboard/src/plugins/index.js`.

Each plugin entry represents a remote CMS server and contains:

```js
{
  id: 'payload-blog',
  label: 'Client Payload CMS blog',
  description: 'Demo Payload CMS client that consumes dashboard publish commands over RabbitMQ.',
  server: 'Server B / client-payload-server',
  confirmations: ['client.payload-blog.post.upserted'],
  routingKey: 'dashboard.client.payload-blog.post.publish.requested',
}
```

To add a future client CMS:

1. Add a plugin entry with a stable `id`, `server`, `routingKey`, and expected `confirmations`.
2. Deploy a worker/bridge on that client's server that binds its command queue to the same routing key.
3. Convert `dashboard.post.publish.requested` commands into that CMS's native create-post operation.
4. After the post is created, publish a `client.<client>.post.upserted` event so the dashboard can confirm and aggregate it.

The included WordPress implementation demonstrates this pattern with a small local-only plugin at `apps/wordpress-plugin/cms-demo-local-publisher/cms-demo-local-publisher.php`. It exposes `POST /wp-json/cms-demo/v1/posts` for the bridge and protects the endpoint with `X-CMS-Demo-Secret`.

## How to adapt this to real Payload CMS + Next.js apps

The local demo already uses the same shape recommended for production: Next.js + Payload CMS apps plus adjacent RabbitMQ worker processes. For production, move the apps to separate servers and keep the same event package and RabbitMQ package.

Recommended production structure for each Payload CMS server:

```txt
apps/
  web/       # Next.js + Payload CMS
  worker/    # RabbitMQ consumers and sync jobs
packages/
  events/    # shared event contract
  rabbitmq/  # RabbitMQ connection/publish helpers
```

In the client Payload blog, publish from a collection hook. The local demo does this in `apps/client-payload-blog/src/collections/Posts.js`:

```js
export const Posts = {
  slug: 'posts',
  hooks: {
    afterChange: [async ({ doc, operation }) => {
      if (!['create', 'update'].includes(operation)) return doc
      await publishPayloadPost(doc)
      return doc
    }],
  },
}
```

In the main Payload dashboard, keep RabbitMQ consumers and dashboard command publishers in workers/services instead of long-running Next.js request handlers. The worker should:

1. Consume `main-dashboard.incoming`.
2. Bind to `client.*.post.upserted`.
3. Validate the event shape.
4. Upsert a local Payload collection, for example `syncedPosts`.
5. Store external mappings like `source`, `externalId`, and `lastEventId` for idempotency.

## Important next steps for a production version

- Replace the local WordPress demo secret with HMAC validation or WordPress Application Password authentication.
- Add authentication/authorization around dashboard publishing.
- Add dead-letter queues and retry queues.
- Add runtime schema validation with Zod or another validator.
- Add idempotency checks before writing to Payload or WordPress.
- Decide the source of truth for each content type.
- Prevent sync loops by including `source` and `lastEventId` metadata.
