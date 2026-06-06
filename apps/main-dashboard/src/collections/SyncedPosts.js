export const SyncedPosts = {
  slug: 'synced-posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'source', 'externalId', 'updatedAt'],
  },
  fields: [
    { name: 'source', type: 'text', required: true },
    { name: 'externalId', type: 'text', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'textarea' },
    { name: 'url', type: 'text' },
    { name: 'status', type: 'text', defaultValue: 'published' },
    { name: 'lastEventId', type: 'text' },
  ],
}
