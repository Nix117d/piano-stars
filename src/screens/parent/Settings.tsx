import { t, type TKey } from '../../i18n';
import type { Lang, Settings as SettingsData } from '../../store/db';

export interface SettingsProps {
  settings: SettingsData;
  /** Shows the storage-error banner after a save failed. */
  failed: boolean;
  onChange: (patch: Partial<SettingsData>) => void;
  onBack: () => void;
}

type ToggleKey = 'level2Enabled' | 'metronomeClick' | 'celebrationSound';

const TOGGLES: { key: ToggleKey; label: TKey; help: TKey }[] = [
  { key: 'level2Enabled', label: 'settings.level2', help: 'settings.level2Help' },
  { key: 'metronomeClick', label: 'settings.metronome', help: 'settings.metronomeHelp' },
  { key: 'celebrationSound', label: 'settings.celebration', help: 'settings.celebrationHelp' },
];

/** Each language is named in its own language, whichever language the screen is in. */
const LANGUAGES: { lang: Lang; name: string }[] = [
  { lang: 'nl', name: 'Nederlands' },
  { lang: 'en', name: 'English' },
];

function LanguageRow({ label, value, onPick }: { label: string; value: Lang; onPick: (l: Lang) => void }) {
  return (
    <div class="settings-row">
      <span class="settings-label">{label}</span>
      <div class="segmented" role="group" aria-label={label}>
        {LANGUAGES.map(({ lang, name }) => (
          <button type="button" key={lang} class={`segment${value === lang ? ' selected' : ''}`}
            aria-pressed={value === lang} onClick={() => onPick(lang)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsScreen({ settings, failed, onChange, onBack }: SettingsProps) {
  const lang = settings.parentLang;
  return (
    <div class="screen parent-screen" data-testid="settings">
      {failed && <p class="error-box parent-error" role="alert" data-testid="storage-error">{t(lang, 'parent.error')}</p>}
      <header class="top-bar">
        <button type="button" class="round-button" aria-label={t(lang, 'parent.back')} onClick={onBack}>{'⬅️'}</button>
        <h1 class="screen-title">{'⚙️'} {t(lang, 'parent.settings')}</h1>
        <span class="round-spacer" />
      </header>
      <div class="parent-scroll">
        <LanguageRow label={t(lang, 'settings.childLang')} value={settings.childLang} onPick={childLang => onChange({ childLang })} />
        <LanguageRow label={t(lang, 'settings.parentLang')} value={settings.parentLang} onPick={parentLang => onChange({ parentLang })} />
        {TOGGLES.map(({ key, label, help }) => (
          <button type="button" key={key} class="settings-toggle" role="switch" aria-checked={settings[key]}
            onClick={() => onChange({ [key]: !settings[key] })}>
            <span class="toggle-text">
              <span class="toggle-label">{t(lang, label)}</span>
              <span class="toggle-help">{t(lang, help)}</span>
            </span>
            <span class="toggle-track" aria-hidden="true"><span class="toggle-knob" /></span>
          </button>
        ))}
      </div>
    </div>
  );
}
