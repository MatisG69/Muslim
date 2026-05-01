import { BottomNav } from './BottomNav'

type Props = {
  children: React.ReactNode
  withNav?: boolean
}

export const PageShell = ({ children, withNav = true }: Props) => (
  <>
    <main className={`mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 pt-8 ${withNav ? 'pb-32' : 'pb-8'}`}>
      {children}
    </main>
    {withNav && <BottomNav />}
  </>
)
