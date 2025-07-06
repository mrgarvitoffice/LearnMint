
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DefinitionChallenge } from '@/components/features/arcade/DefinitionChallenge';
import { Gamepad2, Puzzle, Crown, ExternalLink } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { GuestLock } from '@/components/features/auth/GuestLock';
import { useTranslation } from '@/hooks/useTranslation';

export default function ArcadePage() {
  const { user } = useAuth();
  const { speak, setVoicePreference } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const { t } = useTranslation();

  useEffect(() => {
    setVoicePreference('holo');
  }, [setVoicePreference]);

  useEffect(() => {
    const PAGE_TITLE = t('arcade.title');
    const timer = setTimeout(() => {
      if (!pageTitleSpokenRef.current) {
        speak(PAGE_TITLE, { priority: 'optional' });
        pageTitleSpokenRef.current = true;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [speak, t]);

  if (user?.isAnonymous) {
    return (
      <GuestLock
        featureName="guestLock.features.arcade"
        featureDescription="guestLock.features.arcadeDesc"
        Icon={Gamepad2}
      />
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="inline-block p-3 bg-primary/80 rounded-full mb-4 mx-auto">
            <Gamepad2 className="h-12 w-12 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
            {t('arcade.title')}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {t('arcade.description')}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="definition-challenge" className="w-full">
        <TabsList className="flex flex-wrap items-center justify-center rounded-md bg-muted p-1.5 text-muted-foreground gap-1.5 mb-6 h-auto sm:grid sm:grid-cols-3 sm:gap-2 sm:h-10 sm:p-1">
          <TabsTrigger value="definition-challenge" className="text-xs px-2.5 py-1.5 sm:text-sm sm:px-3 sm:py-1.5 flex items-center justify-center">
            <Puzzle className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-1.5" /> {t('arcade.tabs.challenge')}
          </TabsTrigger>
          <TabsTrigger value="dino-runner" className="text-xs px-2.5 py-1.5 sm:text-sm sm:px-3 sm:py-1.5 flex items-center justify-center">
            <ExternalLink className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-1.5" /> {t('arcade.tabs.dino')}
          </TabsTrigger>
          <TabsTrigger value="chess" className="text-xs px-2.5 py-1.5 sm:text-sm sm:px-3 sm:py-1.5 flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-1.5" /> {t('arcade.tabs.chess')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="definition-challenge">
          <DefinitionChallenge />
        </TabsContent>

        <TabsContent value="dino-runner">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>{t('arcade.dino.title')}</CardTitle>
              <CardDescription>{t('arcade.dino.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 p-8 bg-muted rounded-lg">
                <p className="text-muted-foreground">{t('arcade.dino.getReady')}</p>
                <Button asChild size="lg">
                  <a href="https://chromedino.com/" target="_blank" rel="noopener noreferrer">
                    {t('arcade.dino.playButton')} <ExternalLink className="w-4 h-4 ml-2"/>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chess">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>{t('arcade.chess.title')}</CardTitle>
              <CardDescription>{t('arcade.chess.description')}</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col items-center gap-4 p-8 bg-muted rounded-lg">
                <p className="text-muted-foreground">{t('arcade.chess.getReady')}</p>
                 <Button asChild size="lg">
                  <a href="https://www.chess.com/play/computer" target="_blank" rel="noopener noreferrer">
                    {t('arcade.chess.playButton')} <ExternalLink className="w-4 h-4 ml-2"/>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
