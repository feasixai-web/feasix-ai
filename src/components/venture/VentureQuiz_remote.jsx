import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ARCHETYPE_QUESTIONS = [
  {
    question: "A friend asks for your help with their side project. What do you naturally end up doing?",
    options: [
      { label: "Thinking about how to tell the story of what they're doing", value: "A" },
      { label: "Mapping out how the whole thing should work, step by step", value: "B" },
      { label: "Focusing on who they're trying to help and what those people actually need", value: "C" },
      { label: "Asking what it costs and what someone would realistically pay for it", value: "D" },
      { label: "Looking for ways to make parts of it faster or less manual", value: "E" },
      { label: "Asking if there's an angle or gap others haven't thought of yet", value: "F" },
    ]
  },
  {
    question: "You're browsing your phone and something catches your eye. What is it?",
    options: [
      { label: "A video or post that explains something in a way that finally makes it click", value: "A" },
      { label: "A behind-the-scenes look at how something was designed or built", value: "B" },
      { label: "A story about someone who genuinely went out of their way to help someone else", value: "C" },
      { label: "Someone who found a great deal or made money from something unexpected", value: "D" },
      { label: "A clever hack or shortcut that saves a ton of time or effort", value: "E" },
      { label: "Someone who spotted something others missed and got ahead because of it", value: "F" },
    ]
  },
  {
    question: "You have a free Saturday and unlimited energy. What do you end up doing?",
    options: [
      { label: "Working on something you want to share — writing, filming, or creating", value: "A" },
      { label: "Working through an idea or project that's been sitting in the back of your mind", value: "B" },
      { label: "Reaching out to people, catching up, and finding ways to be useful", value: "C" },
      { label: "Browsing what's trending, checking prices, or hunting for something worth buying", value: "D" },
      { label: "Tinkering — learning a new tool, fixing something, or figuring out how it works", value: "E" },
      { label: "Following up on something interesting you stumbled on during the week", value: "F" },
    ]
  },
  {
    question: "Someone who knows you well would most likely describe you as...",
    options: [
      { label: "A great communicator — they just get their point across and people listen", value: "A" },
      { label: "A planner — always thinking a few steps ahead before acting", value: "B" },
      { label: "Super reliable — you ask them for something, it gets done, no questions", value: "C" },
      { label: "Tuned in — they always seem to know what people want before they ask", value: "D" },
      { label: "The fix-it person — if something's broken or complicated, they figure it out", value: "E" },
      { label: "Sharp — they notice things others walk right past", value: "F" },
    ]
  },
  {
    question: "You overhear someone complaining about a frustrating problem. What's your first instinct?",
    options: [
      { label: "\"I wonder if there's a way to explain this so people don't keep running into it\"", value: "A" },
      { label: "\"There should be a better way to handle this — why hasn't anyone fixed it?\"", value: "B" },
      { label: "\"I could probably help them with that directly\"", value: "C" },
      { label: "\"I wonder if there's something people would pay to have that solved\"", value: "D" },
      { label: "\"That could probably be automated or solved with the right setup\"", value: "E" },
      { label: "\"That's a gap — someone's going to capitalize on that eventually\"", value: "F" },
    ]
  },
  {
    question: "Which of these would you most likely stay up late doing?",
    options: [
      { label: "Writing, editing, or putting together something you want to share", value: "A" },
      { label: "Sketching out how something you've been thinking about would actually work", value: "B" },
      { label: "Preparing something for someone who's counting on you", value: "C" },
      { label: "Researching what people are actively into or buying right now", value: "D" },
      { label: "Building or troubleshooting something technical that's been nagging at you", value: "E" },
      { label: "Going deep on an idea or opportunity you stumbled on", value: "F" },
    ]
  },
  {
    question: "Which of these would feel like a real win to you?",
    options: [
      { label: "A stranger telling you your content helped them figure something out", value: "A" },
      { label: "Something you built quietly running on its own and delivering results", value: "B" },
      { label: "Someone telling you that you genuinely changed how their situation looks", value: "C" },
      { label: "Moving something you sourced faster and for more than you expected", value: "D" },
      { label: "Something you set up saving people significant time every single week", value: "E" },
      { label: "Turning a small investment of time or money into something much bigger", value: "F" },
    ]
  },
  {
    question: "Which of these would you actually click on and read all the way through?",
    options: [
      { label: "How I built a real audience by consistently sharing what I know", value: "A" },
      { label: "How I built something from nothing that now runs without me", value: "B" },
      { label: "How I built a reputation doing work people refer others for", value: "C" },
      { label: "How I found something people wanted and figured out how to get it to them", value: "D" },
      { label: "How I automated my workflow and got hours of my week back", value: "E" },
      { label: "How I turned $200 into $800 by paying attention to the right things", value: "F" },
    ]
  },
  {
    question: "If you needed to make extra money in the next 60 days, what would you try first?",
    options: [
      { label: "Share what I know — write something, teach something, or build an audience around it", value: "A" },
      { label: "Create something once that I can sell over and over", value: "B" },
      { label: "Offer to do something for people they're already willing to pay for", value: "C" },
      { label: "Find something with clear demand and figure out how to get it to people", value: "D" },
      { label: "Build something technical that solves a problem people deal with regularly", value: "E" },
      { label: "Find something underpriced somewhere and get it to someone who'll pay more", value: "F" },
    ]
  },
  {
    question: "When you picture having your own thing long-term, what does the day-to-day look like?",
    options: [
      { label: "Creating, writing, or teaching — putting ideas out into the world", value: "A" },
      { label: "Overseeing something I built that mostly handles itself", value: "B" },
      { label: "Deep in the work, with people who depend on and trust me", value: "C" },
      { label: "Managing products, sourcing, and figuring out what people want next", value: "D" },
      { label: "Building and improving the technical side of something", value: "E" },
      { label: "Moving between opportunities, always tracking what's working right now", value: "F" },
    ]
  },
  {
    question: "On a typical working day, which environment feels most natural to you?",
    isEnergy: true,
    options: [
      { label: "Working alone — creating, writing, or building on my own schedule", value: "Independent" },
      { label: "Working with people — helping clients directly and seeing real results", value: "Client-facing" },
      { label: "Building infrastructure — setting up processes and systems that run reliably", value: "System-building" },
      { label: "Chasing the edge — testing ideas, spotting gaps, and moving fast on what's working", value: "Opportunity-hunting" },
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