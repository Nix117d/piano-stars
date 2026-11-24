import type { Lang } from '../store/db';
import { en, type TKey } from './en';
import { nl } from './nl';

export { en, nl };
export type { TKey };

const dictionaries: Record<Lang, Record<TKey, string>> = { nl, en };

export function t(
  lang: Lang,
  key: TKey,
  params?: Record<string, string | number>,
): string {
  const template = dictionaries[lang][key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}
