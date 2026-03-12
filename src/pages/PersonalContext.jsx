import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Calendar, FileText, Clock, DollarSign, TrendingUp, Shield, Users, Battery, Home, Briefcase, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PersonalContext() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      console.error('Failed to load user', e);
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = async (field, value) => {
    try {
      await base44.auth.updateMe({ [field]: value });
      setUser({ ...user, [field]: value });
    } catch (e) {
      console.error('Failed to update user data', e);
    }
  };

  const getQuizProgress = () => {
    if (!user) return 0;
    const questions = ['quiz_q1', 'quiz_q2', 'quiz_q3', 'quiz_q4', 'quiz_q5', 'quiz_q6', 'quiz_q7'];
    return questions.filter((q) => user[q]).length;
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      await base44.auth.updateMe(user);
      setSaveMessage('All changes saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      setSaveMessage('Failed to save changes');
      console.error('Failed to save', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-800/50 rounded w-64" />
          <div className="h-64 bg-zinc-800/50 rounded" />
        </div>
      </div>);

  }

  return (
    <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex items-start gap-6">
        <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
          <User className="h-10 w-10 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold text-zinc-100">Personal Context</h1>
          <p className="mt-2 text-lg text-zinc-400">
            Your constraints and situation shape feasibility signals.
          </p>
        </div>
      </div>
      
      {/* Visual Explainer Card */}
      <Card className="bg-gradient-to-br from-teal-950/40 via-zinc-900/50 to-zinc-900/50 border-teal-800/30 p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-teal-950/50 border-2 border-teal-800/50 flex items-center justify-center">
                <Users className="h-12 w-12 text-teal-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-950/50 border-2 border-amber-800/50 flex items-center justify-center">
                <Shield className="h-4 w-4 text-amber-400" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 text-center lg:text-left">
            <h3 className="text-2xl font-semibold text-teal-100 mb-3">
              Everyone Has Unique Circumstances
            </h3>
            <p className="text-base text-teal-200/90 leading-relaxed mb-2">
              Your time, capital, skills, and life structure all affect what's truly feasible for you.
            </p>
            <p className="text-sm text-teal-300/70">
              Fill in your personal context below to get tailored feasibility analysis that matches your real situation.
            </p>
          </div>
          
          <div className="flex gap-3 lg:flex-col">
            <div className="flex items-center gap-2 text-teal-300/80">
              <Clock className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">Time</span>
            </div>
            <div className="flex items-center gap-2 text-teal-300/80">
              <DollarSign className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">Capital</span>
            </div>
            <div className="flex items-center gap-2 text-teal-300/80">
              <TrendingUp className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">Skills</span>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="constraints" className="w-full">
        <TabsList className="w-full bg-zinc-900/50 border border-zinc-800/50 p-2 grid grid-cols-3 h-14">
          <TabsTrigger value="constraints" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-base">
            Constraints
          </TabsTrigger>
          <TabsTrigger value="life-structure" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-base">
            Life Structure
          </TabsTrigger>
          <TabsTrigger value="quiz" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-base">
            Quiz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="constraints" className="mt-8">
          <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 lg:p-10">
            <div className="flex items-center gap-3 mb-8">
              <User className="h-6 w-6 text-teal-400" />
              <h2 className="text-xl font-semibold text-zinc-100">Constraints</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-zinc-300 flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5 text-zinc-500" />
                  Time Availability
                </Label>
                <Select
                  value={user?.time_availability || ''}
                  onValueChange={(value) => updateUserData('time_availability', value)}>

                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 text-base text-zinc-100">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="< 5 hours weekly">{'< 5 hours weekly'}</SelectItem>
                    <SelectItem value="5–10 hours weekly">5–10 hours weekly</SelectItem>
                    <SelectItem value="10–20 hours weekly">10–20 hours weekly</SelectItem>
                    <SelectItem value="20+ hours weekly">20+ hours weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-300 flex items-center gap-2 text-base">
                  <DollarSign className="h-5 w-5 text-zinc-500" />
                  Capital Range
                </Label>
                <Select
                  value={user?.capital_range || ''}
                  onValueChange={(value) => updateUserData('capital_range', value)}>

                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 text-base text-zinc-100">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$0">$0</SelectItem>
                    <SelectItem value="$100–$1k">$100–$1k</SelectItem>
                    <SelectItem value="$1k–$5k">$1k–$5k</SelectItem>
                    <SelectItem value="$5k+">$5k+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-300 flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-zinc-500" />
                  Skill Level
                </Label>
                <Select
                  value={user?.skill_level || ''}
                  onValueChange={(value) => updateUserData('skill_level', value)}>

                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 text-base text-zinc-100">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-300 flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-zinc-500" />
                  Risk Tolerance
                </Label>
                <Select
                  value={user?.risk_tolerance || ''}
                  onValueChange={(value) => updateUserData('risk_tolerance', value)}>

                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 text-base text-zinc-100">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-3">
              <Button
                onClick={handleSaveAll}
                disabled={saving}
                className="w-full md:w-auto px-8 h-12 bg-teal-500 hover:bg-teal-600 text-white text-base">

                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Saving...' : 'Save All'}
              </Button>
              {saveMessage &&
              <p className={`text-sm ${saveMessage.includes('success') ? 'text-teal-400' : 'text-red-400'}`}>
                  {saveMessage}
                </p>
              }
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="life-structure" className="mt-8">
          <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 lg:p-10">
            <div className="flex items-center gap-3 mb-8">
              <Home className="h-6 w-6 text-teal-400" />
              <h2 className="text-xl font-semibold text-zinc-100">Life Structure</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-zinc-300 flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-zinc-500" />
                  Schedule Predictability
                </Label>
                <Select
                  value={user?.schedule_predictability || ''}
                  onValueChange={(value) => updateUserData('schedule_predictability', value)}>

                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 text-base text-zinc-100">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Very Predictable">Very Predictable</SelectItem>
                    <SelectItem value="Somewhat Predictable">Somewhat Predictable</SelectItem>
                    <SelectItem value="Unpredictable">Unpredictable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-300 flex items-center gap-2 text-base">
                  <Battery className="h-5 w-5 text-zinc-500" />
                  Mental Energy (End of Day)
                </Label>
                <Select
                  value={user?.mental_energy || ''}
                  onValueChange={(value) => updateUserData('mental_energy', value)}>

                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 text-base text-zinc-100">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Depleted">Depleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-300 flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-zinc-500" />
                  Environment Support
                </Label>
                <Select
                  value={user?.environment_support || ''}
                  onValueChange={(value) => updateUserData('environment_support', value)}>

                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 text-base text-zinc-100">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Very Supportive">Very Supportive</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                    <SelectItem value="Unsupportive">Unsupportive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-300 flex items-center gap-2 text-base">
                  <Home className="h-5 w-5 text-zinc-500" />
                  Dependents
                </Label>
                <Select
                  value={user?.dependents || ''}
                  onValueChange={(value) => updateUserData('dependents', value)}>

                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 text-base text-zinc-100">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-300 flex items-center gap-2 text-base">
                  <DollarSign className="h-5 w-5 text-zinc-500" />
                  Income Urgency
                </Label>
                <Select
                  value={user?.income_urgency || ''}
                  onValueChange={(value) => updateUserData('income_urgency', value)}>

                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 text-base text-zinc-100">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No urgency">No urgency</SelectItem>
                    <SelectItem value="Would be nice">Would be nice</SelectItem>
                    <SelectItem value="Needed within 6 months">Needed within 6 months</SelectItem>
                    <SelectItem value="Needed immediately">Needed immediately</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-300 flex items-center gap-2 text-base">
                  <Briefcase className="h-5 w-5 text-zinc-500" />
                  Primary Life Load
                </Label>
                <Select
                  value={user?.primary_life_load || ''}
                  onValueChange={(value) => updateUserData('primary_life_load', value)}>

                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 text-base text-zinc-100">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time job">Full-time job</SelectItem>
                    <SelectItem value="Part-time job">Part-time job</SelectItem>
                    <SelectItem value="School or studying">School or studying</SelectItem>
                    <SelectItem value="Caregiving">Caregiving</SelectItem>
                    <SelectItem value="Multiple responsibilities">Multiple responsibilities</SelectItem>
                    <SelectItem value="Flexible or minimal">Flexible or minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-3">
              <Button
                onClick={handleSaveAll}
                disabled={saving}
                className="w-full md:w-auto px-8 h-12 bg-teal-500 hover:bg-teal-600 text-white text-base">

                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Saving...' : 'Save All'}
              </Button>
              {saveMessage &&
              <p className={`text-sm ${saveMessage.includes('success') ? 'text-teal-400' : 'text-red-400'}`}>
                  {saveMessage}
                </p>
              }
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="quiz" className="mt-8">
          <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 lg:p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-teal-400" />
                <h2 className="text-xl font-semibold text-zinc-100">Situational Assessment</h2>
              </div>
              <span className="text-base text-zinc-500">{getQuizProgress()} of 7 answered</span>
            </div>
            
            <div className="space-y-10">
              {/* Question 1 */}
              <div className="space-y-4">
                <Label className="text-zinc-300 text-lg font-medium">1. When you start a new project, you tend to:</Label>
                <RadioGroup
                  value={user?.quiz_q1 || ''}
                  onValueChange={(value) => updateUserData('quiz_q1', value)}
                  className="space-y-3">

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Research extensively before beginning" id="q1-a" />
                    <Label htmlFor="q1-a" className="text-zinc-300 cursor-pointer flex-1 text-base">Research extensively before beginning</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Jump in and learn as you go" id="q1-b" />
                    <Label htmlFor="q1-b" className="text-zinc-300 cursor-pointer flex-1 text-base">Jump in and learn as you go</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Look for step-by-step guides to follow" id="q1-c" />
                    <Label htmlFor="q1-c" className="text-zinc-300 cursor-pointer flex-1 text-base">Look for step-by-step guides to follow</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Question 2 */}
              <div className="space-y-4">
                <Label className="text-zinc-300 text-lg font-medium">2. If a method you're following isn't working after two weeks, you:</Label>
                <RadioGroup
                  value={user?.quiz_q2 || ''}
                  onValueChange={(value) => updateUserData('quiz_q2', value)}
                  className="space-y-3">

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Try a different approach" id="q2-a" />
                    <Label htmlFor="q2-a" className="text-zinc-300 cursor-pointer flex-1 text-base">Try a different approach</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Give it more time before deciding" id="q2-b" />
                    <Label htmlFor="q2-b" className="text-zinc-300 cursor-pointer flex-1 text-base">Give it more time before deciding</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Feel frustrated and question the whole idea" id="q2-c" />
                    <Label htmlFor="q2-c" className="text-zinc-300 cursor-pointer flex-1 text-base">Feel frustrated and question the whole idea</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Question 3 */}
              <div className="space-y-4">
                <Label className="text-zinc-300 text-lg font-medium">3. At the end of a long day, you have energy for:</Label>
                <RadioGroup
                  value={user?.quiz_q3 || ''}
                  onValueChange={(value) => updateUserData('quiz_q3', value)}
                  className="space-y-3">

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Focused work on something important" id="q3-a" />
                    <Label htmlFor="q3-a" className="text-zinc-300 cursor-pointer flex-1 text-base">Focused work on something important</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Light tasks that don't require much thinking" id="q3-b" />
                    <Label htmlFor="q3-b" className="text-zinc-300 cursor-pointer flex-1 text-base">Light tasks that don't require much thinking</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Rest only" id="q3-c" />
                    <Label htmlFor="q3-c" className="text-zinc-300 cursor-pointer flex-1 text-base">Rest only</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Question 4 */}
              <div className="space-y-4">
                <Label className="text-zinc-300 text-lg font-medium">4. When learning something new and technical, you:</Label>
                <RadioGroup
                  value={user?.quiz_q4 || ''}
                  onValueChange={(value) => updateUserData('quiz_q4', value)}
                  className="space-y-3">

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Pick it up quickly with minimal guidance" id="q4-a" />
                    <Label htmlFor="q4-a" className="text-zinc-300 cursor-pointer flex-1 text-base">Pick it up quickly with minimal guidance</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Need clear examples but can figure it out" id="q4-b" />
                    <Label htmlFor="q4-b" className="text-zinc-300 cursor-pointer flex-1 text-base">Need clear examples but can figure it out</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Struggle without hands-on help" id="q4-c" />
                    <Label htmlFor="q4-c" className="text-zinc-300 cursor-pointer flex-1 text-base">Struggle without hands-on help</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Question 5 */}
              <div className="space-y-4">
                <Label className="text-zinc-300 text-lg font-medium">5. Your typical week schedule is:</Label>
                <RadioGroup
                  value={user?.quiz_q5 || ''}
                  onValueChange={(value) => updateUserData('quiz_q5', value)}
                  className="space-y-3">

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Consistent and predictable" id="q5-a" />
                    <Label htmlFor="q5-a" className="text-zinc-300 cursor-pointer flex-1 text-base">Consistent and predictable</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Varies but has some patterns" id="q5-b" />
                    <Label htmlFor="q5-b" className="text-zinc-300 cursor-pointer flex-1 text-base">Varies but has some patterns</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Unpredictable and changes often" id="q5-c" />
                    <Label htmlFor="q5-c" className="text-zinc-300 cursor-pointer flex-1 text-base">Unpredictable and changes often</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Question 6 */}
              <div className="space-y-4">
                <Label className="text-zinc-300 text-lg font-medium">6. When you hit an obstacle, you typically:</Label>
                <RadioGroup
                  value={user?.quiz_q6 || ''}
                  onValueChange={(value) => updateUserData('quiz_q6', value)}
                  className="space-y-3">

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Pause and problem-solve" id="q6-a" />
                    <Label htmlFor="q6-a" className="text-zinc-300 cursor-pointer flex-1 text-base">Pause and problem-solve</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Ask for help or look for answers" id="q6-b" />
                    <Label htmlFor="q6-b" className="text-zinc-300 cursor-pointer flex-1 text-base">Ask for help or look for answers</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Feel stuck and lose momentum" id="q6-c" />
                    <Label htmlFor="q6-c" className="text-zinc-300 cursor-pointer flex-1 text-base">Feel stuck and lose momentum</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Question 7 */}
              <div className="space-y-4">
                <Label className="text-zinc-300 text-lg font-medium">7. How do you feel about ambiguous instructions?</Label>
                <RadioGroup
                  value={user?.quiz_q7 || ''}
                  onValueChange={(value) => updateUserData('quiz_q7', value)}
                  className="space-y-3">

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Comfortable figuring things out" id="q7-a" />
                    <Label htmlFor="q7-a" className="text-zinc-300 cursor-pointer flex-1 text-base">Comfortable figuring things out</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Prefer some structure but can adapt" id="q7-b" />
                    <Label htmlFor="q7-b" className="text-zinc-300 cursor-pointer flex-1 text-base">Prefer some structure but can adapt</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <RadioGroupItem value="Need clear, specific guidance" id="q7-c" />
                    <Label htmlFor="q7-c" className="text-zinc-300 cursor-pointer flex-1 text-base">Need clear, specific guidance</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-3">
              <Button
                onClick={handleSaveAll}
                disabled={saving}
                className="w-full md:w-auto px-8 h-12 bg-teal-500 hover:bg-teal-600 text-white text-base">

                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Saving...' : 'Save All'}
              </Button>
              {saveMessage &&
              <p className={`text-sm ${saveMessage.includes('success') ? 'text-teal-400' : 'text-red-400'}`}>
                  {saveMessage}
                </p>
              }
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

}