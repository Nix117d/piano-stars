import { t } from '../i18n';
import type { Lang } from '../store/db';

/** Shown over a paused song while no keyboard is connected. */
export function PlugIn({ lang, onTapMode, onHome }: { lang: Lang; onTapMode: () => void; onHome: () => void }) {
  return (
    <div class="screen plug-screen" data-testid="plug-screen">
      <header class="top-bar">
        <button type="button" class="round-button" aria-label="Home" onClick={onHome}>{'🏠'}</button>
        <span />
        <span class="round-spacer" />
      </header>
      <div class="plug-picture" aria-hidden="true">
        <span>{'🎹'}</span>
        <span class="plug-cable">{'🔌'}</span>
        <span>{'📱'}</span>
      </div>
      <h1 class="plug-title">{t(lang, 'plug.title')}</h1>
      <button type="button" class="big-button" onClick={onTapMode}>
        <span class="big-button-icon">{'👆'}</span>{t(lang, 'plug.tap')}
      </button>
    </div>
  );
}
