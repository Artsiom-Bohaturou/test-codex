import events from '@demo/events'
import rabbitmq from '@demo/rabbitmq'
import { getClientPlugin } from '../plugins/index.js'

const { createDashboardPublishPostCommand } = events
const { connectRabbit, publishEvent } = rabbitmq

let channelPromise

async function getChannel() {
  if (!channelPromise) {
    channelPromise = connectRabbit().then(({ channel }) => channel)
  }
  return channelPromise
}

export async function publishDashboardPostCommand({ targetClient, title, content }) {
  const plugin = getClientPlugin(targetClient)
  if (!plugin) {
    throw new Error(`Unknown client plugin: ${targetClient}`)
  }

  const command = createDashboardPublishPostCommand({ targetClient, title, content })
  const channel = await getChannel()
  await publishEvent(channel, plugin.routingKey, command)
  return command
}
