const clientPlugins = [
  {
    id: 'payload-blog',
    label: 'Client Payload CMS blog',
    description: 'Demo Payload CMS client that consumes dashboard publish commands over RabbitMQ.',
    server: 'Server B / client-payload-server',
    confirmations: ['client.payload-blog.post.upserted'],
    routingKey: 'dashboard.client.payload-blog.post.publish.requested',
  },
  {
    id: 'wordpress-blog',
    label: 'Client WordPress blog',
    description: 'Demo WordPress client through the WordPress bridge. In production this bridge can call the WordPress REST API.',
    server: 'Server C / client-wordpress-server',
    confirmations: ['client.wordpress-blog.post.upserted'],
    routingKey: 'dashboard.client.wordpress-blog.post.publish.requested',
  },
]

export function getClientPlugins() {
  return clientPlugins
}

export function getClientPlugin(clientId) {
  return clientPlugins.find(plugin => plugin.id === clientId)
}
