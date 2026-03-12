import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, Clock, DollarSign, Briefcase, Heart } from 'lucide-react';
import FeasixWordmark from '@/components/brand/FeasixWordmark';

const LIFE_LOADS = [
  { value: 'Full-time job', label: 'Full-time job', emoji: '💼' },
  { value: 'Part-time job', label: 'Part-time job', emoji: '⏰' },
  { value: 'School or studying', label: 'Student', emoji: '📚' },
  { value: 'Caregiving', label: 'Caregiver', emoji: '🏠' },
  { value: 'Multiple responsibilities', label: 'Multiple roles', emoji: '🔄' },
  { value: 'Flexible or minimal', label: 'Flexible', emoji: '✨' },
];

const TIME_OPTIONS = [
  { value: '< 5 hours weekly', label: '< 5 hrs/week', sub: 'Very limited' },
  { value: '5–10 hours weekly', label: '5–10 hrs/week', sub: 'A few evenings' },
  { value: '10–20 hours weekly', label: '10–20 hrs/week', sub: 'Part-time hustle' },
  { value: '20+ hours weekly', label: '20+ hrs/week', sub: 'Serious commitment' },
];

const CAPITAL_OPTIONS = [
  { value: '$0', label: '$0', sub: 'Starting from scratch' },
  { value: '$100–$1k', label: '$100–$1k', sub: 'Bootstrapping' },
  { value: '$1k–$5k', label: '$1k–$5k', sub: 'Some budget' },
  { value: '$5k+', label: '$5k+', sub: 'Ready to invest' },
];

const URGENCY_OPTIONS = [
  { value: 'No urgency', label: 'No urgency', emoji: '😌' },
  { value: 'Would be nice', label: 'Would be nice', emoji: '🙂' },
  { value: 'Needed within 6 months', label: 'Within 6 months', emoji: '⏳' },
  { value: 'Needed immediately', label: 'ASAP', emoji: '🔥' },
];

const TOTAL_STEPS = 6;

