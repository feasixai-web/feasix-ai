import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import VentureQuiz from '@/components/venture/VentureQuiz';
import VentureResultCard from '@/components/venture/VentureResultCard';
import { Compass, RefreshCw, Loader2, Zap, Hammer, Settings, ShoppingBag, Code2, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

const ARCHETYPE_MAP = {
  A: 'Creator', B: 'Builder', C: 'Operator',
  D: 'Merchant', E: 'Technician', F: 'Opportunist'
};

const computeArchetypes = (answers) => {
  const counts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  answers.forEach(a => { if (a && counts[a] !== undefined) counts[a]++; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return {
    primary: ARCHETYPE_MAP[sorted[0][0]],
    secondary: ARCHETYPE_MAP[sorted[1][0]]
  };
};

const matchVentures = (ventures, primary, secondary, energyStyle, capital, timeToMoney, complexity) => {
  const capOrd  = { Low: 1, Medium: 2, High: 3 };
  const timeOrd = { Fast: 1, Medium: 2, Slow: 3 };
  const cxOrd   = { Low: 1, Medium: 2, High: 3 };
  const ytOrd   = { Low: 1, Medium: 2, High: 3, 'Extremely High': 4 };

  const score = (v) => {
    let s = 0;
    if (v.archetype === primary)   s += 40;
    else if (v.archetype === secondary) s += 20;
    if (v.energy_style === energyStyle) s += 20;
    if (capOrd[v.capital_required]     <= capOrd[capital])      s += 10;
    if (timeOrd[v.time_to_first_money] <= timeOrd[timeToMoney]) s += 10;
    if (cxOrd[v.complexity]            <= cxOrd[complexity])    s += 10;
    s += (ytOrd[v.youtube_content_volume] || 0);
    return s;
  };

  // Score all ventures — archetype (40pts) naturally outweighs constraint bonuses (10pts each)
  // so primary archetype matches always surface even if constraints aren't perfectly met
  return ventures
    .map(v => ({ ...v, matchScore: score(v) }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 4);
};

export default function VentureDiscovery() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState('intro');
  const [ventures, setVentures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [archetypes, setArchetypes] = useState({ primary: '', secondary: '' });
  const [energyStyle, setEnergyStyle] = useState('');
  const [capital, setCapital] = useState('');
  const [timeToMoney, setTimeToMoney] = useState('');
  const [complexity, setComplexity] = useState('');
  const [results, setResults] = useState([]);
  const [savedQuizState, setSavedQuizState] = useState(null);
  const savedStateRef = useRef({});

  useEffect(() => {
    Promise.all([
      base44.entities.Venture.list(),
      base44.auth.me()
    ]).then(([ventureList, userData]) => {
      setVentures(ventureList);
      const saved = userData?.venture_discovery || {};
      savedStateRef.current = saved;
      if (saved?.phase && saved.phase !== 'intro') {
        setPhase(saved.phase);
        if (saved.quizState) setSavedQuizState(saved.quizState);
        if (saved.archetypes) setArchetypes(saved.archetypes);
        if (saved.energyStyle) setEnergyStyle(saved.energyStyle);
        if (saved.capital) setCapital(saved.capital);
        if (saved.timeToMoney) setTimeToMoney(saved.timeToMoney);
        if (saved.complexity) setComplexity(saved.complexity);
        if (saved.results) setResults(saved.results);
      }
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const persist = (updates) => {
    const merged = { ...savedStateRef.current, ...updates };
    savedStateRef.current = merged;
    base44.auth.updateMe({ venture_discovery: merged }).catch(console.error);
  };

  const handleQuizComplete = (archetypeAnswers, energy) => {
    const computed = computeArchetypes(archetypeAnswers);
    setArchetypes(computed);
    setEnergyStyle(energy);
    setPhase('constraints');
    persist({ archetypes: computed, energyStyle: energy, phase: 'constraints' });
  };

  const handleFindMatches = () => {
    if (!capital || !timeToMoney || !complexity) return;
    const matched = matchVentures(ventures, archetypes.primary, archetypes.secondary, energyStyle, capital, timeToMoney, complexity);
    setResults(matched);
    setPhase('results');
    persist({ capital, timeToMoney, complexity, results: matched, phase: 'results' });
  };

  const handleSelectVenture = (venture) => {
    navigate(createPageUrl(`VentureDetail?name=${encodeURIComponent(venture.venture_name)}`));
  };

  const handleRetake = () => {
    base44.auth.updateMe({ venture_discovery: null }).catch(console.error);
    setPhase('intro');
    setArchetypes({ primary: '', secondary: '' });
    setEnergyStyle('');
    setCapital('');
    setTimeToMoney('');
    setComplexity('');
    setResults([]);
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  const ARCHETYPE_META = {
    Creator:     { icon: Lightbulb, color: 'from-amber-500/20 to-amber-900/10', border: 'border-amber-700/40', text: 'text-amber-300', badge: 'bg-amber-500/15 text-amber-300', desc: 'You build through expression, content, and original ideas.' },
    Builder:     { icon: Hammer,    color: 'from-blue-500/20 to-blue-900/10',   border: 'border-blue-700/40',   text: 'text-blue-300',   badge: 'bg-blue-500/15 text-blue-300',   desc: 'You thrive constructing systems, products, and teams.' },
    Operator:    { icon: Settings,  color: 'from-purple-500/20 to-purple-900/10', border: 'border-purple-700/40', text: 'text-purple-300', badge: 'bg-purple-500/15 text-purple-300', desc: 'You excel at running efficient, reliable operations.' },
    Merchant:    { icon: ShoppingBag, color: 'from-green-500/20 to-green-900/10', border: 'border-green-700/40', text: 'text-green-300', badge: 'bg-green-500/15 text-green-300', desc: 'You have a strong instinct for buying, selling, and trading.' },
    Technician:  { icon: Code2,     color: 'from-teal-500/20 to-teal-900/10',   border: 'border-teal-700/40',   text: 'text-teal-300',   badge: 'bg-teal-500/15 text-teal-300',   desc: 'You solve problems with deep technical skill and craft.' },
    Opportunist: { icon: Zap,       color: 'from-rose-500/20 to-rose-900/10',   border: 'border-rose-700/40',   text: 'text-rose-300',   badge: 'bg-rose-500/15 text-rose-300',   desc: 'You spot and move on windows of opportunity quickly.' },
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-zinc-100">Find Ventures That Fit You</h1>
        <p className="mt-1 text-zinc-500">
          Answer a short quiz to discover business ventures matched to your strengths and constraints.
        </p>
      </div>

      {/* Archetype Banner — shown once quiz is complete */}
      {archetypes.primary && (phase === 'constraints' || phase === 'results') && (() => {
        const meta = ARCHETYPE_META[archetypes.primary] || {};
        const Icon = meta.icon || Compass;
        return (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border bg-gradient-to-r ${meta.color} ${meta.border} p-5 flex items-center gap-5`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.badge}`}>
              <Icon className={`h-7 w-7 ${meta.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-0.5">Your Archetype</p>
              <p className={`text-2xl font-bold leading-none ${meta.text}`}>{archetypes.primary}</p>
              <p className="text-sm text-zinc-400 mt-1">{meta.desc}</p>
            </div>
            {archetypes.secondary && (
              <div className="hidden sm:block text-right flex-shrink-0">
                <p className="text-xs text-zinc-600 mb-0.5">Secondary</p>
                <p className="text-sm font-semibold text-zinc-400">{archetypes.secondary}</p>
              </div>
            )}
          </motion.div>
        );
      })()}

      {/* ── INTRO ── */}
      {phase === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-teal-950/50 border-2 border-teal-800/40 flex items-center justify-center mx-auto">
              <Compass className="h-10 w-10 text-teal-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-zinc-100">Venture Discovery Engine</h2>
              <p className="text-zinc-400 max-w-md mx-auto text-sm leading-relaxed">
                A 5-minute quiz that maps your working style, strengths, and constraints to the 24 business ventures most likely to work for you.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                { label: '11 Questions', sub: 'Archetype + work style' },
                { label: '3 Constraints', sub: 'Capital, time, complexity' },
                { label: '4 Matches',    sub: 'Ranked for your profile' },
              ].map(({ label, sub }) => (
                <div key={label} className="p-3 bg-zinc-800/40 rounded-lg">
                  <p className="font-medium text-zinc-200">{label}</p>
                  <p className="text-zinc-500 text-xs mt-1">{sub}</p>
                </div>
              ))}
            </div>
            <Button
              onClick={() => { setPhase('quiz'); persist({ phase: 'quiz' }); }}
              size="lg"
              className="bg-teal-600 hover:bg-teal-500 text-white px-8"
            >
              <Compass className="h-5 w-5 mr-2" />
              Start Discovery
            </Button>
          </Card>
        </motion.div>
      )}

      {/* ── QUIZ ── */}
      {phase === 'quiz' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-zinc-900/50 border-zinc-800/50 p-8">
            <VentureQuiz onComplete={handleQuizComplete} savedQuizState={savedQuizState} onSaveProgress={persist} />
          </Card>
        </motion.div>
      )}

      {/* ── CONSTRAINTS ── */}
      {phase === 'constraints' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100 mb-1">Your Constraints</h2>
              <p className="text-sm text-zinc-500">Tell us what you're working with to filter your matches.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Capital Available</Label>
                <Select value={capital} onValueChange={setCapital}>
                  <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-zinc-100">
                    <SelectValue placeholder="How much can you invest?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low — $0 to $200</SelectItem>
                    <SelectItem value="Medium">Medium — $200 to $2,000</SelectItem>
                    <SelectItem value="High">High — $2,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Time to First Money</Label>
                <Select value={timeToMoney} onValueChange={setTimeToMoney}>
                  <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-zinc-100">
                    <SelectValue placeholder="How soon do you need revenue?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fast">Fast — Days to weeks</SelectItem>
                    <SelectItem value="Medium">Medium — 1 to 3 months</SelectItem>
                    <SelectItem value="Slow">Slow — 3 to 12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Complexity Tolerance</Label>
                <Select value={complexity} onValueChange={setComplexity}>
                  <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-zinc-100">
                    <SelectValue placeholder="How complex is okay?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low — Simple, fast to learn</SelectItem>
                    <SelectItem value="Medium">Medium — Some learning required</SelectItem>
                    <SelectItem value="High">High — Deep complexity is fine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleFindMatches}
              disabled={!capital || !timeToMoney || !complexity}
              size="lg"
              className="w-full bg-teal-600 hover:bg-teal-500 text-white disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              Find My Matches
            </Button>
          </Card>
        </motion.div>
      )}

      {/* ── RESULTS ── */}
      {phase === 'results' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">Your Top Matches</h2>
              <p className="text-sm text-zinc-500 mt-1">Based on your {archetypes.primary} archetype and constraints</p>
            </div>
            <Button
              variant="outline"
              onClick={handleRetake}
              className="border-zinc-700 text-zinc-400 hover:text-zinc-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retake
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {results.map((venture, i) => (
              <VentureResultCard
                key={venture.id}
                venture={venture}
                rank={i + 1}
                onSelect={handleSelectVenture}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}