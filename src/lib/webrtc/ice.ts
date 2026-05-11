// Configuration ICE pour le mesh WebRTC.
//
// STUN : permet aux deux peers de découvrir leur IP publique (NAT classique).
// TURN : relai obligatoire quand les peers sont derrière un NAT symétrique
//        (typiquement : 4G/5G, réseaux d'entreprise, certains wifi grand public).
//
// V1 : on utilise Open Relay Project — service TURN gratuit ouvert (metered.ca).
//      Pas de garantie de SLA, peut être lent ou indisponible. Pour de la prod,
//      migrer vers Metered free tier (50 GB/mois après signup), Twilio Network
//      Traversal, ou un Coturn self-host.

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turns:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]

export const PEER_CONFIG: RTCConfiguration = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 4,
  // Laisse ICE choisir entre relay/srflx/host. Pour forcer le relai (debug),
  // mettre iceTransportPolicy: 'relay'.
}
