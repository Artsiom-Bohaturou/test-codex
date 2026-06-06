import { redirect } from 'next/navigation'
import { publishDashboardPostCommand } from '../../lib/events.js'

export async function POST(request) {
  const form = await request.formData()
  await publishDashboardPostCommand({
    targetClient: String(form.get('targetClient') || ''),
    title: String(form.get('title') || ''),
    content: String(form.get('content') || ''),
  })
  redirect('/')
}
