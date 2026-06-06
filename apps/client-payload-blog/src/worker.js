import rabbitmq from '@demo/rabbitmq'
import { getClientPayload } from './lib/payload.js'

const { connectRabbit, consumeEvents } = rabbitmq

async function handleDashboardCommand(command) {
  if (command.data.targetClient !== 'payload-blog') return

  const payload = await getClientPayload()
  const post = await payload.create({
    collection: 'posts',
    data: {
      title: command.data.title,
      content: command.data.content,
      origin: 'main-dashboard',
      externalCommandId: command.data.commandId,
    },
  })

  console.log(`[client-payload-blog worker] created Payload post ${post.id} from dashboard command ${command.id}`)
}

async function main() {
  const { channel } = await connectRabbit()
  await consumeEvents(channel, {
    queue: 'client-payload-blog.commands',
    bindings: ['dashboard.client.payload-blog.post.publish.requested'],
  }, handleDashboardCommand)
  console.log('[client-payload-blog worker] waiting for dashboard.client.payload-blog.post.publish.requested')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
