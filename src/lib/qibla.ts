const KAABA_LAT = 21.4225
const KAABA_LON = 39.8262

const toRad = (d: number): number => (d * Math.PI) / 180
const toDeg = (r: number): number => (r * 180) / Math.PI

export const computeQiblaBearing = (lat: number, lon: number): number => {
  const phi1 = toRad(lat)
  const phi2 = toRad(KAABA_LAT)
  const dLon = toRad(KAABA_LON - lon)

  const y = Math.sin(dLon) * Math.cos(phi2)
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon)

  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360
  return bearing
}

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export const distanceToKaabaKm = (lat: number, lon: number): number =>
  haversineDistance(lat, lon, KAABA_LAT, KAABA_LON)
