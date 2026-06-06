import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'

export async function generateMetadata(args) {
  return generatePageMetadata({ ...args, config })
}

export default function Page(args) {
  return RootPage({ ...args, config, importMap })
}
