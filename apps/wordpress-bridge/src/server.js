const express = require('express')
const axios = require('axios')
const { EVENT_TYPES, createEvent } = require('@demo/events')
const { connectRabbit, consumeEvents, publishEvent } = require('@demo/rabbitmq')

const PORT = process.env.PORT || 3002
const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'http://wordpress:80/wp-json/wp/v2/posts'
const WORDPRESS_CREATE_POST_URL = process.env.WORDPRESS_CREATE_POST_URL || 'http://wordpress:80/wp-json/cms-demo/v1/posts'
const WORDPRESS_BRIDGE_SECRET = process.env.WORDPRESS_BRIDGE_SECRET || 'local-demo-secret'
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 10000)
const SOURCE = 'wordpress-blog-client'
const seen = new Map()
let channel

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, '').trim()
}

async function publishWordPressPost(post) {
  const modified = post.modified_gmt || post.modified || post.date_gmt || post.date || new Date().toISOString()
  const previous = seen.get(String(post.id))
  if (previous === modified) return

  seen.set(String(post.id), modified)

  const event = createEvent({
    type: EVENT_TYPES.WORDPRESS_POST_UPSERTED,
    source: SOURCE,
    externalId: post.id,
    title: stripHtml(post.title && post.title.rendered) || `WordPress post ${post.id}`,
    content: stripHtml(post.excerpt && post.excerpt.rendered) || stripHtml(post.content && post.content.rendered),
    url: post.link,
    status: post.status,
    raw: { id: post.id, modified, link: post.link, status: post.status },
  })

  await publishEvent(channel, 'client.wordpress-blog.post.upserted', event)
  console.log(`[wordpress-bridge] published ${event.id}`)
}

async function createWordPressPost(command) {
  const response = await axios.post(WORDPRESS_CREATE_POST_URL, {
    title: command.data.title,
    content: command.data.content,
    status: command.data.status || 'publish',
  }, {
    headers: { 'X-CMS-Demo-Secret': WORDPRESS_BRIDGE_SECRET },
    timeout: 5000,
  })

  return response.data
}

async function handleDashboardCommand(command) {
  if (command.data.targetClient !== 'wordpress-blog') return

  const post = await createWordPressPost(command)
  await publishWordPressPost(post)
  console.log(`[wordpress-bridge] created WordPress post ${post.id} from dashboard command ${command.id}`)
}

async function pollWordPress() {
  try {
    const response = await axios.get(WORDPRESS_API_URL, {
      params: { per_page: 10, status: 'publish', orderby: 'modified', order: 'desc' },
      timeout: 5000,
    })

    for (const post of response.data) {
      await publishWordPressPost(post)
    }
  } catch (error) {
    console.warn(`[wordpress-bridge] waiting for WordPress REST API at ${WORDPRESS_API_URL}: ${error.message}`)
  }
}

async function main() {
  const rabbit = await connectRabbit()
  channel = rabbit.channel
  await consumeEvents(channel, {
    queue: 'wordpress-bridge.commands',
    bindings: ['dashboard.client.wordpress-blog.post.publish.requested'],
  }, handleDashboardCommand)

  const app = express()
  app.use(express.json())
  app.get('/', (_req, res) => res.json({ ok: true, wordpressApiUrl: WORDPRESS_API_URL, wordpressCreatePostUrl: WORDPRESS_CREATE_POST_URL, pollIntervalMs: POLL_INTERVAL_MS }))
  app.post('/webhooks/wordpress', async (req, res) => {
    await publishWordPressPost(req.body)
    res.json({ ok: true })
  })
  app.listen(PORT, () => console.log(`[wordpress-bridge] http://localhost:${PORT}`))

  await pollWordPress()
  setInterval(pollWordPress, POLL_INTERVAL_MS)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
