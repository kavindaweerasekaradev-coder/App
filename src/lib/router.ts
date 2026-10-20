import { useEffect, useState } from 'react'

export type Route = { name: 'home' } | { name: 'checkout' } | { name: 'order'; id: string }

function parse(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/'
  if (path === '/checkout') return { name: 'checkout' }
  const m = path.match(/^\/order\/([\w-]+)$/)
  if (m) return { name: 'order', id: m[1] }
  return { name: 'home' }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export const navigate = (path: string) => {
  location.hash = path
}
