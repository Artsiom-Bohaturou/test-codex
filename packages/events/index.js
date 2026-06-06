const EVENT_TYPES = {
  PAYLOAD_CLIENT_POST_UPSERTED: 'client.payload-blog.post.upserted',
  WORDPRESS_POST_UPSERTED: 'client.wordpress-blog.post.upserted',
  DASHBOARD_POST_PUBLISH_REQUESTED: 'dashboard.post.publish.requested',
}

function createEvent({ type, source, externalId, title, content, url, status = 'published', raw = {} }) {
  if (!type || !source || !externalId || !title) {
    throw new Error('createEvent requires type, source, externalId, and title')
  }

  return {
    id: `${source}:${externalId}:${Date.now()}`,
    type,
    version: 1,
    occurredAt: new Date().toISOString(),
    source,
    data: {
      externalId: String(externalId),
      title,
      content: content || '',
      url: url || '',
      status,
      raw,
    },
  }
}

function createDashboardPublishPostCommand({ targetClient, title, content, status = 'published' }) {
  if (!targetClient || !title) {
    throw new Error('createDashboardPublishPostCommand requires targetClient and title')
  }

  const commandId = `dashboard:${targetClient}:${Date.now()}`

  return {
    id: commandId,
    type: EVENT_TYPES.DASHBOARD_POST_PUBLISH_REQUESTED,
    version: 1,
    occurredAt: new Date().toISOString(),
    source: 'main-dashboard',
    data: {
      commandId,
      targetClient,
      title,
      content: content || '',
      status,
    },
  }
}

function normalizeForDashboard(event) {
  return {
    id: `${event.source}:${event.data.externalId}`,
    source: event.source,
    externalId: event.data.externalId,
    title: event.data.title,
    content: event.data.content,
    url: event.data.url,
    status: event.data.status,
    lastEventId: event.id,
    updatedAt: event.occurredAt,
  }
}

module.exports = {
  EVENT_TYPES,
  createEvent,
  createDashboardPublishPostCommand,
  normalizeForDashboard,
}
