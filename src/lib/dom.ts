export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const CATEGORY_EVENT = 'menu:category'

/** Asks the home page to show one menu category (used by links outside the page, like the footer). */
export function showMenuCategory(category: string) {
  window.dispatchEvent(new CustomEvent(CATEGORY_EVENT, { detail: category }))
}

export function onShowMenuCategory(handler: (category: string) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<string>).detail)
  window.addEventListener(CATEGORY_EVENT, listener)
  return () => window.removeEventListener(CATEGORY_EVENT, listener)
}
