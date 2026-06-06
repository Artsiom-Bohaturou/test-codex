import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { Users } from './src/collections/Users.js'
import { Posts } from './src/collections/Posts.js'

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
  secret: process.env.PAYLOAD_SECRET || 'client-payload-blog-local-secret',
  admin: {
    user: Users.slug,
  },
  collections: [Users, Posts],
  editor: lexicalEditor(),
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:/data/client-payload-blog.db',
    },
  }),
})
