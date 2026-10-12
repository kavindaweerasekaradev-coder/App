import { Compass } from 'lucide-react'
import { Page } from '@/components/layout/AppShell'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/StateView'

export function NotFound() {
  return (
    <Page className="pt-16">
      <EmptyState icon={Compass} title="Page not found" body="The page you’re looking for doesn’t exist." action={<ButtonLink to="/">Go home</ButtonLink>} />
    </Page>
  )
}
