import { EventEmitter } from 'node:events'

const bus = new EventEmitter()
bus.setMaxListeners(2000)

/** 同一进程内的会场变更广播；用于 SSE 推送。 */
export function notifyConference(conferenceId: string): void {
  bus.emit(`conference:${conferenceId}`, Date.now())
}

export function subscribeConference(
  conferenceId: string,
  listener: () => void,
): () => void {
  const event = `conference:${conferenceId}`
  bus.on(event, listener)
  return () => bus.off(event, listener)
}
