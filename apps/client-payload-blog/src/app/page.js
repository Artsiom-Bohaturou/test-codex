import React from 'react'
import { getClientPayload } from '../lib/payload.js'

export const dynamic = 'force-dynamic'

async function getPosts() {
  const payload = await getClientPayload()
  const result = await payload.find({ collection: 'posts', sort: '-updatedAt', limit: 50 })
  return result.docs
}

export default async function Page() {
  const posts = await getPosts()

  return React.createElement(React.Fragment, null,
    React.createElement('style', { dangerouslySetInnerHTML: { __html: `
      body { font-family: system-ui, sans-serif; margin: 2rem; color: #172033; }
      input, textarea { display: block; width: 35rem; max-width: 100%; margin: .35rem 0 1rem; padding: .6rem; }
      button { padding: .6rem 1rem; }
      .card { background: #f8fafc; border: 1px solid #d7deea; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
    ` } }),
    React.createElement('h1', null, 'Client Payload CMS blog'),
    React.createElement('div', { className: 'card' },
      React.createElement('p', null, 'This is the client-owned Next.js + Payload CMS app. Posts are stored in the Payload posts collection.'),
      React.createElement('p', null, 'Payload collection hooks publish post changes to RabbitMQ.'),
      React.createElement('p', null, React.createElement('a', { href: '/admin' }, 'Open Payload admin'), ' · ', React.createElement('a', { href: 'http://localhost:3000' }, 'Open main dashboard')),
    ),
    React.createElement('form', { method: 'post', action: '/posts' },
      React.createElement('label', null, 'Title', React.createElement('input', { name: 'title', required: true, defaultValue: `Payload client post ${posts.length + 1}` })),
      React.createElement('label', null, 'Content', React.createElement('textarea', { name: 'content', rows: 4, defaultValue: 'Example content from the client Payload CMS blog.' })),
      React.createElement('button', { type: 'submit' }, 'Create Payload post'),
    ),
    React.createElement('h2', null, 'Local Payload posts'),
    React.createElement('ul', null,
      posts.length ? posts.map(post => React.createElement('li', { key: post.id },
        React.createElement('strong', null, post.title), ' — ', post.content || '', ' ', React.createElement('small', null, `(${post.origin || 'payload'})`),
      )) : React.createElement('li', null, 'No posts yet.'),
    ),
  )
}
