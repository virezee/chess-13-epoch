import type { SetStateAction, Dispatch, RefObject } from 'react'
import type { Move, Save } from '@/types/game'
import type { Role, OfferState, Handlers, Dispatchers, Connection, Room } from '@/types/network'
import { useState, useEffect, useRef } from 'react'
import { WHITE, BLACK } from '@/constants/player'
import { connect } from './online'

const listen = (role: RefObject<Role | null>, set: Dispatchers): Handlers => ({
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
  onOffer: offer => {
    set.offer({ offer, outgoing: false })
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
    const timer = isCounting
      ? setInterval(() => {
          setSeconds(current => (current === null ? null : Math.max(current - 1, 0)))
        }, 1000)
      : null
    return (): void => {
      if (timer !== null) clearInterval(timer)
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
  const [offer, setOffer] = useState<OfferState | null>(null)
  useEffect(() => {
    const room =
      path === undefined
        ? null
        : connect(
            path,
            listen(currentRole, {
              link: setLink,
              role: setRole,
              save: setSave,
              offer: setOffer,
              promotions: setPromotions,
              key: setKey,
              players: setPlayers,
              seconds: setSeconds
            })
          )
    connection.current = room
    return (): void => {
      room?.leave()
    }
  }, [path, setSave, setPromotions, setKey, setSeconds])
  return { connection, role, link, players, seconds, offer, setLink, setOffer }
}