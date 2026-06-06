import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { Users } from './src/collections/Users.js'
import { SyncedPosts } from './src/collections/SyncedPosts.js'

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  secret: process.env.PAYLOAD_SECRET || 'main-dashboard-local-secret',
  admin: {
    user: Users.slug,
  },
  collections: [Users, SyncedPosts],
  editor: lexicalEditor(),
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:/data/main-dashboard.db',
    },
  }),
})
