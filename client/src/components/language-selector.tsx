import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSupportedLanguages } from '@/i18n';

export function LanguageSelector({ variant = 'default' }: { variant?: 'default' | 'minimal' }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  
  const currentLanguage = getSupportedLanguages().find(
    (lang) => lang.code === i18n.language
  ) || { code: 'en', name: 'English' };
  
  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setOpen(false);
  };

  if (variant === 'minimal') {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Globe className="h-4 w-4" />
            <span className="sr-only">{t('profile.language')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {getSupportedLanguages().map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center justify-between"
            >
              <span>{language.name}</span>
              {language.code === i18n.language && (
                <Check className="h-4 w-4 ml-2" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span>{currentLanguage.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {getSupportedLanguages().map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between"
          >
            <span>{language.name}</span>
            {language.code === i18n.language && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}