import { t } from '../../i18n';
import { PICTURES } from '../../songs/pictures';
import type { Lang } from '../../store/db';

/** The grid of pictures; the chosen one is marked. */
export function PicturePicker({ lang, value, onPick }: { lang: Lang; value: string; onPick: (p: string) => void }) {
  return (
    <div class="picture-picker" role="group" aria-label={t(lang, 'picture.title')}>
      {PICTURES.map(p => (
        <button key={p} type="button" class="picture-choice" aria-label={p} aria-pressed={p === value}
          data-selected={p === value ? 'true' : undefined} onClick={() => onPick(p)}>{p}</button>
      ))}
    </div>
  );
}
