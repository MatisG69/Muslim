'use client'

import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { useAuth } from '@/lib/auth/AuthContext'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const { user, loading, configured, signIn, signUp } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) router.replace('/')
  }, [loading, user, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        const { error: err } = await signIn(email.trim(), password)
        if (err) {
          setError(err)
          return
        }
        router.replace('/')
      } else {
        const { error: err, needsConfirmation } = await signUp(email.trim(), password)
        if (err) {
          setError(err)
          return
        }
        if (needsConfirmation) {
          setInfo('Compte créé. Vérifie ta boîte mail pour confirmer ton adresse.')
        } else {
          router.replace('/')
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell withNav={false}>
      <div className='flex min-h-[80vh] flex-col justify-center'>
        <div className='mb-8 text-center'>
          <p className='font-arabic text-3xl text-gold-300/80' dir='rtl'>السلام عليكم</p>
          <p className='mt-2 text-xs uppercase tracking-[0.3em] text-ivory-100/50'>Sajda</p>
        </div>

        {!configured && (
          <div className='card mb-4 px-5 py-4 text-sm text-rose-300/90'>
            Supabase n'est pas configuré. Renseigne <code>NEXT_PUBLIC_SUPABASE_URL</code> et
            <code> NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans <code>.env.local</code> puis
            redémarre le dev server.
          </div>
        )}

        <div className='card overflow-hidden'>
          <div className='flex border-b border-white/[0.05]'>
            <TabButton active={mode === 'signin'} onClick={() => setMode('signin')}>
              Connexion
            </TabButton>
            <TabButton active={mode === 'signup'} onClick={() => setMode('signup')}>
              Créer un compte
            </TabButton>
          </div>

          <form onSubmit={submit} className='space-y-4 px-6 py-6'>
            <Field label='Email'>
              <input
                type='email'
                required
                autoComplete='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='vous@exemple.com'
                className='w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ivory-50 placeholder:text-ivory-100/30 focus:border-gold-400/50 focus:outline-none'
              />
            </Field>
            <Field label='Mot de passe'>
              <input
                type='password'
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='••••••••'
                className='w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ivory-50 placeholder:text-ivory-100/30 focus:border-gold-400/50 focus:outline-none'
              />
              {mode === 'signup' && (
                <p className='mt-1 text-[11px] text-ivory-100/45'>6 caractères minimum.</p>
              )}
            </Field>

            {error && (
              <p className='rounded-xl bg-rose-400/10 px-3 py-2 text-xs text-rose-300'>{error}</p>
            )}
            {info && (
              <p className='rounded-xl bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200'>
                {info}
              </p>
            )}

            <button
              type='submit'
              disabled={submitting || !configured}
              className='btn-primary w-full justify-center py-3 text-sm disabled:opacity-50'
            >
              {submitting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : mode === 'signin' ? (
                <LogIn className='h-4 w-4' />
              ) : (
                <UserPlus className='h-4 w-4' />
              )}
              {mode === 'signin' ? 'Se connecter' : 'Créer un compte'}
            </button>
          </form>
        </div>

        <p className='mt-6 text-center text-[11px] text-ivory-100/45'>
          Tes préférences et ton historique de prières seront synchronisés sur tous tes appareils.
        </p>
      </div>
    </PageShell>
  )
}

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex-1 px-4 py-3 text-sm transition-colors ${
      active ? 'bg-gold-400/[0.08] text-gold-200' : 'text-ivory-100/60 hover:text-ivory-100'
    }`}
  >
    {children}
  </button>
)

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className='block'>
    <span className='mb-1.5 block text-[11px] uppercase tracking-widest text-ivory-100/55'>
      {label}
    </span>
    {children}
  </label>
)
