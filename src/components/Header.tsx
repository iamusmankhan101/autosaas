import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import {Menu} from 'lucide-react';
import {Button} from '@/components/ui/button';

export default function Header() {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        { /* Placeholder for user profile / theme toggle down the line */ }
      </div>
    </header>
  );
}
