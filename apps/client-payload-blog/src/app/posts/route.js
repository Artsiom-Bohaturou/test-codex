import { redirect } from 'next/navigation'
import { getClientPayload } from '../../lib/payload.js'

export async function POST(request) {
  const form = await request.formData()
  const payload = await getClientPayload()
  await payload.create({
    collection: 'posts',
    data: {
      title: String(form.get('title') || ''),
      content: String(form.get('content') || ''),
      origin: 'next-form',
    },
  })
  redirect('/')
}
