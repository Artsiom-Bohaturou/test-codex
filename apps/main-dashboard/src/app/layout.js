import React from 'react'

export const metadata = {
  title: 'Main Payload Dashboard',
}

export default function RootLayout({ children }) {
  return React.createElement('html', { lang: 'en' },
    React.createElement('body', null, children),
  )
}
