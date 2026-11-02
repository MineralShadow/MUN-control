import type { Author, ConferenceState, Settings } from '../types'

export const DEFAULT_THEME = '历史委员会'
export const SCHEMA_VERSION = 1

export const DEFAULT_AUTHOR: Author = {
  name: '🌟天马司我祝你星途璀璨',
  xiaohongshuId: '4277718409',
  xiaohongshuUrl: '',
}

export const DEFAULT_SETTINGS: Settings = {
  defaultMajority: 'SIMPLE',
  skipVetoStep: false,
  skipMajorityStep: false,
}

export function createInitialState(): ConferenceState {
  return {
    schemaVersion: SCHEMA_VERSION,
    theme: DEFAULT_THEME,
    author: { ...DEFAULT_AUTHOR },
    attendanceRule: 'ALL',
    delegations: [],
    sessions: [],
    currentSessionId: null,
    currentTopicId: null,
    resolutions: [],
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: Date.now(),
  }
}
