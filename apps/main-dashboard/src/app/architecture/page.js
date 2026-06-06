import React from 'react'
import { distributedServers, sharedInfrastructure } from '../../architecture.js'

export const dynamic = 'force-dynamic'

export default function ArchitecturePage() {
  return React.createElement(React.Fragment, null,
    React.createElement('style', { dangerouslySetInnerHTML: { __html: `
      body { font-family: system-ui, sans-serif; margin: 2rem; color: #172033; }
      code { background: #eef2f7; padding: .1rem .3rem; border-radius: 4px; }
      .card { background: #f8fafc; border: 1px solid #d7deea; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
      .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
    ` } }),
    React.createElement('p', null, React.createElement('a', { href: '/' }, '← Back to dashboard')),
    React.createElement('h1', null, 'Distributed CMS architecture'),
    React.createElement('div', { className: 'card' },
      React.createElement('p', null, 'In production, each CMS runs on a different server. The dashboard, Payload client, and WordPress client do not call each other directly for sync. They connect to shared RabbitMQ infrastructure.'),
      React.createElement('p', null, 'Shared broker: ', React.createElement('code', null, sharedInfrastructure.broker)),
      React.createElement('p', null, 'Production endpoint example: ', React.createElement('code', null, sharedInfrastructure.productionUrlExample)),
      React.createElement('p', null, 'Local Docker endpoint: ', React.createElement('code', null, sharedInfrastructure.localUrl)),
    ),
    React.createElement('div', { className: 'grid' },
      distributedServers.map(server => React.createElement('section', { className: 'card', key: server.name },
        React.createElement('h2', null, `${server.name} — ${server.title}`),
        React.createElement('h3', null, 'Services'),
        React.createElement('ul', null, server.services.map(item => React.createElement('li', { key: item }, item))),
        React.createElement('h3', null, 'Publishes'),
        React.createElement('ul', null, server.publishes.map(item => React.createElement('li', { key: item }, React.createElement('code', null, item)))),
        React.createElement('h3', null, 'Consumes'),
        React.createElement('ul', null, server.consumes.map(item => React.createElement('li', { key: item }, React.createElement('code', null, item)))),
      )),
    ),
  )
}
