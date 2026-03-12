import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ARCHETYPE_QUESTIONS = [
  {
    question: "Your best friend has a wild new idea for a side project. What's your first move?",
    options: [
      { label: "I'm already thinking about how to tell the story and get people excited", value: "A" },
      { label: "I'm sketching the blueprint — I want to see how the engine actually runs", value: "B" },
      { label: "I'm wondering who actually needs this and how we can genuinely help them", value: "C" },
      { label: "I'm checking the 'price tag' — what does it cost and will people pay for it?", value: "D" },
      { label: "I'm looking for a way to automate the boring parts so it just works", value: "E" },
      { label: "I'm scouting for the 'gap' — the secret angle everyone else is missing", value: "F" },
    ]
  },
  {
    question: "You're scrolling through your feed and see something that actually stops you. What is it?",
    options: [
      { label: "A video that explains a complex idea so perfectly it just 'clicks'", value: "A" },
      { label: "A behind-the-scenes look at how a massive system was built from scratch", value: "B" },
      { label: "A story about someone who built huge trust by simply being reliable", value: "C" },
      { label: "Someone who found a crazy deal or flipped something for a profit", value: "D" },
      { label: "A clever hack or a 'shortcut' that saves a massive amount of effort", value: "E" },
      { label: "Someone who moved first on a trend and hit it big while others slept", value: "F" },
    ]
  },
  {
    question: "It's a wide-open Saturday with zero plans. Where does your brain naturally go?",
    options: [
      { label: "I want to create something — film, write, or put an idea out there", value: "A" },
      { label: "I want to build something — finally getting that project off the ground", value: "B" },
      { label: "I want to connect — catching up with people and seeing what's up", value: "C" },
      { label: "I'm hunting — checking what's trending and where the 'deals' are", value: "D" },
      { label: "I'm tinkering — learning a new tool or fixing something that's broken", value: "E" },
      { label: "I'm following a lead — digging into that interesting thing I noticed earlier", value: "F" },
    ]
  },
  {
    question: "If your closest friends had to describe your 'superpower,' they'd say you are...",
    options: [
      { label: "The Voice — you just know how to say things so people actually listen", value: "A" },
      { label: "The Architect — you see the whole plan 10 steps before it even starts", value: "B" },
      { label: "The Rock — you're the one everyone counts on to get the job done right", value: "C" },
      { label: "The Instinct — you always seem to know what people are going to want next", value: "D" },
      { label: "The Fixer — no matter how complex it is, you'll figure out a way to solve it", value: "E" },
      { label: "The Scout — you see the opportunities that everyone else walks right past", value: "F" },
    ]
  },
  {
    question: "You overhear someone venting about a massive daily annoyance. What's your first instinct?",
    options: [
      { label: "\"I should explain the solution so everyone stops running into this\"", value: "A" },
      { label: "\"There should be a better system for this — why hasn't it been built yet?\"", value: "B" },
      { label: "\"I could probably just jump in and handle that for them directly\"", value: "C" },
      { label: "\"I bet people would pay good money to have that problem go away\"", value: "D" },
      { label: "\"That's just inefficient — I could automate that in an afternoon\"", value: "E" },
      { label: "\"That's a huge gap in the market — someone's going to win big there\"", value: "F" },
    ]
  },
  {
    question: "It's 2 AM and you're still awake, totally absorbed. What's the obsession?",
    options: [
      { label: "Editing or polishing something cool you're about to share with the world", value: "A" },
      { label: "Mapping out exactly how a new project is going to function", value: "B" },
      { label: "Putting the finishing touches on something a client is waiting for", value: "C" },
      { label: "Researching what people are obsessed with and buying right now", value: "D" },
      { label: "Troubleshooting a technical puzzle that's been nagging at you", value: "E" },
      { label: "Going deep on a new opportunity or 'edge' you just discovered", value: "F" },
    ]
  },
  {
    question: "What kind of 'win' would actually make you feel like you've 'made it'?",
    options: [
      { label: "A stranger telling you that your ideas genuinely changed their life", value: "A" },
      { label: "Looking at a system you built that's running perfectly without you", value: "B" },
      { label: "Being the person everyone refers their friends to because you're the best", value: "C" },
      { label: "Spotting a market need, filling it, and seeing the revenue prove you right", value: "D" },
      { label: "Solving a 'unsolvable' problem that saves people huge amounts of time", value: "E" },
      { label: "Turning a tiny investment of effort into something massive and profitable", value: "F" },
    ]
  },
  {
    question: "You only have time to read one article today. Which title is an instant click?",
    options: [
      { label: "How I built a massive audience just by being myself and sharing my notes", value: "A" },
      { label: "How I built an 'Exit' — creating a business that runs on autopilot", value: "B" },
      { label: "How I built a reputation that brings me more work than I can handle", value: "C" },
      { label: "How I found a product everyone wanted and dominated the market", value: "D" },
      { label: "How I automated 90% of my business and got my life back", value: "E" },
      { label: "How I spotted a 30-day window and turned $200 into $10,000", value: "F" },
    ]
  },
  {
    question: "You need to pull together some extra cash in the next 60 days. What's your go-to?",
    options: [
      { label: "Teach what I know — build a guide, a course, or a workshop", value: "A" },
      { label: "Build a product once and set up the system to sell it for me", value: "B" },
      { label: "Provide a high-value service that people already need and trust me for", value: "C" },
      { label: "Identify a trending product and get it in front of the right buyers", value: "D" },
      { label: "Fix a technical problem or set up an automation for a business", value: "E" },
      { label: "Find an 'arbitrage' play — buy low, sell high, and move fast", value: "F" },
    ]
  },
  {
    question: "Fast-forward 1 year: You're running your own thing. What's the best part of the day?",
    options: [
      { label: "Spending the morning creating, writing, and sharing my vision", value: "A" },
      { label: "Seeing the systems I built handle the heavy lifting while I oversee things", value: "B" },
      { label: "Working closely with my best clients and seeing them win", value: "C" },
      { label: "Managing the flow of products and staying ahead of what the market wants", value: "D" },
      { label: "Deep in the lab, constantly improving the technical edge of what I do", value: "E" },
      { label: "Following the data and jumping on the next big wave as it hits", value: "F" },
    ]
  },
  {
    question: "When you're really 'in the zone,' what does the world around you look like?",
    isEnergy: true,
    options: [
      { label: "The Solo Cave — just me, my tools, and my own creative schedule", value: "Independent" },
      { label: "The Front Lines — talking to people, solving their problems in real-time", value: "Client-facing" },
      { label: "The Control Room — keeping an eye on the processes and engines I've built", value: "System-building" },
      { label: "The Hunt — moving fast, testing ideas, and pivoting whenever I see an opening", value: "Opportunity-hunting" },
    ]
  },
];

