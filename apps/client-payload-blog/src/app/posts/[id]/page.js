import React from 'react'
import { notFound } from 'next/navigation'
import { getClientPayload } from '../../../lib/payload.js'

export const dynamic = 'force-dynamic'

export default async function PostPage({ params }) {
  const payload = await getClientPayload()
  const { id } = await params
  let post
  try {
    post = await payload.findByID({ collection: 'posts', id })
  } catch (_error) {
    notFound()
  }

  return React.createElement(React.Fragment, null,
    React.createElement('h1', null, post.title),
    React.createElement('p', null, post.content || ''),
    React.createElement('p', null, React.createElement('a', { href: '/' }, 'Back')),
  )
}
