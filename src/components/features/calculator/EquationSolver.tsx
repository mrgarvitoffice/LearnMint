
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Variable, AlertTriangle } from 'lucide-react';
import * as math from 'mathjs';

export function EquationSolver() {
  const [equation, setEquation] = useState('x^2 + 2*x + 1 = 0');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const solve = () => {
    setError('');
    setResult('');
    if (!equation.trim()) {
      setError('Please enter an equation to solve.');
      return;
    }
    
    try {
      const solutions = math.solve(equation, 'x');
      setResult(solutions.map((sol: any) => sol.toString()).join(', '));
    } catch (e: any) {
      setError(`Could not solve the equation. Error: ${e.message}`);
    }
  };

  return (
    <Card className="w-full shadow-lg card-bg-2">
      <CardHeader>
        <CardTitle>Equation Solver</CardTitle>
        <CardDescription>
          Enter an equation to solve for 'x'. Use standard math notation (e.g., x^2 + 2*x - 3 = 0).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            value={equation} 
            onChange={(e) => setEquation(e.target.value)}
            placeholder="e.g., x^2 + 2*x + 1 = 0"
            className="font-mono bg-muted/50"
            onKeyDown={(e) => e.key === 'Enter' && solve()}
          />
          <Button onClick={solve}>Solve for x</Button>
        </div>
        {error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {result && (
             <Alert>
                <Variable className="h-4 w-4" />
                <AlertTitle>Solution(s)</AlertTitle>
                <AlertDescription>
                    <p className="font-mono text-lg">x = {result}</p>
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}
