import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Languages } from 'lucide-react';

export default function LocaleSwitcher() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: 'ar' | 'en') => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('LocaleSwitcher.changeLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('ar')} disabled={i18n.language === 'ar'}>
          العربية
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}