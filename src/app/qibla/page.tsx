'use client'

import { ChevronLeft, Compass, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { QiblaCompass } from '@/components/QiblaCompass'
import { useDeviceHeading } from '@/lib/hooks/useDeviceHeading'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { computeQiblaBearing, distanceToKaabaKm } from '@/lib/qibla'
import { DEFAULT_SETTINGS, loadSettings, type Settings } from '@/lib/storage/settings'

export default function QiblaPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  useEffect(() => setSettings(loadSettings()), [])
  const geo = useGeolocation(settings.location)
  const location = settings.location ?? geo.location

  const heading = useDeviceHeading()

  const qibla = useMemo(() => {
    if (!location) return null
    return {
      bearing: computeQiblaBearing(location.latitude, location.longitude),
      distanceKm: distanceToKaabaKm(location.latitude, location.longitude),
    }
  }, [location?.latitude, location?.longitude])

  return (
    <PageShell>
      <header className='flex items-center justify-between'>
        <Link href='/' className='btn-ghost p-2.5' aria-label='Retour'>
          <ChevronLeft className='h-4 w-4' />
        </Link>
        <h1 className='font-serif text-2xl text-ivory-50'>Qibla</h1>
        <div className='w-10' />
      </header>

      {!location ? (
        <div className='card px-6 py-8 text-center text-sm text-ivory-100/70'>
          Activez la localisation pour calculer la direction de la Mecque.
          <Link href='/settings' className='mt-3 inline-block text-gold-300 underline'>
            Aller dans Réglages
          </Link>
        </div>
      ) : (
        <>
          <section className='card flex flex-col items-center px-6 py-8'>
            {qibla && (
              <QiblaCompass
                qiblaBearing={qibla.bearing}
                deviceHeading={heading.heading}
                size={280}
              />
            )}

            {heading.status !== 'granted' && (
              <button
                onClick={heading.request}
                className='btn-primary mt-6'
                disabled={heading.status === 'requesting'}
              >
                <Compass className='h-4 w-4' />
                {heading.status === 'requesting' ? 'Demande...' : 'Activer la boussole'}
              </button>
            )}

            {heading.status === 'denied' && (
              <p className='mt-3 text-xs text-rose-300'>
                {heading.error ?? 'Permission refusée. Activez l\'orientation dans Safari.'}
              </p>
            )}
            {heading.status === 'unsupported' && (
              <p className='mt-3 text-xs text-ivory-100/60'>
                Votre appareil ne fournit pas de capteur d'orientation.
              </p>
            )}

            {qibla && (
              <div className='mt-6 w-full grid grid-cols-2 gap-3 text-center'>
                <div className='rounded-2xl bg-white/[0.03] px-3 py-3'>
                  <p className='text-[10px] uppercase tracking-widest text-gold-300/70'>Direction</p>
                  <p className='mt-1 font-serif text-2xl text-ivory-50'>{Math.round(qibla.bearing)}°</p>
                </div>
                <div className='rounded-2xl bg-white/[0.03] px-3 py-3'>
                  <p className='text-[10px] uppercase tracking-widest text-gold-300/70'>Distance</p>
                  <p className='mt-1 font-serif text-2xl text-ivory-50'>
                    {Math.round(qibla.distanceKm).toLocaleString('fr-FR')} km
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className='card flex items-center justify-between gap-3 px-5 py-4'>
            <div className='flex items-center gap-3'>
              <MapPin className='h-4 w-4 text-gold-300' />
              <div>
                <p className='text-sm text-ivory-50'>{location.city ?? 'Position'}</p>
                <p className='text-xs text-ivory-100/50'>
                  {location.latitude.toFixed(3)}°, {location.longitude.toFixed(3)}°
                </p>
              </div>
            </div>
          </section>

          <p className='mt-2 text-center text-[11px] text-ivory-100/50'>
            Tournez doucement le téléphone à plat pour aligner la flèche dorée vers le haut.
            Le repère devient vert quand vous êtes face à la Qibla.
          </p>
        </>
      )}
    </PageShell>
  )
}
