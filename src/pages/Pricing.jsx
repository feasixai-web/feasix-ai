import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Zap, Sparkles, TrendingUp, Search, History, ShieldCheck, BrainCircuit, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadUser();
  }, []);
  
  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {}
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('createCheckoutSession');
      window.location.href = data.url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      setLoading(false);
    }
  };
  
  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ created_by: user?.email });
      return subs[0] || { tier: 'free' };
    },
    enabled: !!user
  });
  
  const isPaid = subscription?.tier === 'paid';
  
  const plans = [
    {
      name: 'Starter',
      tier: 'free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for exploring your first few ventures.',
      features: [
        '15 high-signal evaluations',
        'Basic AI Advisor guidance',
        'Venture Discovery preview',
        'Standard execution sessions',
        'Community support'
      ],
      notIncluded: [
        'Unrestricted AI Advisor',
        'Deep Search access',
        'Full execution history',
        'Priority data processing'
      ],
      cta: 'Current Plan',
      disabled: true,
      variant: 'outline',
      icon: <Zap className="h-5 w-5 text-zinc-400" />
    },
    {
      name: 'Professional',
      tier: 'paid',
      price: '$19.99',
      period: '/month',
      description: 'The complete set of intelligence tools for builders.',
      features: [
        'Unlimited video evaluations',
        'Unrestricted AI Advisor access',
        'Full Venture Discovery engine',
        'Deep Search & niche extraction',
        'Comprehensive execution history',
        'Interactive venture roadmaps',
        'Feasibility sensitivity analysis',
        'Priority 1-on-1 support'
      ],
      cta: isPaid ? 'Current Plan' : 'Upgrade to Pro',
      disabled: isPaid,
      variant: 'default',
      highlighted: true,
      onUpgrade: true,
      icon: <Crown className="h-5 w-5 text-amber-400" />
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 lg:p-12 max-w-6xl mx-auto space-y-16 relative"
    >
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-widest mb-2">
          <Sparkles className="h-3 w-3" />
          Flexible Pricing
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-zinc-100 tracking-tight leading-tight">
          Invest in <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Certainty</span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Stop guessing and start analyzing. Choose the plan that best fits your venture exploration journey.
        </p>
      </motion.div>
      
      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
        {plans.map((plan) => (
          <motion.div key={plan.name} variants={itemVariants} className="h-full">
            <Card 
              className={`
                relative h-full overflow-hidden flex flex-col p-8 transition-all duration-500 border
                ${plan.highlighted 
                  ? 'bg-zinc-950 border-teal-500/30 shadow-[0_0_50px_-12px_rgba(20,184,166,0.3)]' 
                  : 'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700'
                }
              `}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0 p-3">
                  <div className="bg-teal-500/10 text-teal-400 text-[10px] font-bold px-3 py-1 rounded-full border border-teal-500/20 uppercase tracking-widest">
                    Recommended
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2.5 rounded-xl border ${plan.highlighted ? 'bg-teal-500/10 border-teal-500/20' : 'bg-zinc-800/50 border-zinc-700/50'}`}>
                  {plan.icon}
                </div>
                <h2 className="text-2xl font-bold text-zinc-100">{plan.name}</h2>
              </div>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold text-zinc-100">{plan.price}</span>
                <span className="text-zinc-500 text-lg">{plan.period}</span>
              </div>
              
              <p className="text-zinc-400 mb-8 leading-relaxed">{plan.description}</p>
              
              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${plan.highlighted ? 'bg-teal-500/20' : 'bg-zinc-800'}`}>
                      <Check className={`h-3 w-3 ${plan.highlighted ? 'text-teal-400' : 'text-zinc-500'}`} />
                    </div>
                    <span className="text-zinc-300 text-sm">{feature}</span>
                  </div>
                ))}
                
                {plan.notIncluded && plan.notIncluded.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 opacity-40">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center bg-zinc-800">
                      <X className="h-3 w-3 text-zinc-600" />
                    </div>
                    <span className="text-zinc-500 text-sm line-through decoration-zinc-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`
                  h-14 w-full rounded-2xl font-bold text-base transition-all duration-300
                  ${plan.highlighted 
                    ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-xl shadow-teal-900/20' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                  }
                `}
                variant={plan.variant}
                disabled={plan.disabled || loading}
                onClick={plan.onUpgrade && !plan.disabled ? handleUpgrade : undefined}
              >
                {loading && plan.onUpgrade ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Intializing...
                  </div>
                ) : plan.cta}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Value Proposition Grid */}
      <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h3 className="text-xl font-bold text-zinc-100">Why Professional?</h3>
          <p className="text-sm text-zinc-500 mt-2">The ROI of clarity in your business decisions.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: <History className="h-5 w-5 text-teal-400" />,
              title: "Full Execution Memory",
              desc: "Never lose a insight. Professional accounts keep a permanent record of every evaluation and session."
            },
            {
              icon: <Search className="h-5 w-5 text-blue-400" />,
              title: "Deep Search Intelligence",
              desc: "Extract specific niches and business models from our global indexed database of high-signal content."
            },
            {
              icon: <BrainCircuit className="h-5 w-5 text-purple-400" />,
              title: "The Unrestricted Advisor",
              desc: "Ask unlimited questions to your dedicated Venture Advisor. No caps on strategic reasoning sessions."
            },
            {
              icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
              title: "Risk-Free Discovery",
              desc: "Identify failure points before they cost you capital. Move from 'hope' to 'mathematical probability'."
            }
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 flex gap-4 hover:border-zinc-700 transition-colors group">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <div>
                <h4 className="font-bold text-zinc-200 mb-1">{item.title}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Guarantee Section */}
      <motion.div variants={itemVariants} className="max-w-xl mx-auto text-center space-y-4 pt-10">
        <p className="text-xs text-zinc-600 uppercase font-bold tracking-[0.2em]">Secure Checkout • Instant Access</p>
        <p className="text-[10px] text-zinc-700">
          Join hundreds of entrepreneurs building with Feasix. Cancel any time directly from your dashboard.
        </p>
      </motion.div>
    </motion.div>
  );
}