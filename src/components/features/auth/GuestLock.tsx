
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface GuestLockProps {
  featureName: string; // This is a translation key, e.g., 'guestLock.features.arcade'.
  featureDescription: string; // This is a translation key, e.g., 'guestLock.features.arcadeDesc'.
  Icon: LucideIcon;
}

export function GuestLock({ featureName, featureDescription, Icon }: GuestLockProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center h-full min-h-[calc(100vh-12rem)]">
        <Card className="w-full max-w-md text-center shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader>
            <div className="flex items-center justify-center mb-4">
                <Icon className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">{t('guestLock.unlockFeature', { featureName: t(featureName) })}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t(featureDescription)}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('guestLock.description')}
            </p>
        </CardContent>
        <CardContent className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild className="w-full sm:w-auto">
                <Link href="/sign-up">{t('guestLock.createAccount')}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/sign-in">{t('guestLock.signIn')}</Link>
            </Button>
        </CardContent>
        </Card>
    </div>
  );
}
