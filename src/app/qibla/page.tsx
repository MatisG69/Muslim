'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, Compass, MapPin, Navigation, RotateCw } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import { PageShell } from '@/components/PageShell'
import { QiblaCompass } from '@/components/QiblaCompass'
import { useDeviceHeading } from '@/lib/hooks/useDeviceHeading'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { computeQiblaBearing, distanceToKaabaKm } from '@/lib/qibla'
import { useSettings } from '@/lib/storage/SettingsContext'

const directionLabel = (delta: number, aligned: boolean): string => {
  if (aligned) return 'Vous êtes face à la Qibla'
  const abs = Math.round(Math.abs(delta))
  if (delta > 0) return `Tournez ${abs}° vers la droite`
  return `Tournez ${abs}° vers la gauche`
}

export default function QiblaPage() {
  const { settings } = useSettings()
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

  const angleDelta = useMemo(() => {
    if (!qibla || heading.heading == null) return null
    return ((qibla.bearing - heading.heading + 540) % 360) - 180
  }, [qibla?.bearing, heading.heading])

  const aligned = angleDelta != null && Math.abs(angleDelta) < 7
  const close = angleDelta != null && !aligned && Math.abs(angleDelta) < 20

  return (
    <PageShell>
      <header className='flex items-center justify-between'>
        <Link href='/' className='btn-ghost p-2.5' aria-label='Retour'>
          <ChevronLeft className='h-4 w-4' />
        </Link>
        <div className='text-center'>
          <h1 className='font-serif text-2xl text-ivory-50'>Qibla</h1>
          <p className='font-arabic text-xs text-gold-300/70' dir='rtl'>اتجاه القبلة</p>
        </div>
        <div className='w-10' />
      </header>

      {!location ? (
        <div className='card flex flex-col items-center gap-3 px-6 py-10 text-center'>
          <MapPin className='h-8 w-8 text-gold-300/70' />
          <p className='text-sm text-ivory-100/80'>
            Activez la localisation pour calculer la direction de la Mecque.
          </p>
          <Link href='/settings' className='btn-primary mt-2 text-xs'>
            Ouvrir Réglages
          </Link>
        </div>
      ) : (
        <>
          <section className='card relative overflow-hidden px-6 pt-10 pb-7'>
            <div
              className='pointer-events-none absolute inset-0 opacity-[0.05]'
              style={{ backgroundImage: 'url(/patterns/arabesque.svg)', backgroundSize: '180px' }}
              aria-hidden
            />

            <div className='relative flex flex-col items-center'>
              {qibla && (
                <QiblaCompass
                  qiblaBearing={qibla.bearing}
                  deviceHeading={heading.heading}
                  size={300}
                />
              )}

              {heading.status === 'granted' && angleDelta != null && (
                <motion.div
                  key={aligned ? 'aligned' : close ? 'close' : 'far'}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='mt-7 text-center'
                >
                  <p
                    className={`font-serif text-2xl ${
                      aligned ? 'text-emerald-300' : close ? 'text-amber-300' : 'text-ivory-50'
                    }`}
                  >
                    {directionLabel(angleDelta, aligned)}
                  </p>
                  {aligned && (
                    <p className='mt-2 font-arabic text-base text-emerald-300/90' dir='rtl'>
                      تقبل الله صلاتك
                    </p>
                  )}
                </motion.div>
              )}

              {heading.status !== 'granted' && (
                <button
                  onClick={heading.request}
                  className='btn-primary mt-7 px-7 py-3.5'
                  disabled={heading.status === 'requesting'}
                >
                  <Compass className='h-4 w-4' />
                  {heading.status === 'requesting' ? 'Demande...' : 'Activer la boussole'}
                </button>
              )}

              {heading.status === 'denied' && (
                <p className='mt-3 max-w-xs text-center text-xs text-rose-300'>
                  Permission refusée. Sur iOS Safari, autorisez le mouvement et l'orientation dans les réglages du site.
                </p>
              )}
              {heading.status === 'unsupported' && (
                <p className='mt-3 max-w-xs text-center text-xs text-ivory-100/60'>
                  Votre appareil ne fournit pas de capteur d'orientation.
                </p>
              )}
            </div>
          </section>

          {qibla && (
            <section className='grid grid-cols-3 gap-3'>
              <Tile
                icon={<Navigation className='h-3.5 w-3.5 text-gold-300' />}
                label='Direction'
                value={`${Math.round(qibla.bearing)}°`}
                unit='depuis le Nord'
              />
              <Tile
                icon={<Compass className='h-3.5 w-3.5 text-gold-300' />}
                label='Cap actuel'
                value={heading.heading != null ? `${Math.round(heading.heading)}°` : '—'}
                unit='votre orientation'
              />
              <Tile
                icon={<MapPin className='h-3.5 w-3.5 text-gold-300' />}
                label='Distance'
                value={Math.round(qibla.distanceKm).toLocaleString('fr-FR')}
                unit='km vers la Mecque'
              />
            </section>
          )}

          <section className='card flex items-center justify-between gap-3 px-5 py-4'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-gold-400/10 ring-1 ring-gold-400/30'>
                <MapPin className='h-4 w-4 text-gold-300' />
              </div>
              <div>
                <p className='text-sm text-ivory-50'>{location.city ?? 'Position'}</p>
                <p className='text-[11px] text-ivory-100/55'>
                  {location.latitude.toFixed(3)}°, {location.longitude.toFixed(3)}°
                </p>
              </div>
            </div>
            {heading.status === 'granted' && (
              <button
                onClick={heading.request}
                className='btn-ghost p-2.5'
                aria-label='Recalibrer'
                title='Recalibrer la boussole'
              >
                <RotateCw className='h-4 w-4' />
              </button>
            )}
          </section>

          <section className='card px-5 py-4'>
            <h3 className='mb-2 text-[10px] uppercase tracking-[0.3em] text-gold-300/70'>Conseils</h3>
            <ul className='space-y-1.5 text-[11px] text-ivory-100/65'>
              <li>· Tenez le téléphone à plat, écran vers le haut</li>
              <li>· Éloignez-vous d'objets métalliques ou électroniques puissants</li>
              <li>· Si la boussole semble instable : tracez un 8 dans l'air pour calibrer</li>
              <li>· La précision est typiquement de ±5° à ±10° selon le capteur</li>
            </ul>
          </section>
        </>
      )}
    </PageShell>
  )
}

const Tile = ({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit: string
}) => (
  <div className='card flex flex-col items-center gap-1 px-2 py-3 text-center'>
    {icon}
    <p className='text-[9px] uppercase tracking-widest text-gold-300/70'>{label}</p>
    <p className='font-serif text-xl tabular-nums text-ivory-50'>{value}</p>
    <p className='text-[9px] text-ivory-100/45'>{unit}</p>
  </div>
)
