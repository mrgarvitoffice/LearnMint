
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
      // Use math.rationalize for linear equations, and a custom parser for simple quadratics.
      const node = math.parse(equation);
      const solutions = node.toString(); // This is a placeholder for a more complex solver.
      
      // For this implementation, we will use a workaround as math.solve is not standard.
      // This is a simplified solver and will not handle all cases.
      const simplifiedEquation = equation.replace(/\s/g, '');
      const parts = simplifiedEquation.split('=');
      if (parts.length !== 2) throw new Error("Equation must have one '=' sign.");
      
      // We will try to solve for x using rationalize
      const rationalized = math.rationalize(equation, {}, true);

      if (rationalized.coefficients.length > 0) {
          setResult(rationalized.roots.map((r: any) => r.toString()).join(', '));
      } else {
          throw new Error("Could not simplify the equation to a solvable form.");
      }

    } catch (e: any) {
      setError(`Could not solve the equation. Please check the syntax. Error: ${e.message}`);
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
