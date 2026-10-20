/** Accepts 077 123 4567, 77 123 4567, +94 77 123 4567 etc. Returns the 9 digits after +94. */
export function normalisePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('94')) d = d.slice(2)
  if (d.startsWith('0')) d = d.slice(1)
  return /^[1-9]\d{8}$/.test(d) ? d : null
}

export const formatPhone = (d: string) => `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`
