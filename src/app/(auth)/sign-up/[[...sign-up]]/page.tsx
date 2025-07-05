"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Chrome } from 'lucide-react';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/icons/Logo';

const signUpSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const isAnyLoading = isLoadingEmail || isLoadingGoogle;

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onEmailSubmit = async (data: SignUpFormData) => {
    setIsLoadingEmail(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.email?.split('@')[0],
        photoURL: '',
        createdAt: serverTimestamp(),
      });
      toast({ title: "Account created!", description: "Redirecting to your dashboard..." });
      router.replace('/'); // Navigate to dashboard on success
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: "Sign Up Failed",
        description: error.code === 'auth/email-already-in-use' 
          ? "This email is already in use. Please sign in instead."
          : "An unexpected error occurred during sign-up.",
        variant: "destructive",
      });
    } finally {
       setIsLoadingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    const provider = new GoogleAuthProvider();
    // The redirect will be handled by the logic on the sign-in page
    await signInWithRedirect(auth, provider).catch((error) => {
        console.error("Google Sign In Redirect Error:", error);
        toast({ title: "Could not start Google Sign-In", description: "Please try again.", variant: "destructive" });
        setIsLoadingGoogle(false);
    });
  };

  return (
    <Card className="w-full max-w-sm shadow-xl border-border/50 bg-card/80 backdrop-blur-lg">
      <CardHeader className="text-center">
        <Logo size={48} className="mx-auto mb-2" />
        <CardTitle className="text-2xl mt-2">Create an Account</CardTitle>
        <CardDescription>Join LearnMint to start your AI-powered learning journey.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isAnyLoading}>
          {isLoadingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4" />}
          Sign Up with Google
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or with Email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} disabled={isAnyLoading} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} disabled={isAnyLoading} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isAnyLoading}>
            {isLoadingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up
          </Button>
        </form>
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
