import { t } from '../../i18n';
import type { Lang } from '../../store/db';

const STEPS = [
  { picture: '💻', key: 'export.step1' },
  { picture: '🔌', key: 'export.step2' },
  { picture: '🎹', key: 'export.step3' },
  { picture: '⭐', key: 'export.step4' },
] as const;

/** Shown after a song is saved: how to get the file onto the keyboard. */
export function KeyboardExportGuide({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  return (
    <div class="dialog-backdrop">
      <div class="dialog wide" role="dialog" aria-label={t(lang, 'export.title')} data-testid="export-guide">
        <h2 class="dialog-text">{t(lang, 'export.title')}</h2>
        <ol class="export-steps">
          {STEPS.map(s => (
            <li key={s.key}><span class="export-picture" aria-hidden="true">{s.picture}</span> {t(lang, s.key)}</li>
          ))}
        </ol>
        <p class="export-warning">{t(lang, 'export.warning')}</p>
        <button type="button" class="parent-button primary" onClick={onClose}>{t(lang, 'export.close')}</button>
      </div>
    </div>
  );
}
