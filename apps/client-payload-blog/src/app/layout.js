import React from 'react'

export const metadata = {
  title: 'Client Payload Blog',
}

export default function RootLayout({ children }) {
  return React.createElement('html', { lang: 'en' },
    React.createElement('body', null, children),
  )
}
