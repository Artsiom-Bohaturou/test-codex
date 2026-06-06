import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function getDashboardPayload() {
  return getPayload({ config: configPromise })
}
