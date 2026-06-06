import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function getClientPayload() {
  return getPayload({ config: configPromise })
}
