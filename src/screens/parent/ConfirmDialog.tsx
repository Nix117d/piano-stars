import { t } from '../../i18n';
import type { Lang } from '../../store/db';

export function ConfirmDialog({ lang, message, onYes, onNo }: { lang: Lang; message: string; onYes: () => void; onNo: () => void }) {
  return (
    <div class="dialog-backdrop">
      <div class="dialog" role="alertdialog" aria-label={message} data-testid="confirm-dialog">
        <p class="dialog-text">{message}</p>
        <div class="dialog-buttons">
          <button type="button" class="parent-button" onClick={onNo}>{t(lang, 'confirm.cancel')}</button>
          <button type="button" class="parent-button danger" onClick={onYes}>{t(lang, 'confirm.yes')}</button>
        </div>
      </div>
    </div>
  );
}
