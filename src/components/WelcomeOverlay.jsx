import React, { useState } from 'react';
import { X, Lightbulb, Grid, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const cards = [
  {
    icon: Lightbulb,
    title: 'Welcome to Feasix',
    body: "Feasix transforms repetitive business videos into actionable intelligence, revealing what's new, what's missing, and what truly matters for your next venture."
  },
  {
    icon: Grid,
    title: 'General Videos = Exploration',
    body: 'Explore new opportunities. Feasix dissects general strategy videos, mapping distinct ventures and guiding you to the most promising paths.'
  },
  {
    icon: Target,
    title: 'Specific Videos = Execution',
    body: "Master execution. Feasix streamlines 'how-to' videos, outlining clear steps and pinpointing critical new information or potential risks."
  },
  {
    icon: Zap,
    title: 'How to Use Feasix',
    body: (
      <ol className="list-decimal list-inside space-y-2 text-left">
        <li>Paste a YouTube video link</li>
        <li>Discover new requirements, overlooked nuances, or critical insights</li>
        <li>Act with confidence, or pivot knowing you've gained clarity</li>
      </ol>
    )
  }
];

export default function WelcomeOverlay({ onClose }) {
  const [currentCard, setCurrentCard] = useState(0);

  const handleNext = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('feasix-welcome-seen', 'true');
    onClose();
  };

  const card = cards[currentCard];
  const Icon = card.icon;
  const isLastCard = currentCard === cards.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-none">
      <button
        onClick={handleComplete}
        className="absolute top-6 right-6 p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="w-full max-w-2xl px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-12 shadow-2xl"
          >
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30">
                <Icon className="h-12 w-12 text-teal-400" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-zinc-100 text-center mb-6">
              {card.title}
            </h2>

            {/* Body */}
            <div className="text-lg text-zinc-300 text-center mb-10 leading-relaxed">
              {card.body}
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-8">
              {cards.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentCard
                      ? 'w-8 bg-teal-400'
                      : 'w-2 bg-zinc-700'
                  }`}
                />
              ))}
            </div>

            {/* Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleNext}
                size="lg"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-teal-500/20"
              >
                {isLastCard ? 'Start Using Feasix' : 'Next'}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}