
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, KeyRound, LogOut, CheckCircle, Brain, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuests } from '@/contexts/QuestContext';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { GuestLock } from '@/components/features/auth/GuestLock';

// A local component to display each quest item cleanly.
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
  const { user, loading, signOutUser } = useAuth();
  const { quests } = useQuests();
  const { t } = useTranslation();

  // Show a loading screen while auth is resolving.
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Loading Profile...</p>
      </div>
    );
  }

  // Handle guest users specifically for the profile page by showing the GuestLock component.
  if (user?.isAnonymous) {
    return <GuestLock featureName="Profile" message="Please sign in or create an account to view your profile." />;
  }

  // The main app layout handles the case where user is null, so this is an extra guard.
  if (!user) {
    return null; 
  }

  const userDisplayName = user.displayName || user.email?.split('@')[0] || "User";

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm text-center">
          <CardHeader>
              <Avatar className="mx-auto h-24 w-24 text-primary/80 border-4 border-primary/30">
                <AvatarImage src={user.photoURL || ''} alt={userDisplayName} />
                <AvatarFallback className="text-4xl bg-secondary">
                    {userDisplayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-3xl font-bold text-primary mt-4">
                Hi, {userDisplayName}!
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-1">
                  Manage your account and track your daily progress.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-left px-4 sm:px-6">
             <div className="space-y-3">
               <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                 <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                 <div>
                   <p className="text-xs text-muted-foreground">Email</p>
                   <p className="font-semibold truncate">{user.email}</p>
                 </div>
               </div>
               <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                 <KeyRound className="h-5 w-5 text-muted-foreground shrink-0" />
                 <div>
                   <p className="text-xs text-muted-foreground">User ID</p>
                   <p className="font-mono text-xs truncate">{user.uid}</p>
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

             <Button onClick={signOutUser} variant="destructive" className="w-full mt-4">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
             </Button>

          </CardContent>
      </Card>
    </div>
  );
}
