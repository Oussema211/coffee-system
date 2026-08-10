import { Injectable, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EN_TRANSLATIONS } from './translations/en';
import { FR_TRANSLATIONS } from './translations/fr';

export type LanguageCode = 'en' | 'fr';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  flag: string;
  dir: 'ltr';
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  public readonly supportedLanguages: LanguageOption[] = [
    { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' }
  ];

  private dictionaries: Record<LanguageCode, Record<string, any>> = {
    en: EN_TRANSLATIONS,
    fr: FR_TRANSLATIONS
  };

  private currentLangSubject = new BehaviorSubject<LanguageCode>('en');
  public currentLang$: Observable<LanguageCode> = this.currentLangSubject.asObservable();
  public currentLangSignal: WritableSignal<LanguageCode> = signal<LanguageCode>('en');

  constructor() {
    const savedLang = (localStorage.getItem('app_lang') as LanguageCode) || 'en';
    const validLang = this.supportedLanguages.some(l => l.code === savedLang) ? savedLang : 'en';
    this.setLanguage(validLang);
  }

  public get currentLanguage(): LanguageCode {
    return this.currentLangSubject.value;
  }

  public setLanguage(lang: LanguageCode): void {
    if (!this.dictionaries[lang]) return;

    localStorage.setItem('app_lang', lang);
    this.currentLangSubject.next(lang);
    this.currentLangSignal.set(lang);

    document.documentElement.lang = lang;
    document.documentElement.setAttribute('dir', 'ltr');
  }

  public translate(key: string, params?: Record<string, any>): string {
    if (!key) return '';

    const lang = this.currentLanguage;
    const dict = this.dictionaries[lang] || this.dictionaries.en;

    const keys = key.split('.');
    let value: any = dict;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English dictionary if key missing in target language
        value = this.getFallbackTranslation(key);
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (params) {
      Object.keys(params).forEach(paramKey => {
        value = value.replace(new RegExp(`{{${paramKey}}}`, 'g'), params[paramKey]);
      });
    }

    return value;
  }

  private getFallbackTranslation(key: string): string {
    const keys = key.split('.');
    let value: any = this.dictionaries.en;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    return typeof value === 'string' ? value : key;
  }
}
