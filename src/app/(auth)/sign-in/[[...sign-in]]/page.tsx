
"use client";

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';

const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type SignInFormData = z.infer<typeof signInSchema>;
const EMAIL_FOR_SIGN_IN_KEY = 'learnmint-emailForSignIn';

export default function SignInPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isProcessingLink, setIsProcessingLink] = useState(true);

  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  // Effect to handle the magic link when the user returns to the page
  useEffect(() => {
    const processSignInLink = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
        if (!email) {
          // This can happen if the user opens the link on a different browser.
          // We can prompt them for their email again.
          email = window.prompt('Please provide your email to complete the sign-in');
          if (!email) {
            toast({ title: "Sign-in Cancelled", description: "Email is required to complete the sign-in process.", variant: "destructive" });
            setIsProcessingLink(false);
            return;
          }
        }

        try {
          const result = await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
          
          if (result.user) {
            const userRef = doc(db, 'users', result.user.uid);
            const docSnap = await getDoc(userRef);
            if (!docSnap.exists()) {
              await setDoc(userRef, {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.email?.split('@')[0],
                photoURL: result.user.photoURL,
                createdAt: serverTimestamp(),
              });
            }
          }
          
          toast({ title: "Sign-in Successful!", description: "You are now logged in." });
          router.replace('/');

        } catch (error: any) {
          console.error("Error signing in with email link:", error);
          toast({ title: "Sign-In Failed", description: "The sign-in link is invalid, expired, or has already been used.", variant: "destructive" });
          setIsProcessingLink(false);
        }
      } else {
        setIsProcessingLink(false);
      }
    };
    processSignInLink();
  }, [router, toast]);

  const onEmailSubmit = async (data: SignInFormData) => {
    setIsSubmitting(true);
    setEmailSent(false);

    const actionCodeSettings = {
      url: window.location.href, // This URL will be used to complete the sign-in.
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, data.email, actionCodeSettings);
      window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, data.email);
      toast({
        title: "Magic Link Sent!",
        description: `A sign-in link has been sent to ${data.email}. Please check your inbox.`,
      });
      setEmailSent(true);
    } catch (error: any) {
      console.error("Error sending sign in link:", error);
      toast({
        title: "Failed to Send Link",
        description: "Could not send sign-in link. Please check the email address and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isProcessingLink) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-3 text-lg">Checking for sign-in link...</p>
        </div>
    );
  }

  if (emailSent) {
    return (
       <Card className="w-full max-w-sm shadow-xl border-border/50 bg-card/80 backdrop-blur-lg">
        <CardHeader className="text-center">
          <MailCheck className="mx-auto h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl mt-4">Check Your Inbox</CardTitle>
          <CardDescription>A magic sign-in link has been sent to your email address. Click the link to log in.</CardDescription>
        </CardHeader>
        <CardContent>
           <Button variant="outline" className="w-full" onClick={() => setEmailSent(false)}>
            Use a different email
           </Button>
        </CardContent>
       </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm shadow-xl border-border/50 bg-card/80 backdrop-blur-lg">
      <CardHeader className="text-center">
        <Logo size={48} className="mx-auto mb-2" />
        <CardTitle className="text-2xl mt-2">Welcome to LearnMint</CardTitle>
        <CardDescription>Enter your email to get a magic sign-in link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} disabled={isSubmitting} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailCheck className="mr-2 h-4 w-4" />}
            Send Magic Link
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>
          This is a passwordless sign-in. No password required.
        </p>
      </CardFooter>
    </Card>
  );
}
