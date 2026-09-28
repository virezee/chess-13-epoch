import type { Dispatch, SetStateAction, RefObject } from 'react'
import type { Move, Save } from '@/types/game'
import type { Role, Offer, Handlers, Connection } from '@/types/network'
import { useState, useEffect, useRef } from 'react'
import { WHITE, BLACK } from '@/constants/player'
import { connect } from './online'

type Proposal = { kind: Offer; isMine: boolean } | null
type Setters = {
  save: Dispatch<SetStateAction<Save>>
  promotions: (moves: Move[]) => void
  key: Dispatch<SetStateAction<number>>
  role: (role: Role) => void
  link: (link: string) => void
  players: (players: number) => void
  seconds: (seconds: number | null) => void
  offer: (offer: Proposal) => void
}
type Room = {
  connection: RefObject<Connection | null>
  role: Role | null
  link: string | null
  players: number
  seconds: number | null
  offer: Proposal
  setLink: (link: string | null) => void
  setOffer: (offer: Proposal) => void
}
const listen = (role: RefObject<Role | null>, set: Setters): Handlers => ({
  onCode: code => {
    set.link(`${window.location.origin}/${code}`)
    window.history.replaceState(null, '', `/${code}`)
  },
  onRole: next => {
    role.current = next
    set.role(next)
  },
  onSave: next => {
    set.save(next)
    set.offer(null)
    set.promotions([])
    if (next.match.pgn === '') set.key(round => round + 1)
  },
  onPlayers: (players, remaining) => {
    set.players(players)
    set.seconds(remaining === null ? null : Math.ceil(remaining / 1000))
  },
  onAbandoned: () => {
    set.save(current => ({
      ...current,
      match: {
        ...current.match,
        abandoned: current.match.whitePlayer === role.current ? BLACK : WHITE
      }
    }))
  },
  onOffer: kind => {
    set.offer({ kind, isMine: false })
  },
  onDecline: () => {
    set.offer(null)
  },
  onClose: () => {
    set.players(0)
  }
})
const useCountdown = (): [number | null, (seconds: number | null) => void] => {
  const [seconds, setSeconds] = useState<number | null>(null)
  const isCounting = seconds !== null
  useEffect(() => {
    if (!isCounting) return undefined
    const timer = setInterval(() => {
      setSeconds(current => (current === null ? null : Math.max(current - 1, 0)))
    }, 1000)
    return () => {
      clearInterval(timer)
    }
  }, [isCounting])
  return [seconds, setSeconds]
}
export const useRoom = (
  path: string | undefined,
  setSave: Dispatch<SetStateAction<Save>>,
  setPromotions: (moves: Move[]) => void,
  setKey: Dispatch<SetStateAction<number>>
): Room => {
  const connection = useRef<Connection | null>(null)
  const currentRole = useRef<Role | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [players, setPlayers] = useState(0)
  const [seconds, setSeconds] = useCountdown()
  const [offer, setOffer] = useState<Proposal>(null)
  useEffect(() => {
    if (path === undefined) return undefined
    const room = connect(
      path,
      listen(currentRole, {
        save: setSave,
        promotions: setPromotions,
        key: setKey,
        role: setRole,
        link: setLink,
        players: setPlayers,
        seconds: setSeconds,
        offer: setOffer
      })
    )
    connection.current = room
    return () => {
      room.leave()
    }
  }, [path, setSave, setPromotions, setKey, setSeconds])
  return { connection, role, link, players, seconds, offer, setLink, setOffer }
}