import { useEffect, useState } from 'preact/hooks';
import { t, type TKey } from '../../i18n';
import type { NoteSource, SourceStatus } from '../../midi/note-source';
import { midiToName } from '../../song/pitch';
import type { Lang } from '../../store/db';

const MIDDLE_C = 60;
const RESULT_KEY: Record<string, TKey> = { ok: 'kb.ok', unsupported: 'kb.unsupported', denied: 'kb.denied' };

export const noteLabel = (midi: number) => {
  const { letter, sharp, octave } = midiToName(midi);
  return `${letter}${sharp ? '#' : ''}${octave} (${midi})`;
};

export interface KeyboardCheckProps {
  lang: Lang;
  source: NoteSource;
  status: SourceStatus;
  startResult?: 'ok' | 'unsupported' | 'denied';
  onStart: () => void;
}

/** Shows how the keyboard is connected and checks that middle C arrives as note 60. */
export function KeyboardCheck({ lang, source, status, startResult, onStart }: KeyboardCheckProps) {
  const [last, setLast] = useState<number>();
  useEffect(() => source.onNoteOn(e => setLast(e.midi)), [source]);
  const offset = last === undefined ? 0 : last - MIDDLE_C;
  return (
    <section class="kb-check" data-testid="keyboard-check">
      <h2>{'🎹'} {t(lang, 'kb.title')}</h2>
      <p data-testid="kb-status">
        {status.connected ? t(lang, 'kb.connected') : t(lang, 'kb.notConnected')}
        {status.connected && status.deviceName && ` · ${t(lang, 'kb.device', { name: status.deviceName })}`}
      </p>
      <p data-testid="kb-start">{startResult ? t(lang, RESULT_KEY[startResult]) : t(lang, 'kb.notStarted')}</p>
      {startResult !== 'ok' && <button type="button" class="parent-button" onClick={onStart}>{t(lang, 'kb.start')}</button>}
      <p>{t(lang, 'kb.pressC')}</p>
      <p data-testid="kb-last">{last === undefined ? t(lang, 'kb.none') : t(lang, 'kb.last', { note: noteLabel(last) })}</p>
      {last !== undefined && (offset === 0
        ? <p>{t(lang, 'kb.middleOk')}</p>
        : <p class="kb-warning" data-testid="kb-transposed">{t(lang, 'kb.transposed', { n: offset > 0 ? `+${offset}` : `${offset}` })}</p>)}
    </section>
  );
}