const LOADING_MESSAGES = [
  'Building your advisor profile...',
  'Mapping your constraints and resources...',
  'Calibrating venture filters...',
  'Identifying relevant opportunities...',
  'Preparing your workspace...',
  'Almost ready...',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    full_name: '',
    age: '',
    hobbies: '',
    primary_life_load: '',
    time_availability: '',
    capital_range: '',
    income_urgency: '',
  });
  const [saving, setSaving] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) setData(d => ({ ...d, full_name: u.full_name || '' }));
    });
  }, []);

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const canProceed = () => {
    if (step === 1) return data.full_name.trim().length > 0;
    if (step === 2) return !!data.primary_life_load && !!data.time_availability;
    if (step === 3) return !!data.capital_range && !!data.income_urgency;
    return true;
  };

  const finish = async () => {
    setSaving(true);
    setStep(5); // go to loading screen
    base44.auth.updateMe({
      full_name: data.full_name,
      age: data.age ? parseInt(data.age) : undefined,
      hobbies: data.hobbies,
      primary_life_load: data.primary_life_load,
      time_availability: data.time_availability,
      capital_range: data.capital_range,
      income_urgency: data.income_urgency,
      onboarding_complete: true,
    });
  };

  useEffect(() => {
    if (step !== 5) return;
    const msgInterval = setInterval(() => {
      setLoadingMsgIndex(i => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 800);
    const navTimer = setTimeout(() => navigate(createPageUrl('Dashboard')), 5000);
    return () => { clearInterval(msgInterval); clearTimeout(navTimer); };
  }, [step]);

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  const OptionCard = ({ selected, onClick, children, className = '' }) => (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl border text-left transition-all ${
        selected
          ? 'border-teal-500 bg-teal-500/10 text-zinc-100'
          : 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
      } ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      {/* Progress bar */}
      {step > 0 && step < TOTAL_STEPS - 1 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-zinc-800 z-50">
          <motion.div
            className="h-full bg-teal-500"
            animate={{ width: `${((step) / (TOTAL_STEPS - 2)) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full max-w-md"
        >

          {/* Step 0 — Welcome */}
          {step === 0 && (
            <div className="text-center space-y-8">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-teal-500/15 border-2 border-teal-500/30 flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-teal-400" />
                </div>
              </div>
              <div>
                <div className="flex justify-center mb-4">
                  <FeasixWordmark showIcon={false} className="text-4xl font-bold text-zinc-100" />
                </div>
                <p className="text-xl text-zinc-300 font-medium">Your AI Venture Advisor.</p>
                <p className="mt-3 text-base text-zinc-500 leading-relaxed">
                  Most people explore entrepreneurship alone — watching videos, reading advice, and guessing what's realistic. Feasix gives you a structured advisor to help you evaluate what ventures actually require before committing time or money.
                </p>
              </div>
              <p className="text-sm text-zinc-600">A quick profile setup so we can tailor guidance to your real situation.</p>
              <Button
                onClick={next}
                className="w-full h-14 text-base bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl"
              >
                Begin setup <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Step 1 — About you */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <p className="text-teal-400 text-xs font-bold tracking-widest uppercase mb-3">Step 1 of 4</p>
                <h2 className="text-3xl font-bold text-zinc-100">What should we call you?</h2>
                <p className="mt-2 text-zinc-500">Your advisor needs a name to work with. Age helps contextualize your timeline and risk profile.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Your name</label>
                  <Input
                    value={data.full_name}
                    onChange={e => setData(d => ({ ...d, full_name: e.target.value }))}
                    placeholder="e.g. Alex"
                    className="h-12 bg-zinc-900 border-zinc-700 text-zinc-100 text-base rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">
                    Age <span className="text-zinc-600">(optional)</span>
                  </label>
                  <Input
                    type="number"
                    value={data.age}
                    onChange={e => setData(d => ({ ...d, age: e.target.value }))}
                    placeholder="e.g. 25"
                    className="h-12 bg-zinc-900 border-zinc-700 text-zinc-100 text-base rounded-xl"
                    min={13} max={100}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={back} className="flex-1 h-12 text-zinc-500 hover:text-zinc-300">Back</Button>
                <Button
                  onClick={next}
                  disabled={!canProceed()}
                  className="flex-1 h-12 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl disabled:opacity-40"
                >
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Life situation */}
          {step === 2 && (
            <div className="space-y-7">
              <div>
                <p className="text-teal-400 text-xs font-bold tracking-widest uppercase mb-3">Step 2 of 4</p>
                <h2 className="text-3xl font-bold text-zinc-100">What's your current load?</h2>
                <p className="mt-2 text-zinc-500">Most business advice ignores how much bandwidth you actually have. This shapes which ventures are structurally realistic for you.</p>
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Primary life load
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LIFE_LOADS.map(opt => (
                    <OptionCard
                      key={opt.value}
                      selected={data.primary_life_load === opt.value}
                      onClick={() => setData(d => ({ ...d, primary_life_load: opt.value }))}
                    >
                      <span className="mr-1.5 text-sm">{opt.emoji}</span>
                      <span className="text-sm">{opt.label}</span>
                    </OptionCard>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Hours you can commit per week
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_OPTIONS.map(opt => (
                    <OptionCard
                      key={opt.value}
                      selected={data.time_availability === opt.value}
                      onClick={() => setData(d => ({ ...d, time_availability: opt.value }))}
                    >
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{opt.sub}</p>
                    </OptionCard>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={back} className="flex-1 h-12 text-zinc-500 hover:text-zinc-300">Back</Button>
                <Button
                  onClick={next}
                  disabled={!canProceed()}
                  className="flex-1 h-12 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl disabled:opacity-40"
                >
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — Resources */}
          {step === 3 && (
            <div className="space-y-7">
              <div>
                <p className="text-teal-400 text-xs font-bold tracking-widest uppercase mb-3">Step 3 of 4</p>
                <h2 className="text-3xl font-bold text-zinc-100">Capital & urgency</h2>
                <p className="mt-2 text-zinc-500">Capital requirements are one of the most commonly omitted details in business content. Knowing yours lets us surface that friction honestly.</p>
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Capital you're willing to invest
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CAPITAL_OPTIONS.map(opt => (
                    <OptionCard
                      key={opt.value}
                      selected={data.capital_range === opt.value}
                      onClick={() => setData(d => ({ ...d, capital_range: opt.value }))}
                    >
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{opt.sub}</p>
                    </OptionCard>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-3 block">How urgently do you need income?</label>
                <div className="grid grid-cols-2 gap-2">
                  {URGENCY_OPTIONS.map(opt => (
                    <OptionCard
                      key={opt.value}
                      selected={data.income_urgency === opt.value}
                      onClick={() => setData(d => ({ ...d, income_urgency: opt.value }))}
                    >
                      <span className="mr-1.5 text-sm">{opt.emoji}</span>
                      <span className="text-sm">{opt.label}</span>
                    </OptionCard>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={back} className="flex-1 h-12 text-zinc-500 hover:text-zinc-300">Back</Button>
                <Button
                  onClick={next}
                  disabled={!canProceed()}
                  className="flex-1 h-12 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl disabled:opacity-40"
                >
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 — Interests */}
          {step === 4 && (
            <div className="space-y-8">
              <div>
                <p className="text-teal-400 text-xs font-bold tracking-widest uppercase mb-3">Step 4 of 4</p>
                <h2 className="text-3xl font-bold text-zinc-100">Interests & background</h2>
                <p className="mt-2 text-zinc-500">Relevant experience and genuine interest are often the deciding factors in whether a venture is worth pursuing. What do you actually know and care about?</p>
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Skills, interests, or past experience
                </label>
                <textarea
                  value={data.hobbies}
                  onChange={e => setData(d => ({ ...d, hobbies: e.target.value }))}
                  placeholder="e.g. fitness, marketing, coding, design, sales, cooking..."
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 text-base placeholder:text-zinc-600 focus:outline-none focus:border-teal-600 resize-none"
                />
                <p className="text-xs text-zinc-600 mt-2">
                  Ventures that align with existing skills tend to have significantly lower friction at execution. Be specific.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={back} className="flex-1 h-12 text-zinc-500 hover:text-zinc-300">Back</Button>
                <Button
                  onClick={finish}
                  disabled={saving}
                  className="flex-1 h-12 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl"
                >
                  {saving ? 'Saving...' : 'Start exploring →'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5 — Loading */}
          {step === 5 && (
            <div className="text-center space-y-10">
              {/* Animated rings */}
              <div className="flex justify-center">
                <div className="relative w-28 h-28">
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-teal-500/20"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute inset-3 rounded-full border-2 border-teal-500/30"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                  />
                  <div className="absolute inset-6 rounded-full bg-teal-500/10 border border-teal-500/40 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-teal-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-zinc-100">Setting up your advisor</h2>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingMsgIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="text-zinc-500 text-base"
                  >
                    {LOADING_MESSAGES[loadingMsgIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800 rounded-full h-1">
                <motion.div
                  className="h-1 bg-teal-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: 'easeInOut' }}
                />
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}