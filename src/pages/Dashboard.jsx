import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import VideoCard from '@/components/dashboard/VideoCard';
import SessionCard from '@/components/dashboard/SessionCard';
import UsageIndicator from '@/components/dashboard/UsageIndicator';

import ProgressChart from '@/components/dashboard/ProgressChart';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Filter, 
  Clock, 
  TrendingUp, 
  User, 
  Youtube, 
  Search, 
  ChevronDown, 
  Compass, 
  Layers, 
  Sparkles,
  Zap,
  Star,
  ShieldCheck,
  BrainCircuit
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import FeasixWordmark from '@/components/brand/FeasixWordmark';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ created_by: user?.email });
      return subs[0] || { tier: 'free', evaluations_used: 0, evaluations_limit: 15 };
    },
    enabled: !!user
  });

  const { data: recentVideos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ['recent-videos', user?.email],
    queryFn: () => base44.entities.Video.filter({ created_by: user?.email }, '-created_date', 5),
    enabled: !!user
  });

  const { data: recentSessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['recent-sessions', user?.email],
    queryFn: () => base44.entities.AccumulationSession.filter({ created_by: user?.email }, '-created_date', 4),
    enabled: !!user
  });

  const { data: allVideos = [] } = useQuery({
    queryKey: ['all-videos', user?.email],
    queryFn: () => base44.entities.Video.filter({ created_by: user?.email }),
    enabled: !!user
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (videoId) => base44.entities.Video.delete(videoId),
    onSuccess: () => {
      if (user?.email) {
        queryClient.invalidateQueries({ queryKey: ['recent-videos', user.email] });
      }
    }
  });

  const handleDeleteVideo = (videoId) => {
    if (confirm('Delete this video evaluation?')) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  const isPaid = subscription?.tier === 'paid';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-12 relative"
    >
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-zinc-800/30">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Platform Dashboard</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-zinc-100 tracking-tight">
            {user ? `Greetings${user.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}` : 'Greetings'}
          </h1>
          <p className="mt-2 text-zinc-400 text-sm lg:text-base max-w-xl leading-relaxed">
            Your centralized intelligence hub. We've surface key requirements and analyzed <span className="text-zinc-200 font-medium">{recentVideos.length} ventures</span> for you this week.
          </p>
        </div>
        
        <Link to={createPageUrl('PersonalContext')} className="group flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-teal-500/30 transition-all hover:bg-zinc-900 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center group-hover:scale-105 transition-transform">
            <User className="w-5 h-5 text-zinc-400 group-hover:text-teal-400 transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Account</span>
            <span className="text-sm font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors">Venture Profile</span>
          </div>
        </Link>
      </motion.div>

      {/* Main Feature Banner - NOW AT THE TOP */}
      <motion.div variants={itemVariants}>
        <div className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-teal-600 to-teal-900 p-[1px] shadow-2xl shadow-teal-500/20">
          <div className="relative h-full w-full rounded-[2.5rem] bg-zinc-950 p-8 lg:p-12 overflow-hidden">
            {/* Animated Background Blobs */}
            <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[120%] bg-teal-500/10 blur-[80px] rotate-12 group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[30%] h-[100%] bg-blue-500/10 blur-[60px] -rotate-12 group-hover:scale-110 transition-transform duration-1000" />
            
            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                  <Sparkles className="h-3 w-3" />
                  Primary Feature
                </div>
                <h2 className="text-3xl lg:text-5xl font-bold text-zinc-100 leading-tight">
                  Uncover what <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">really matters</span> in every venture.
                </h2>
                <p className="mt-4 text-zinc-400 text-base lg:text-lg leading-relaxed">
                  Our AI engine extracts execution steps, hidden requirements, and potential friction points directly from business content. Stop guessing, start analyzing.
                </p>
                <div className="flex flex-wrap gap-4 mt-8">
                  <Link to={createPageUrl('VentureDiscovery')}>
                    <Button className="h-12 px-8 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold shadow-xl shadow-teal-900/40 border border-teal-400/20 group/btn">
                      Start Evaluation
                      <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Button variant="outline" className="h-12 px-8 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 rounded-2xl font-bold">
                    Watch Demo
                  </Button>
                </div>
              </div>
              
              <div className="hidden lg:flex flex-col gap-3 w-full max-w-xs">
                {[
                  { icon: <Search className="w-4 h-4" />, label: 'Deep Search', color: 'text-purple-400' },
                  { icon: <Compass className="w-4 h-4" />, label: 'Venture Discovery', color: 'text-amber-400' },
                  { icon: <ShieldCheck className="w-4 h-4" />, label: 'Risk Assessment', color: 'text-blue-400' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 group-hover:border-teal-500/20 transition-all">
                    <div className={`p-2 rounded-lg bg-zinc-800 ${item.color}`}>{item.icon}</div>
                    <span className="font-semibold text-zinc-200">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recommendations & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Feasix Insight (New Section) */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-teal-400" />
              Feasix Insight
            </h2>
          </div>
          <Card className="bg-zinc-950 border-zinc-800/50 overflow-hidden relative group">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recommended for You</span>
              </div>
              <h3 className="text-base font-bold text-zinc-100 mb-2 group-hover:text-teal-400 transition-colors">Micro-SaaS Niche: Automation Tools</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Based on your preference for tech-heavy ventures, we recommend exploring high-friction B2B workflows.
              </p>
              <Link to={createPageUrl('AIChat')}>
                <Button variant="link" className="p-0 text-teal-400 h-auto font-bold text-sm hover:text-teal-300">
                  Ask Feasix about this niche <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full" />
          </Card>
        </motion.div>

        {/* Discovery Options */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
           <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-zinc-100">Exploration Hub</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to={createPageUrl('Analyze?tab=search')}>
              <Card className="bg-zinc-900/30 border-zinc-800/50 hover:border-purple-500/30 p-5 transition-all hover:bg-zinc-900 group h-full">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Search className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-zinc-100">Search Content</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">Discovery high-yield income content immediately.</p>
              </Card>
            </Link>

            <Link to={createPageUrl('VentureDiscovery')}>
              <Card className="bg-zinc-900/30 border-zinc-800/50 hover:border-amber-500/30 p-5 transition-all hover:bg-zinc-900 group h-full">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Compass className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-zinc-100">Discover Ventures</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">Match ventures to your strengths and capital.</p>
              </Card>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Recent Sessions List */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-zinc-100">Execution Sessions</h2>
            <div className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              {recentSessions.length} Recent
            </div>
          </div>
          <Link to={createPageUrl('Sessions')} className="text-sm font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
            Full History <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingSessions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 rounded-3xl bg-zinc-900/50 border border-zinc-800/50" />
            ))}
          </div>
        ) : recentSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <Card className="bg-zinc-950/50 border-zinc-800/50 p-12 text-center rounded-[2rem] border-dashed">
            <Layers className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-zinc-200 font-bold mb-1">Your journey starts here.</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
              Analyze your first video or discover a venture to begin tracking your execution steps.
            </p>
            <Link to={createPageUrl('VentureDiscovery')}>
              <Button className="mt-8 px-8 h-12 bg-zinc-100 text-zinc-900 hover:bg-white rounded-2xl font-bold shadow-xl">
                Get Started
              </Button>
            </Link>
          </Card>
        )}
      </motion.section>
      
      {/* Analytics Chart */}
      <motion.div variants={itemVariants} className="pt-8">
         <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-lg font-bold text-zinc-100">Learning Intensity</h2>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Last 30 Days</span>
         </div>
         {allVideos.length > 0 && <ProgressChart videos={allVideos} />}
      </motion.div>

      {/* Stats Cards Section - NOW AT THE BOTTOM, UNDER PROGRESSION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {[
          {
            label: 'System Capacity',
            value: subscription?.evaluations_used || 0,
            limit: isPaid ? '∞' : (subscription?.evaluations_limit || 15),
            icon: <Zap className="h-5 w-5 text-amber-400" />,
            bg: 'bg-amber-950/20 border-amber-500/20',
            inner: 'bg-amber-500/10',
            isUsage: true
          },
          {
            label: 'Analyzed Content',
            value: recentVideos.length,
            sub: 'Videos evaluated',
            icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
            bg: 'bg-emerald-950/20 border-emerald-500/20',
            inner: 'bg-emerald-500/10'
          },
          {
            label: 'Efficiency Gains',
            value: Math.round(recentVideos.reduce((acc, v) => {
              const weights = { skip: 20, skim: 18, watch: 15 };
              return acc + (weights[v.rating] || 0);
            }, 0)),
            sub: 'Minutes of research saved',
            icon: <Clock className="h-5 w-5 text-blue-400" />,
            bg: 'bg-blue-950/20 border-blue-500/20',
            inner: 'bg-blue-500/10'
          }
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className={`relative overflow-hidden group border p-6 transition-all hover:shadow-2xl hover:shadow-teal-500/5 ${stat.bg} backdrop-blur-xl`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl border border-white/5 shadow-inner ${stat.inner}`}>
                  {stat.icon}
                </div>
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-zinc-500" />
                </div>
              </div>
              
              {stat.isUsage ? (
                <div className="space-y-3">
                  <UsageIndicator
                    used={stat.value}
                    limit={stat.limit}
                    label={stat.label}
                    showUpgrade={!isPaid}
                  />
                </div>
              ) : (
                <div>
                   <p className="text-3xl font-bold text-zinc-100 tracking-tight">{stat.value}</p>
                   <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">{stat.label}</p>
                   <p className="text-[10px] text-zinc-600 mt-2 italic">{stat.sub}</p>
                </div>
              )}
              
              {/* Card Decoration */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
            </Card>
          </motion.div>
        ))}
      </div>

    </motion.div>
  );
}