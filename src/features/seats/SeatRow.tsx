import { EditableText } from '../../components/EditableText'
import { StatusDot } from '../../components/StatusDot'
import { useConfirm } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { NumberStepper } from '../../components/NumberStepper'
import { useConference } from '../../state/ConferenceContext'
import type { Seat, VoteMode } from '../../types'

interface SeatRowProps {
  delegationId: string
  delegationName: string
  seat: Seat
  index: number
  canDelete: boolean
  voteMode: VoteMode
}

export function SeatRow({
  delegationId,
  delegationName,
  seat,
  index,
  canDelete,
  voteMode,
}: SeatRowProps) {
  const { dispatch, me } = useConference()
  const confirm = useConfirm()
  const toast = useToast()
  const canEdit = me.role === 'chair'

  function togglePresent() {
    if (!canEdit) return
    dispatch({ type: 'seat/togglePresent', delegationId, seatId: seat.id })
  }

  async function removeSeat() {
    if (!canEdit) return
    if (!canDelete) {
      toast('每个代表团至少保留一个席位', 'danger')
      return
    }
    const ok = await confirm({
      title: `删除席位「${seat.name}」？`,
      message: `该席位属于「${delegationName}」。删除后出席人数会重新计算。`,
      confirmText: '删除席位',
      danger: true,
    })
    if (ok) {
      dispatch({ type: 'seat/delete', delegationId, seatId: seat.id })
      toast('席位已删除', 'success')
    }
  }

  return (
    <li className="seat-row">
      <span className="seat-index" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <EditableText
        className="seat-name"
        value={seat.name}
        onSave={(name) =>
          dispatch({ type: 'seat/rename', delegationId, seatId: seat.id, name })
        }
        maxLength={30}
        ariaLabel="席位名称"
        editable={canEdit}
      />
      {voteMode === 'MEMBER' ? (
        canEdit ? (
          <NumberStepper
            value={seat.votes}
            min={0}
            max={999}
            onChange={(votes) =>
              dispatch({ type: 'seat/setVotes', delegationId, seatId: seat.id, votes })
            }
            ariaLabel={`${seat.name}的票权`}
            suffix="票"
          />
        ) : (
          <span className="control-label">票权 {seat.votes} 票</span>
        )
      ) : null}
      <StatusDot
        tone={seat.present ? 'present' : 'absent'}
        clickable={canEdit}
        pressed={seat.present}
        size="sm"
        title={
          canEdit
            ? seat.present
              ? `${seat.name}：出席（点击切换为缺席）`
              : `${seat.name}：缺席（点击切换为出席）`
            : `${seat.name}：${seat.present ? '出席' : '缺席'}`
        }
        onClick={togglePresent}
      />
      {canEdit ? (
        <button
          type="button"
          className="btn-icon seat-delete"
          onClick={removeSeat}
          aria-label={`删除席位 ${seat.name}`}
          title="删除席位"
        >
          ×
        </button>
      ) : null}
    </li>
  )
}
