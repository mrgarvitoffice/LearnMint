
"use client";

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/icons/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" className="mr-2 h-4 w-4">
      <path fill="#4285F4" d="M21.35 11.1h-9.2v2.7h5.3c-.2 1-1.2 3.2-5.3 3.2-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8c1.8 0 3 .8 3.7 1.5l2.2-2.2C17.2 3.2 14.8 2 12.15 2c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.8 0 9.7-4.1 9.7-9.8 0-.6-.1-1.1-.3-1.6z"/>
    </svg>
  );
}

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const { toast } = useToast();
  const { signUpWithEmail, signInWithGoogleRedirect } = useAuth();
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleEmailSignUp = async (data: FormData) => {
    setIsEmailSubmitting(true);
    try {
      await signUpWithEmail(data.email, data.password);
      toast({ title: "Account Created!", description: "Welcome to LearnMint! Redirecting you..." });
      // Navigation is handled by the AuthLayout
    } catch (error: any) {
      console.error("Error signing up with email:", error);
      toast({ title: "Sign-up Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogleRedirect();
      // Redirect is handled by Firebase
    } catch (error: any) {
      console.error("Error initiating Google sign-up:", error);
      toast({ title: "Sign-up Error", description: error.message, variant: "destructive" });
      setIsGoogleSubmitting(false);
    }
  };
  
  const isAnyLoading = isEmailSubmitting || isGoogleSubmitting;

  return (
    <Card className="w-full max-w-sm shadow-xl border-border/50 bg-card/80 backdrop-blur-lg">
      <CardHeader className="text-center">
        <Logo size={48} className="mx-auto mb-2" />
        <CardTitle className="text-2xl mt-2">Create an Account</CardTitle>
        <CardDescription>Join LearnMint to unlock all features.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleEmailSignUp)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="your@email.com" {...register('email')} disabled={isAnyLoading} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} disabled={isAnyLoading} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} disabled={isAnyLoading} />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isAnyLoading}>
             {isEmailSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up with Email
          </Button>
        </form>

        <div className="relative my-4">
          <Separator className="my-1" />
          <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            OR
          </p>
        </div>

        <Button onClick={handleGoogleSignUp} variant="outline" className="w-full" disabled={isAnyLoading}>
          {isGoogleSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon />}
          Sign Up with Google
        </Button>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>
          Already have an account?{' '}
          <Link href="/sign-in" className="font-semibold text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
