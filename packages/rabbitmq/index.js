const amqp = require('amqplib')

const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'cms.events'

async function connectRabbit({ url = process.env.RABBITMQ_URL || 'amqp://app:app@localhost:5672' } = {}) {
  const connection = await amqp.connect(url)
  const channel = await connection.createChannel()
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true })

  return { connection, channel, exchange: EXCHANGE }
}

async function publishEvent(channel, routingKey, event) {
  const body = Buffer.from(JSON.stringify(event))
  return channel.publish(EXCHANGE, routingKey, body, {
    contentType: 'application/json',
    persistent: true,
    messageId: event.id,
    timestamp: Date.now(),
  })
}

async function consumeEvents(channel, { queue, bindings }, handler) {
  await channel.assertQueue(queue, { durable: true })

  for (const binding of bindings) {
    await channel.bindQueue(queue, EXCHANGE, binding)
  }

  await channel.consume(queue, async message => {
    if (!message) return

    try {
      const event = JSON.parse(message.content.toString())
      await handler(event, message)
      channel.ack(message)
    } catch (error) {
      console.error(`[rabbitmq] failed to process message from ${queue}`, error)
      channel.nack(message, false, false)
    }
  })
}

module.exports = {
  EXCHANGE,
  connectRabbit,
  publishEvent,
  consumeEvents,
}
