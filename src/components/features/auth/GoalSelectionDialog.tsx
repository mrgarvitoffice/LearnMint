
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { COLLEGE_DATA, GOAL_CARDS_DATA, NEWS_COUNTRIES } from '@/lib/constants';
import type { UserGoal, GoalType } from '@/lib/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface GoalSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GoalCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  goalType: GoalType;
  isSelected: boolean;
  onSelect: (type: GoalType) => void;
}

const GoalCard = ({ icon: Icon, title, description, goalType, isSelected, onSelect }: GoalCardProps) => (
    <motion.div whileHover={{ y: -4, scale: 1.03 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card
        className={cn(
          "text-left p-4 cursor-pointer hover:shadow-primary/20 transition-all flex items-start gap-4 h-full relative overflow-hidden group bg-cover bg-center",
          isSelected && "ring-2 ring-primary shadow-primary/20"
        )}
        style={{ backgroundImage: "url('/icons/1.jpg')" }}
        onClick={() => onSelect(goalType)}
      >
        <div className="absolute inset-0 bg-background/80 group-hover:bg-background/70 transition-colors z-0"></div>
        <div className="relative z-10 flex items-start gap-4">
            <Icon className="h-7 w-7 text-primary mt-1 shrink-0" />
            <div>
                <h4 className="font-semibold">{title}</h4>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
      </Card>
    </motion.div>
  );


export function GoalSelectionDialog({ isOpen, onClose }: GoalSelectionDialogProps) {
  const { userGoal, setUserGoal } = useSettings();
  const { toast } = useToast();

  const [selectedCountry, setSelectedCountry] = useState(userGoal?.country || 'us');
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(userGoal?.type || null);
  
  const [university, setUniversity] = useState(userGoal?.type === 'college' ? userGoal.university || '' : '');
  const [program, setProgram] = useState(userGoal?.type === 'college' ? userGoal.program || '' : '');
  const [branch, setBranch] = useState(userGoal?.type === 'college' ? userGoal.branch || '' : '');
  const [semester, setSemester] = useState(userGoal?.type === 'college' ? userGoal.semester || '' : '');

  useEffect(() => {
    if (isOpen) {
        setSelectedCountry(userGoal?.country || 'us');
        setSelectedGoal(userGoal?.type || null);
        if (userGoal?.type === 'college') {
            setUniversity(userGoal.university || '');
            setProgram(userGoal.program || '');
            setBranch(userGoal.branch || '');
            setSemester(userGoal.semester || '');
        } else {
            setUniversity('');
            setProgram('');
            setBranch('');
            setSemester('');
        }
    }
  }, [isOpen, userGoal]);

  const handleSaveGoal = () => {
    let goalData: UserGoal;
    
    switch(selectedGoal) {
        case 'college':
            if (!university || !program || !branch || !semester) {
                toast({ title: "Incomplete Selection", description: "Please select all college options to save your goal.", variant: "destructive" });
                return;
            }
            goalData = { type: 'college', country: selectedCountry, university, program, branch, semester };
            break;
        case null:
             toast({ title: "No Goal Selected", description: "Please select a goal to continue.", variant: "destructive" });
             return;
        default:
            goalData = { type: selectedGoal, country: selectedCountry };
    }
    
    setUserGoal(goalData);
    toast({ title: "Goal Updated!", description: "Your learning experience has been personalized." });
    onClose();
  };
  
  const handleSelectGoalType = (type: GoalType) => {
    setSelectedGoal(prev => prev === type ? null : type);
  }

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    // If the currently selected goal is India-specific, reset it.
    const currentGoalInfo = GOAL_CARDS_DATA.find(g => g.type === selectedGoal);
    if (countryCode !== 'in' && currentGoalInfo?.location === 'in') {
      setSelectedGoal(null);
    }
  }

  const filteredGoals = useMemo(() => {
    return GOAL_CARDS_DATA.filter(goal => {
      if (selectedCountry === 'in') {
        return goal.location === 'global' || goal.location === 'in';
      }
      return goal.location === 'global';
    });
  }, [selectedCountry]);

  const universities = Object.keys(COLLEGE_DATA);
  const programs = university ? Object.keys(COLLEGE_DATA[university as keyof typeof COLLEGE_DATA].programs) : [];
  const branches = university && program ? Object.keys(COLLEGE_DATA[university as keyof typeof COLLEGE_DATA].programs[program].branches) : [];
  
  const currentBranchData = university && program && branch && COLLEGE_DATA[university as keyof typeof COLLEGE_DATA]?.programs[program]?.branches[branch];
  const semesters = currentBranchData ? Object.keys(currentBranchData.semesters) : [];
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl text-center">Customize Your Experience</DialogTitle>
          <DialogDescription className="text-center">Start by selecting your country, then choose a goal.</DialogDescription>
        </DialogHeader>
        <div className="px-6 space-y-4 max-h-[60vh] overflow-y-auto">
             <div className="space-y-2">
                <Label htmlFor="country-select">First, select your country</Label>
                <Select value={selectedCountry} onValueChange={handleCountryChange}>
                    <SelectTrigger id="country-select" className="w-full">
                        <SelectValue placeholder="Select Country..." />
                    </SelectTrigger>
                    <SelectContent>
                        {NEWS_COUNTRIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                 {filteredGoals.map(goal => (
                    <GoalCard 
                        key={goal.type}
                        icon={goal.icon}
                        title={goal.title}
                        description={goal.description}
                        goalType={goal.type as GoalType}
                        isSelected={selectedGoal === goal.type}
                        onSelect={handleSelectGoalType}
                    />
                 ))}
            </div>
            
            {selectedGoal === 'college' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
                    <Card className="p-4 bg-muted/50 mt-4">
                        <CardContent className="p-0 pt-4 space-y-4">
                            <Select onValueChange={setUniversity} value={university}>
                              <SelectTrigger><SelectValue placeholder="Select University/Board" /></SelectTrigger>
                              <SelectContent>
                                {universities.map(uni => (
                                  <SelectItem key={uni} value={uni}>{COLLEGE_DATA[uni as keyof typeof COLLEGE_DATA].name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select onValueChange={setProgram} value={program} disabled={!university}>
                              <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                              <SelectContent>
                                {programs.map(prog => (
                                  <SelectItem key={prog} value={prog}>{COLLEGE_DATA[university as keyof typeof COLLEGE_DATA].programs[prog as keyof typeof COLLEGE_DATA[typeof university]['programs']].name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select onValueChange={setBranch} value={branch} disabled={!program}>
                              <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                              <SelectContent>
                                {branches.map(br => (
                                  <SelectItem key={br} value={br}>{br}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select onValueChange={setSemester} value={semester} disabled={!branch}>
                              <SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger>
                              <SelectContent>
                                {semesters.map(sem => (
                                  <SelectItem key={sem} value={sem}>{sem} Semester</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
        <DialogFooter className="p-6 pt-4">
          <Button onClick={handleSaveGoal} disabled={!selectedGoal} className="w-full">
            Save & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
