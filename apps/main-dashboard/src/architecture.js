export const distributedServers = [
  {
    name: 'Server A',
    title: 'Main dashboard',
    services: ['Payload/Next dashboard', 'Dashboard worker', 'main-dashboard.incoming queue'],
    publishes: ['dashboard.client.<client-id>.post.publish.requested'],
    consumes: ['client.*.post.upserted'],
  },
  {
    name: 'Server B',
    title: 'Client Payload CMS',
    services: ['Client Payload/Next app', 'Payload sync worker', 'client-payload-blog.commands queue'],
    publishes: ['client.payload-blog.post.upserted'],
    consumes: ['dashboard.client.payload-blog.#'],
  },
  {
    name: 'Server C',
    title: 'Client WordPress',
    services: ['WordPress', 'WordPress bridge', 'WordPress publisher plugin'],
    publishes: ['client.wordpress-blog.post.upserted'],
    consumes: ['dashboard.client.wordpress-blog.#'],
  },
]

export const sharedInfrastructure = {
  broker: 'RabbitMQ topic exchange cms.events',
  productionUrlExample: 'amqps://rabbitmq.example.com:5671',
  localUrl: 'amqp://app:app@rabbitmq:5672',
}
