'use client'

import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { PEER_CONFIG } from './ice'

// =====================================================================
// Mesh WebRTC P2P pour rooms Halaqa (max ~6 participants)
//
// Architecture :
// - Une room = un canal Supabase Realtime "halaqa:{roomId}"
// - Présence (channel.track) maintient la liste des peers connectés
// - Quand un peer arrive, le peer dont l'userId est lexicographiquement
//   "plus petit" initie l'offer (déterminisme → pas de glare)
// - Échanges SDP + ICE via broadcast events sur le canal
// =====================================================================

const log = (...args: unknown[]) => console.info('[Halaqa]', ...args)
const warn = (...args: unknown[]) => console.warn('[Halaqa]', ...args)

export type PeerState = 'connecting' | 'connected' | 'failed' | 'closed'

export type PeerInfo = {
  userId: string
  state: PeerState
  stream: MediaStream | null
  muted: boolean
}

type MeshEvents = {
  'peers-changed': (peers: Map<string, PeerInfo>) => void
  'local-stream': (stream: MediaStream) => void
  'error': (err: Error) => void
}

type Listener<T extends keyof MeshEvents> = MeshEvents[T]

type SignalPayload =
  | { type: 'offer'; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice'; from: string; to: string; candidate: RTCIceCandidateInit }
  | { type: 'leave'; from: string }

export class WebRTCMesh {
  private roomId: string
  private localUserId: string
  private channel: RealtimeChannel | null = null
  private peers = new Map<string, {
    pc: RTCPeerConnection
    info: PeerInfo
    pendingIce: RTCIceCandidateInit[]
  }>()
  private localStream: MediaStream | null = null
  private listeners: { [K in keyof MeshEvents]?: Set<Listener<K>> } = {}
  private destroyed = false

  constructor(roomId: string, localUserId: string) {
    this.roomId = roomId
    this.localUserId = localUserId
  }

  on<T extends keyof MeshEvents>(event: T, listener: Listener<T>): () => void {
    if (!this.listeners[event]) this.listeners[event] = new Set() as any
    ;(this.listeners[event] as Set<Listener<T>>).add(listener)
    return () => {
      ;(this.listeners[event] as Set<Listener<T>> | undefined)?.delete(listener)
    }
  }

  private emit<T extends keyof MeshEvents>(event: T, ...args: Parameters<MeshEvents[T]>) {
    const set = this.listeners[event] as Set<Listener<T>> | undefined
    if (!set) return
    set.forEach(fn => {
      try {
        ;(fn as any)(...args)
      } catch (e) {
        console.error('[WebRTCMesh] listener error', e)
      }
    })
  }

  private notifyPeers() {
    const snapshot = new Map<string, PeerInfo>()
    this.peers.forEach((p, k) => snapshot.set(k, { ...p.info }))
    this.emit('peers-changed', snapshot)
  }

  async join(): Promise<void> {
    if (this.destroyed) throw new Error('Mesh déjà détruit')

    // 1. Capture audio local
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    })
    this.localStream = stream
    this.emit('local-stream', stream)

    // 2. Connexion au canal Realtime
    const sb = supabase()
    const channel = sb.channel(`halaqa:${this.roomId}`, {
      config: {
        presence: { key: this.localUserId },
        broadcast: { self: false, ack: false },
      },
    })
    this.channel = channel

    channel.on('presence', { event: 'sync' }, () => this.handlePresenceSync())
    channel.on('presence', { event: 'leave' }, ({ key }) => this.handlePeerLeave(key))

    channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
      this.handleSignal(payload as SignalPayload).catch(err => {
        console.error('[WebRTCMesh] signal error', err)
        this.emit('error', err as Error)
      })
    })

    log('Joining channel', `halaqa:${this.roomId}`, 'as', this.localUserId)

    await new Promise<void>((resolve, reject) => {
      channel.subscribe(async status => {
        log('Channel status:', status)
        if (status === 'SUBSCRIBED') {
          const trackResult = await channel.track({ user_id: this.localUserId, joined_at: Date.now() })
          log('Tracked presence, result:', trackResult)
          resolve()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reject(new Error(`Subscribe failed: ${status}`))
        }
      })
    })
  }

  private handlePresenceSync() {
    if (!this.channel) return
    const state = this.channel.presenceState<{ user_id: string }>()
    const remoteUserIds = new Set<string>()
    Object.entries(state).forEach(([key, presences]) => {
      const userId = presences[0]?.user_id ?? key
      if (userId !== this.localUserId) remoteUserIds.add(userId)
    })

    log('Presence sync — all keys:', Object.keys(state), 'remote peers:', Array.from(remoteUserIds))

    // Crée les PC manquantes
    remoteUserIds.forEach(uid => {
      if (!this.peers.has(uid)) {
        log('New peer detected, creating connection:', uid)
        this.createPeer(uid)
      }
    })

    // Supprime les peers qui ne sont plus présents
    Array.from(this.peers.keys()).forEach(uid => {
      if (!remoteUserIds.has(uid)) {
        log('Peer left presence, closing:', uid)
        this.closePeer(uid)
      }
    })

    this.notifyPeers()
  }

  private handlePeerLeave(key: string) {
    if (key === this.localUserId) return
    this.closePeer(key)
    this.notifyPeers()
  }

  private createPeer(remoteUserId: string) {
    const pc = new RTCPeerConnection(PEER_CONFIG)
    const info: PeerInfo = {
      userId: remoteUserId,
      state: 'connecting',
      stream: null,
      muted: false,
    }
    const peer = { pc, info, pendingIce: [] as RTCIceCandidateInit[] }
    this.peers.set(remoteUserId, peer)

    // Ajoute les tracks locaux
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!)
      })
    }

    pc.onicecandidate = ev => {
      if (ev.candidate) {
        this.sendSignal({
          type: 'ice',
          from: this.localUserId,
          to: remoteUserId,
          candidate: ev.candidate.toJSON(),
        })
      }
    }

    pc.ontrack = ev => {
      info.stream = ev.streams[0] ?? new MediaStream([ev.track])
      this.notifyPeers()
    }

    pc.oniceconnectionstatechange = () => {
      log(`ICE state [${remoteUserId.slice(0, 8)}]:`, pc.iceConnectionState)
    }

    pc.onicegatheringstatechange = () => {
      log(`ICE gathering [${remoteUserId.slice(0, 8)}]:`, pc.iceGatheringState)
    }

    pc.onconnectionstatechange = () => {
      log(`PC state [${remoteUserId.slice(0, 8)}]:`, pc.connectionState)
      switch (pc.connectionState) {
        case 'connected':
          info.state = 'connected'
          break
        case 'failed':
          info.state = 'failed'
          warn(`Peer ${remoteUserId} connection FAILED. Probable cause: NAT symétrique. TURN server requis ou indisponible.`)
          break
        case 'closed':
          info.state = 'closed'
          break
        default:
          info.state = 'connecting'
      }
      this.notifyPeers()
    }

    // Politique d'initiation : le userId lexicographiquement plus petit lance l'offer.
    if (this.localUserId < remoteUserId) {
      log(`I'm initiator (${this.localUserId.slice(0, 8)} < ${remoteUserId.slice(0, 8)}), creating offer`)
      this.makeOffer(remoteUserId).catch(err => {
        console.error('[Halaqa] makeOffer error', err)
        this.emit('error', err as Error)
      })
    } else {
      log(`I'm responder (${this.localUserId.slice(0, 8)} > ${remoteUserId.slice(0, 8)}), waiting for offer`)
    }
  }

  private async makeOffer(remoteUserId: string) {
    const peer = this.peers.get(remoteUserId)
    if (!peer) return
    const offer = await peer.pc.createOffer()
    await peer.pc.setLocalDescription(offer)
    this.sendSignal({
      type: 'offer',
      from: this.localUserId,
      to: remoteUserId,
      sdp: offer,
    })
  }

  private async handleSignal(signal: SignalPayload) {
    if ('to' in signal && signal.to !== this.localUserId) return
    log('Received signal:', signal.type, 'from', signal.from.slice(0, 8))
    if (signal.type === 'leave') {
      this.closePeer(signal.from)
      this.notifyPeers()
      return
    }

    let peer = this.peers.get(signal.from)
    if (!peer) {
      this.createPeer(signal.from)
      peer = this.peers.get(signal.from)
      if (!peer) return
    }

    if (signal.type === 'offer') {
      await peer.pc.setRemoteDescription(signal.sdp)
      // flush ICE en attente
      for (const cand of peer.pendingIce) {
        await peer.pc.addIceCandidate(cand).catch(() => {})
      }
      peer.pendingIce = []
      const answer = await peer.pc.createAnswer()
      await peer.pc.setLocalDescription(answer)
      this.sendSignal({
        type: 'answer',
        from: this.localUserId,
        to: signal.from,
        sdp: answer,
      })
    } else if (signal.type === 'answer') {
      await peer.pc.setRemoteDescription(signal.sdp)
      for (const cand of peer.pendingIce) {
        await peer.pc.addIceCandidate(cand).catch(() => {})
      }
      peer.pendingIce = []
    } else if (signal.type === 'ice') {
      if (peer.pc.remoteDescription) {
        await peer.pc.addIceCandidate(signal.candidate).catch(() => {})
      } else {
        peer.pendingIce.push(signal.candidate)
      }
    }
  }

  private sendSignal(signal: SignalPayload) {
    if (!this.channel) return
    this.channel.send({ type: 'broadcast', event: 'signal', payload: signal })
  }

  private closePeer(remoteUserId: string) {
    const peer = this.peers.get(remoteUserId)
    if (!peer) return
    peer.info.state = 'closed'
    peer.info.stream = null
    try {
      peer.pc.close()
    } catch {}
    this.peers.delete(remoteUserId)
  }

  setMuted(muted: boolean) {
    if (!this.localStream) return
    this.localStream.getAudioTracks().forEach(t => {
      t.enabled = !muted
    })
  }

  isMuted(): boolean {
    if (!this.localStream) return false
    const tracks = this.localStream.getAudioTracks()
    if (tracks.length === 0) return false
    return !tracks[0].enabled
  }

  async leave(): Promise<void> {
    if (this.destroyed) return
    this.destroyed = true

    // Notifie les peers
    if (this.channel) {
      try {
        this.channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'leave', from: this.localUserId } satisfies SignalPayload,
        })
      } catch {}
    }

    // Ferme toutes les PC
    Array.from(this.peers.keys()).forEach(uid => this.closePeer(uid))

    // Arrête les tracks locaux
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop())
      this.localStream = null
    }

    // Quitte le canal
    if (this.channel) {
      try {
        await this.channel.untrack()
      } catch {}
      try {
        await supabase().removeChannel(this.channel)
      } catch {}
      this.channel = null
    }

    this.listeners = {}
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }
}
