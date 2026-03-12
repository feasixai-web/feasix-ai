import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Search, Compass, Brain, TrendingUp, Shield, ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FeasixWordmark from '@/components/brand/FeasixWordmark';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    try {
      await base44.auth.redirectToLogin(createPageUrl('Onboarding'));
    } catch (e) {
      console.error('Login redirect failed:', e);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FeasixWordmark showIcon={false} className="text-2xl font-bold" />
          </div>
          
          <div className="pl-32 hidden md:flex items-center gap-8">
            <a href="#features" className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Features</a>
            <a href="#how-it-works" className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors">How It Works</a>
            <a href="#why-feasix" className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Why Feasix</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" onClick={handleSignUp} className="!text-zinc-900">
              Sign In
            </Button>
            <Button onClick={handleSignUp} className="bg-teal-600 hover:bg-teal-500">
              Get Started
            </Button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-200">

            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen &&
        <div className="md:hidden border-t border-zinc-800/50 bg-zinc-950 p-4 space-y-3">
            <a href="#features" className="block text-zinc-400 hover:text-zinc-200 text-sm py-2">Features</a>
            <a href="#how-it-works" className="block text-zinc-400 hover:text-zinc-200 text-sm py-2">How It Works</a>
            <a href="#why-feasix" className="block text-zinc-400 hover:text-zinc-200 text-sm py-2">Why Feasix</a>
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
              <Button variant="outline" onClick={handleSignUp} className="w-full !text-zinc-900">
                Sign In
              </Button>
              <Button onClick={handleSignUp} className="w-full bg-teal-600 hover:bg-teal-500">
                Get Started
              </Button>
            </div>
          </div>
        }
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-600/5 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Cut through the noise.<br />
            <span className="text-teal-400">Surface what actually matters.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Feasix is your clarity tool for exploring business ideas. We help you dig past the hype, uncover hidden requirements, and understand what you're really getting into — before you commit.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button onClick={handleSignUp} size="lg" className="bg-teal-600 hover:bg-teal-500 text-white h-12">
              Start Exploring Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button onClick={handleSignUp} variant="outline" size="lg" className="h-12 !text-zinc-900">
              Learn More
            </Button>
          </div>

          <p className="text-sm text-zinc-500">No credit card required. Free tier included.</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 border-t border-zinc-800/50 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Clarity</h2>
            <p className="text-zinc-400 text-lg">Everything you need to evaluate business ideas seriously.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-zinc-800/30 border border-zinc-800/50 rounded-2xl p-8">
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                <Compass className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Venture Matching</h3>
              <p className="text-zinc-400 leading-relaxed">
                Answer real questions about yourself. Get matched to business models that actually fit your strengths, available capital, and lifestyle.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-zinc-800/30 border border-zinc-800/50 rounded-2xl p-8">
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Deep Video Analysis</h3>
              <p className="text-zinc-400 leading-relaxed">
                Paste a YouTube link. We extract execution steps, uncover hidden costs, reveal common failure points, and show you what creators skip over.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-zinc-800/30 border border-zinc-800/50 rounded-2xl p-8">
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Venture Advisor</h3>
              <p className="text-zinc-400 leading-relaxed">
                Ask your personal Feasix guide anything. Get clarity on claims, explanations of complex ideas, and real-world context for what you're learning.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-zinc-800/30 border border-zinc-800/50 rounded-2xl p-8">
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Accumulation Sessions</h3>
              <p className="text-zinc-400 leading-relaxed">
                Organize videos by niche or business model. Get aggregated insights across multiple sources so patterns become obvious.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-zinc-800/30 border border-zinc-800/50 rounded-2xl p-8">
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Feasibility Insights</h3>
              <p className="text-zinc-400 leading-relaxed">
                Understand how a venture aligns with your situation. We assess capital intensity, skill requirements, time commitment, and real friction.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-zinc-800/30 border border-zinc-800/50 rounded-2xl p-8">
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Structured Roadmaps</h3>
              <p className="text-zinc-400 leading-relaxed">
                Get step-by-step execution roadmaps built from real creator experiences, showing common pitfalls and what success actually looks like.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-zinc-400 text-lg">Three simple steps to get clarity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-teal-600/20 border border-teal-500/40 flex items-center justify-center flex-shrink-0 text-teal-400 font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tell us about yourself</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Answer questions about your strengths, constraints, available capital, and what you're looking for in a business.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-teal-600/20 border border-teal-500/40 flex items-center justify-center flex-shrink-0 text-teal-400 font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Explore or analyze</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Discover ventures matched to you, or paste YouTube links to deep-dive into business content.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-teal-600/20 border border-teal-500/40 flex items-center justify-center flex-shrink-0 text-teal-400 font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Get clarity & decide</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    See execution steps, uncover real requirements, and make informed decisions about which paths are actually for you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Feasix */}
      <section id="why-feasix" className="py-20 px-6 bg-zinc-900/50 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Feasix</h2>
            <p className="text-zinc-400 text-lg">We're not another motivational platform.</p>
          </div>

          <div className="space-y-8">
            <div className="border-l-2 border-teal-500/50 pl-6 py-2">
              <h3 className="text-lg font-semibold mb-2">No hype. Evidence-based.</h3>
              <p className="text-zinc-400">
                We look at what creators actually say, not what they want you to believe. We surface the friction, the costs, and the reality of execution.
              </p>
            </div>

            <div className="border-l-2 border-teal-500/50 pl-6 py-2">
              <h3 className="text-lg font-semibold mb-2">Personalized to you.</h3>
              <p className="text-zinc-400">
                Your situation matters. We assess feasibility against your actual constraints, capital, time, and skills — not generic benchmarks.
              </p>
            </div>

            <div className="border-l-2 border-teal-500/50 pl-6 py-2">
              <h3 className="text-lg font-semibold mb-2">Saves you time and money.</h3>
              <p className="text-zinc-400">
                By surfacing requirements early, you avoid investing in dead-end paths. Clarity before commitment is worth everything.
              </p>
            </div>

            <div className="border-l-2 border-teal-500/50 pl-6 py-2">
              <h3 className="text-lg font-semibold mb-2">Built for learning, not selling.</h3>
              <p className="text-zinc-400">
                We're not pushing any particular business model or course. We just want you to understand what's real and make smart decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to get clarity?</h2>
          <p className="text-zinc-400 text-lg mb-8">
            Start exploring business ideas with confidence. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleSignUp} size="lg" className="bg-teal-600 hover:bg-teal-500 text-white h-12">
              Get Started Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button onClick={handleSignUp} variant="outline" size="lg" className="h-12 !text-zinc-900">
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 bg-zinc-900/30 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            <div>
              <FeasixWordmark showIcon={false} className="text-xl font-bold mb-2" />
              <p className="text-zinc-500 text-sm">Filter advice. Surface requirements. Reveal feasibility.</p>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-sm font-semibold text-zinc-300 mb-3">Product</p>
                <ul className="space-y-2 text-sm text-zinc-500">
                  <li><a href="#features" className="hover:text-zinc-300 transition">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-zinc-300 transition">How It Works</a></li>
                  <li><a href="#why-feasix" className="hover:text-zinc-300 transition">Why Feasix</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-800/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-zinc-600">© 2026 Feasix. All rights reserved.</p>
            <p className="text-sm text-zinc-600">Made to help you think clearly about business.</p>
          </div>
        </div>
      </footer>
    </div>);

}