import { Provider } from '@angular/core';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import en from '../../assets/i18n/en.json';

export function provideTranslateTesting(): Provider[] {
  return [provideTranslateService()];
}

export function setupTestTranslations(service: TranslateService): void {
  service.setTranslation('en', en);
  service.use('en');
}
