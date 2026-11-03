import type { MotionType } from '../types'

export const DEFAULT_MOTION_TYPES: MotionType[] = [
  {
    id: 'motion-free',
    name: '自由磋商',
    hasTopic: false,
    hasSpeakersList: false,
    needsTotalDuration: true,
    hasUnitDuration: false,
  },
  {
    id: 'motion-moderated',
    name: '有主持核心磋商',
    hasTopic: true,
    hasSpeakersList: true,
    needsTotalDuration: true,
    hasUnitDuration: true,
  },
  {
    id: 'motion-debate',
    name: '自由辩论',
    hasTopic: false,
    hasSpeakersList: true,
    needsTotalDuration: true,
    hasUnitDuration: true,
  },
]

export function defaultMotionTypes(): MotionType[] {
  return DEFAULT_MOTION_TYPES.map((item) => ({ ...item }))
}
