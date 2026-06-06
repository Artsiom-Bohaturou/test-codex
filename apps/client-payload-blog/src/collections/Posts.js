import { publishPayloadPost } from '../lib/rabbitmq.js'

export const Posts = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'origin', 'updatedAt'],
  },
  hooks: {
    afterChange: [async ({ doc, operation }) => {
      if (!['create', 'update'].includes(operation)) return doc
      await publishPayloadPost(doc)
      return doc
    }],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'textarea' },
    { name: 'origin', type: 'text', defaultValue: 'payload-admin' },
    { name: 'externalCommandId', type: 'text' },
  ],
}
