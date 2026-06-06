import events from '@demo/events'
import rabbitmq from '@demo/rabbitmq'

const { EVENT_TYPES, createEvent } = events
const { connectRabbit, publishEvent } = rabbitmq

const SOURCE = 'payload-blog-client'
let channelPromise

async function getChannel() {
  if (!channelPromise) {
    channelPromise = connectRabbit().then(({ channel }) => channel)
  }
  return channelPromise
}

export async function publishPayloadPost(post) {
  const channel = await getChannel()
  const event = createEvent({
    type: EVENT_TYPES.PAYLOAD_CLIENT_POST_UPSERTED,
    source: SOURCE,
    externalId: post.id,
    title: post.title,
    content: post.content,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/posts/${post.id}`,
    raw: post,
  })

  await publishEvent(channel, 'client.payload-blog.post.upserted', event)
  return event
}
