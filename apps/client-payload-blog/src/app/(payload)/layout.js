import config from '@payload-config'
import { RootLayout } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap.js'

export default function Layout({ children }) {
  return RootLayout({ children, config, importMap })
}
