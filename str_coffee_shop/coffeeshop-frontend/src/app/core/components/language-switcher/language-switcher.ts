import { Component, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, LanguageCode, LanguageOption } from '../../translation.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css'
})
export class LanguageSwitcherComponent {
  isOpen = false;

  constructor(
    public translationService: TranslationService,
    private eRef: ElementRef
  ) {}

  get currentLangOption(): LanguageOption {
    const code = this.translationService.currentLanguage;
    return (
      this.translationService.supportedLanguages.find(l => l.code === code) ||
      this.translationService.supportedLanguages[0]
    );
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectLanguage(code: LanguageCode): void {
    this.translationService.setLanguage(code);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
