// Configuration STUN publique (Google). Suffisant pour la plupart des cas P2P.
// Pour les NAT symétriques, il faudra ajouter un TURN (Twilio, Coturn, etc.) en V2.
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
]

export const PEER_CONFIG: RTCConfiguration = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 4,
}
