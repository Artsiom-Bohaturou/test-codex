import React from 'react'
import { getDashboardPayload } from '../lib/payload.js'
import { getClientPlugins } from '../plugins/index.js'

export const dynamic = 'force-dynamic'

function styles() {
  return React.createElement('style', {
    dangerouslySetInnerHTML: { __html: `
      body { font-family: system-ui, sans-serif; margin: 2rem; color: #172033; }
      table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
      th, td { border-bottom: 1px solid #d7deea; padding: .75rem; text-align: left; }
      input, textarea, select { display: block; width: 35rem; max-width: 100%; margin: .35rem 0 1rem; padding: .6rem; }
      button { padding: .6rem 1rem; }
      code { background: #eef2f7; padding: .1rem .3rem; border-radius: 4px; }
      .badge { background: #eef4ff; border: 1px solid #b9cdf8; border-radius: 999px; padding: .2rem .55rem; }
      .card { background: #f8fafc; border: 1px solid #d7deea; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
      .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
    ` },
  })
}

async function getSyncedPosts() {
  const payload = await getDashboardPayload()
  const result = await payload.find({
    collection: 'synced-posts',
    sort: '-updatedAt',
    limit: 100,
  })
  return result.docs
}

export default async function Page() {
  const posts = await getSyncedPosts()
  const plugins = getClientPlugins()

  return React.createElement(React.Fragment, null,
    styles(),
    React.createElement('h1', null, 'Main Payload CMS dashboard'),
    React.createElement('div', { className: 'card' },
      React.createElement('p', null, 'This is a real Next.js + Payload CMS app. It consumes RabbitMQ events from client CMS servers and stores synced posts in a Payload collection.'),
      React.createElement('p', null, 'Create a post here, choose a client plugin, and publish it to the selected client CMS through RabbitMQ.'),
      React.createElement('p', null, React.createElement('a', { href: '/admin' }, 'Open Payload admin'), ' · ', React.createElement('a', { href: '/architecture' }, 'View distributed server architecture')),
    ),
    React.createElement('div', { className: 'grid' },
      React.createElement('section', { className: 'card' },
        React.createElement('h2', null, 'Create post on a client CMS'),
        React.createElement('form', { method: 'post', action: '/dashboard-posts' },
          React.createElement('label', null, 'Target client plugin',
            React.createElement('select', { name: 'targetClient' },
              plugins.map(plugin => React.createElement('option', { key: plugin.id, value: plugin.id }, plugin.label)),
            ),
          ),
          React.createElement('label', null, 'Title', React.createElement('input', { name: 'title', required: true, defaultValue: `Dashboard post ${posts.length + 1}` })),
          React.createElement('label', null, 'Content', React.createElement('textarea', { name: 'content', rows: 4, defaultValue: 'Created in the main dashboard and sent to a client CMS.' })),
          React.createElement('button', { type: 'submit' }, 'Publish to selected client'),
        ),
      ),
      React.createElement('section', { className: 'card' },
        React.createElement('h2', null, 'Installed client plugins'),
        React.createElement('ul', null,
          plugins.map(plugin => React.createElement('li', { key: plugin.id },
            React.createElement('strong', null, plugin.label), React.createElement('br'),
            React.createElement('small', null, plugin.description), React.createElement('br'),
            React.createElement('small', null, `Runs on: ${plugin.server}`), React.createElement('br'),
            React.createElement('code', null, plugin.routingKey),
          )),
        ),
      ),
    ),
    React.createElement('h2', null, 'Aggregated Payload collection: synced-posts'),
    React.createElement('table', null,
      React.createElement('thead', null, React.createElement('tr', null,
        ['Source', 'External ID', 'Title', 'URL', 'Updated'].map(header => React.createElement('th', { key: header }, header)),
      )),
      React.createElement('tbody', null,
        posts.length ? posts.map(post => React.createElement('tr', { key: post.id },
          React.createElement('td', null, React.createElement('span', { className: 'badge' }, post.source)),
          React.createElement('td', null, post.externalId),
          React.createElement('td', null, post.title),
          React.createElement('td', null, post.url ? React.createElement('a', { href: post.url, target: '_blank' }, 'open') : '-'),
          React.createElement('td', null, post.updatedAt),
        )) : React.createElement('tr', null, React.createElement('td', { colSpan: 5 }, 'No posts synced yet.')),
      ),
    ),
  )
}
