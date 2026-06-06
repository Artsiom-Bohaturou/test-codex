import events from '@demo/events'
import rabbitmq from '@demo/rabbitmq'
import { getDashboardPayload } from './lib/payload.js'

const { normalizeForDashboard } = events
const { connectRabbit, consumeEvents } = rabbitmq

async function upsertPostFromEvent(event) {
  const payload = await getDashboardPayload()
  const post = normalizeForDashboard(event)
  const existing = await payload.find({
    collection: 'synced-posts',
    where: {
      and: [
        { source: { equals: post.source } },
        { externalId: { equals: post.externalId } },
      ],
    },
    limit: 1,
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'synced-posts',
      id: existing.docs[0].id,
      data: post,
    })
  } else {
    await payload.create({
      collection: 'synced-posts',
      data: post,
    })
  }

  console.log(`[main-dashboard worker] synced ${post.source} post ${post.externalId}: ${post.title}`)
}

async function main() {
  const { channel } = await connectRabbit()
  await consumeEvents(channel, {
    queue: 'main-dashboard.incoming',
    bindings: ['client.*.post.upserted'],
  }, upsertPostFromEvent)
  console.log('[main-dashboard worker] waiting for client.*.post.upserted')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