const TOTAL = ARCHETYPE_QUESTIONS.length; // 11

export default function VentureQuiz({ onComplete, savedQuizState, onSaveProgress }) {
  const [currentIndex, setCurrentIndex] = useState(savedQuizState?.currentIndex || 0);
  const [answers, setAnswers] = useState(savedQuizState?.answers || new Array(TOTAL).fill(null));

  const currentQuestion = ARCHETYPE_QUESTIONS[currentIndex];
  const currentAnswer = answers[currentIndex];
  const isLastQuestion = currentIndex === TOTAL - 1;
  const progress = (currentIndex / TOTAL) * 100;

  const saveProgress = (newAnswers, newIndex) => {
    onSaveProgress?.({ phase: 'quiz', quizState: { answers: newAnswers, currentIndex: newIndex } });
  };

  const handleSelect = (value) => {
    const updated = [...answers];
    updated[currentIndex] = value;
    setAnswers(updated);
    saveProgress(updated, currentIndex);
  };

  const handleNext = () => {
    if (!currentAnswer) return;
    if (isLastQuestion) {
      const archetypeAnswers = answers.slice(0, 10);
      const energyAnswer = answers[10];
      onComplete(archetypeAnswers, energyAnswer);
    } else {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      saveProgress(answers, newIndex);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      saveProgress(answers, newIndex);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Question {currentIndex + 1} of {TOTAL}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-1.5 bg-zinc-800" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {currentQuestion.isEnergy && (
            <p className="text-xs text-teal-400 font-medium uppercase tracking-wide">Work Style</p>
          )}
          <h3 className="text-lg font-semibold text-zinc-100 leading-snug">
            {currentQuestion.question}
          </h3>

          <div className="space-y-2.5">
            {currentQuestion.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm leading-relaxed ${
                  currentAnswer === opt.value
                    ? 'border-teal-500 bg-teal-950/30 text-teal-100'
                    : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 pt-2">
        {currentIndex > 0 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-zinc-700 text-zinc-400 hover:text-zinc-200"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!currentAnswer}
          className="flex-1 bg-teal-600 hover:bg-teal-500 text-white disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {isLastQuestion ? 'See My Matches' : 'Next'}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}