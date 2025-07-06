
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Profile',
  description: 'Manage your LearnMint account settings and track your daily quest progress.',
};

"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useQuests } from '@/contexts/QuestContext';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, KeyRound, LogOut, CheckCircle, Brain, User } from 'lucide-react';

const DailyQuestItem = ({ isCompleted, text }: { isCompleted: boolean; text: string }) => (
    <div className={cn("flex items-center gap-3 p-3 bg-muted/50 rounded-md", isCompleted && "text-muted-foreground line-through")}>
        {isCompleted ? (
            <CheckCircle className="text-green-500 h-5 w-5 shrink-0" />
        ) : (
            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/50" />
            </div>
        )}
        <span className="text-sm">{text}</span>
    </div>
);

export default function ProfilePage() {
  const { user, signOutUser } = useAuth();
  const { quests } = useQuests();
  const { t } = useTranslation();

  if (!user) {
    // This can happen briefly during a redirect or if state is not synced.
    // The layout should handle the definitive redirect.
    return null;
  }

  const userDisplayName = user.displayName || user.email?.split('@')[0] || "User";

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm text-center">
          <CardHeader>
              <Avatar className="mx-auto h-24 w-24 text-primary/80 border-4 border-primary/30">
                <AvatarImage src={user.isAnonymous ? '' : user.photoURL || ''} alt={userDisplayName} />
                <AvatarFallback className="text-4xl bg-secondary">
                    {user.isAnonymous ? <User className="h-10 w-10"/> : userDisplayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-3xl font-bold text-primary mt-4">
                Hi, {user.isAnonymous ? 'Guest' : userDisplayName}!
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-1">
                  {user.isAnonymous 
                    ? "You are browsing as a guest. Sign up to save your progress!" 
                    : "Manage your account and track your daily progress."
                  }
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-left px-4 sm:px-6">
             <div className="space-y-3">
               <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                 <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                 <div>
                   <p className="text-xs text-muted-foreground">Email</p>
                   {user.isAnonymous ? (
                     <p className="italic text-muted-foreground/80">Sign up to add an email.</p>
                   ) : (
                     <p className="font-semibold break-all">{user.email}</p>
                   )}
                 </div>
               </div>
               <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                 <KeyRound className="h-5 w-5 text-muted-foreground shrink-0" />
                 <div>
                   <p className="text-xs text-muted-foreground">User ID</p>
                   <p className="font-mono text-xs break-all">{user.uid}</p>
                 </div>
               </div>
            </div>

            <Card className="bg-background/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                        <Brain className="text-primary"/> Daily Quests
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <DailyQuestItem isCompleted={quests.quest1Completed} text={t('dashboard.dailyQuests.quest1')} />
                    <DailyQuestItem isCompleted={quests.quest2Completed} text={t('dashboard.dailyQuests.quest2')} />
                    <DailyQuestItem isCompleted={quests.quest3Completed} text={t('dashboard.dailyQuests.quest3')} />
                </CardContent>
            </Card>

            {user.isAnonymous && (
                <Card className="mt-4 border-primary/30 bg-primary/10 text-center p-4">
                    <CardTitle className="text-lg text-primary">Unlock Full Potential!</CardTitle>
                    <CardDescription className="text-primary/80 mt-1">Sign up to save your progress permanently.</CardDescription>
                    <Button asChild className="mt-3">
                        <Link href="/sign-up">Sign Up Now</Link>
                    </Button>
                </Card>
            )}

             <Button onClick={signOutUser} variant="destructive" className="w-full mt-4">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
             </Button>
          </CardContent>
      </Card>
    </div>
  );
}
