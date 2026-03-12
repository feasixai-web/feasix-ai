import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Clock, Target, Grid, X, TrendingUp, AlertTriangle, ChevronRight, Briefcase, Cloud, Link as LinkIcon, Video, Package, Truck, Loader2, Sparkles, Brain } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sessions() {
  const [user, setUser] = useState(null);
  const [analyzingVideoId, setAnalyzingVideoId] = useState(null);
  const queryClient = useQueryClient();
  const location = useLocation();
  
  useEffect(() => {
    loadUser();
    
    // Check if there's a newly analyzed video
    const urlParams = new URLSearchParams(location.search);
    const newVideoId = urlParams.get('newVideoId');
    if (newVideoId) {
      setAnalyzingVideoId(newVideoId);
    }
  }, [location]);
  
  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {}
  };
  
  const { data: rawSessions = [], isLoading } = useQuery({
    queryKey: ['sessions', user?.email],
    queryFn: () => base44.entities.AccumulationSession.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user
  });

  // Real-time subscription to detect when video analysis is complete
  useEffect(() => {
    if (!analyzingVideoId) return;

    const unsubscribe = base44.entities.Video.subscribe((event) => {
      if (event.id === analyzingVideoId && event.type === 'update') {
        // Check if analysis is complete (has friction_analysis or rating)
        if (event.data?.friction_analysis || event.data?.rating || event.data?.multi_venture_analysis) {
          setAnalyzingVideoId(null);
          queryClient.invalidateQueries({ queryKey: ['sessions', user?.email] });
        }
      }
    });

    return () => unsubscribe();
  }, [analyzingVideoId, user?.email, queryClient]);

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId) => base44.entities.AccumulationSession.delete(sessionId),
    onSuccess: () => {
      if (user?.email) {
        queryClient.invalidateQueries({ queryKey: ['sessions', user.email] });
      }
    }
  });
  
  // CANONICAL SESSION FILTER
  // Only canonical sessions are visible to users.
  // Legacy sessions remain in database but are completely hidden from UI.
  const sessions = rawSessions.filter(session => {
    // RULE 1: Exclude all sessions with deprecated category_id field
    if (session.category_id) return false;
    
    // RULE 2: For general sessions, ONLY show "General (Global)"
    // Excludes: legacy "General" sessions without "(Global)" designation
    if ((session.session_type || 'general') === 'general') {
      return session.genre === 'General (Global)';
    }
    
    // RULE 3: For specific sessions, only show sessions with valid niche in genre field
    // Must have a genre value (e.g., "Amazon FBA", "SaaS", etc.)
    if (session.session_type === 'specific') {
      return session.genre && session.genre.trim().length > 0;
    }
    
    // Default: exclude unrecognized session types
    return false;
  });
  
  const sessionTypeConfig = {
    general: { 
      label: 'Advice', 
      icon: Grid, 
      color: 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50',
      description: 'Broad exploration, multiple ideas or strategies'
    },
    specific: { 
      label: 'Niche (Applied)', 
      icon: Target, 
      color: 'bg-blue-950/50 text-blue-400 border-blue-800/50',
      description: 'Focused execution path, concrete steps'
    }
  };

  const placeholderGenres = [
    { name: 'Amazon FBA', description: 'E-commerce product sales' },
    { name: 'SaaS', description: 'Software as a service products' },
    { name: 'Freelancing', description: 'Service-based business models' },
    { name: 'Content / Media', description: 'Digital content creation' }
  ];
  
  const generalSessions = sessions.filter(s => (s.session_type || 'general') === 'general');
  const specificSessions = sessions.filter(s => s.session_type === 'specific');
  
  const handleDeleteSession = (e, sessionId) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this session? Videos will remain in the database.')) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  const getVentureTheme = (genre) => {
    const genreLower = genre?.toLowerCase() || '';
    if (genreLower.includes('agency') || genreLower.includes('service')) {
      return { icon: Briefcase, color: 'teal', glow: 'bg-teal-500/20' };
    }
    if (genreLower.includes('saas') || genreLower.includes('software')) {
      return { icon: Cloud, color: 'blue', glow: 'bg-blue-500/20' };
    }
    if (genreLower.includes('affiliate')) {
      return { icon: LinkIcon, color: 'purple', glow: 'bg-purple-500/20' };
    }
    if (genreLower.includes('content') || genreLower.includes('media')) {
      return { icon: Video, color: 'orange', glow: 'bg-orange-500/20' };
    }
    if (genreLower.includes('amazon') || genreLower.includes('fba') || genreLower.includes('shop') || genreLower.includes('e-commerce')) {
      return { icon: Package, color: 'amber', glow: 'bg-amber-500/20' };
    }
    if (genreLower.includes('dropship') || genreLower.includes('logistic')) {
      return { icon: Truck, color: 'emerald', glow: 'bg-emerald-500/20' };
    }
    return { icon: Target, color: 'zinc', glow: 'bg-zinc-500/10' };
  };

  const renderSessionCard = (session) => {
    const sessionType = session.session_type || 'general';
    const typeConfig = sessionTypeConfig[sessionType] || sessionTypeConfig.general;
    const isSpecific = session.session_type === 'specific';
    const isGeneral = sessionType === 'general';
    const { icon: VentureIcon, color: themeColor, glow: glowClass } = getVentureTheme(session.genre);
    const validVideos = isGeneral 
      ? session.general_video_ids?.filter(v => v) || []
      : session.accumulated_videos?.filter(av => av?.video_id) || [];
    const videoCount = validVideos.length;
    const progress = Math.min((videoCount / 3) * 100, 100);
    const hasEvaluations = videoCount >= 3;
    const videosNeeded = Math.max(0, 3 - videoCount);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ translateY: -4 }}
        transition={{ duration: 0.3 }}
      >
        <Link 
          key={session.id}
          to={createPageUrl(`SessionDetail?id=${session.id}`)}
          className="block h-full"
          onClick={() => {
            sessionStorage.setItem('currentSessionId', session.id);
          }}
        >
          <Card className="h-full bg-zinc-950/40 border-zinc-200/10 backdrop-blur-sm p-6 hover:bg-zinc-900/40 hover:border-zinc-200/20 transition-all cursor-pointer group relative overflow-hidden flex flex-col">
            {/* Dynamic Glow Background */}
            <div className={`absolute -top-24 -left-24 w-48 h-48 ${glowClass} blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            <div className={`absolute -bottom-24 -right-24 w-48 h-48 ${glowClass} blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100`} />

            <div className="absolute top-4 right-4">
              <ChevronRight className="h-5 w-5 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
            </div>

            <div className="flex items-start gap-4 mb-5">
              <div className={`p-3 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl group-hover:border-${themeColor}-500/30 group-hover:bg-${themeColor}-500/5 transition-all duration-300`}>
                <VentureIcon className={`h-6 w-6 text-zinc-400 group-hover:text-${themeColor}-400 transition-colors`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-zinc-100 group-hover:text-white transition-colors truncate">
                  {session.genre || typeConfig.label}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-[10px] uppercase tracking-wider py-0 px-2 border-zinc-700 text-zinc-500`}>
                    {isGeneral ? 'Tactical' : 'Applied'}
                  </Badge>
                  <span className="text-[11px] text-zinc-600 font-medium">
                    {videoCount} {videoCount === 1 ? 'Source' : 'Sources'}
                  </span>
                </div>
              </div>
            </div>

            {/* Micro Context / Summary Snippet */}
            <div className="flex-1 space-y-3">
              {session.summary ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <Brain className="h-3 w-3" />
                    Focus
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 italic">
                    {session.summary}
                  </p>
                </div>
              ) : (
                <div className="h-[72px] flex flex-col justify-center">
                   <p className="text-xs text-zinc-600 leading-relaxed italic">
                     Analyzing venture patterns from {videoCount} source materials...
                   </p>
                </div>
              )}
            </div>

            {/* Progression Logic */}
            {!isGeneral && (
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Goal Status</span>
                  <span className="text-[10px] font-bold text-zinc-400">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full ${hasEvaluations ? 'bg-emerald-500' : 'bg-teal-500'} shadow-[0_0_8px_rgba(20,184,166,0.3)]`}
                  />
                </div>
                {hasEvaluations ? (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold bg-emerald-500/5 py-1.5 px-3 rounded-lg border border-emerald-500/10">
                    <Sparkles className="h-3 w-3" />
                    High Signal Convergence
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 pl-1">
                    {videosNeeded} more {videosNeeded === 1 ? 'video' : 'videos'} for full evaluation
                  </p>
                )}
              </div>
            )}

            {isSpecific && (
              <button
                onClick={(e) => handleDeleteSession(e, session.id)}
                className="absolute bottom-4 right-4 p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-800 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                title="Archive session"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </Card>
        </Link>
      </motion.div>
    );
  };
  
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-zinc-100">Analysis Sessions</h1>
        <p className="mt-1 text-zinc-500">
          Records of analyzed videos, grouped by content type
        </p>
      </div>
      
      {/* Visual Explainer Card */}
      <Card className="bg-gradient-to-br from-purple-950/40 via-zinc-900/50 to-zinc-900/50 border-purple-800/30 p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-purple-950/50 border-2 border-purple-800/50 flex items-center justify-center">
                <Layers className="h-12 w-12 text-purple-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-teal-950/50 border-2 border-teal-800/50 flex items-center justify-center">
                <Target className="h-4 w-4 text-teal-400" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 text-center lg:text-left">
            <h3 className="text-2xl font-semibold text-purple-100 mb-3">
              Build Knowledge, Track Progress
            </h3>
            <p className="text-base text-purple-200/90 leading-relaxed mb-2">
              Sessions organize your analyzed videos into meaningful collections—tracking execution steps, requirements, and feasibility patterns across multiple sources.
            </p>
            <p className="text-sm text-purple-300/70">
              Compare insights, spot recurring themes, and build a comprehensive understanding of what each venture truly requires.
            </p>
          </div>
          
          <div className="flex gap-3 lg:flex-col">
            <div className="flex items-center gap-2 text-purple-300/80">
              <Grid className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">Organize</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300/80">
              <Target className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">Compare</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300/80">
              <TrendingUp className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">Track</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Analysis in Progress Banner */}
      {analyzingVideoId && (
        <Card className="bg-blue-950/30 border-blue-800/50 p-6">
          <div className="flex items-center gap-4">
            <Loader2 className="h-6 w-6 text-blue-400 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-medium text-blue-300 mb-1">Analyzing Video...</h3>
              <p className="text-sm text-blue-400/90">
                Your video is being analyzed and will appear below when complete. This typically takes 30-60 seconds.
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Sessions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 bg-zinc-800/50" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Advice Sessions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Grid className="h-5 w-5 text-zinc-400" />
              <h2 className="text-lg font-medium text-zinc-200">Advice Sessions</h2>
              <span className="text-sm text-zinc-500">({generalSessions.length})</span>
            </div>
            {generalSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {generalSessions.map(renderSessionCard)}
                </AnimatePresence>
              </div>
            ) : (
              <Card className="bg-zinc-900/30 border-zinc-800/30 p-8 text-center">
                <p className="text-sm text-zinc-500">
                  No advice sessions yet. Advice videos (broad, exploratory) will appear here once analyzed.
                </p>
              </Card>
            )}
          </div>
          
          {/* Venture Roadmaps (Applied Niches) */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-teal-400" />
                <h2 className="text-xl font-bold text-zinc-100">Venture Roadmaps</h2>
                <span className="text-sm text-zinc-500">({specificSessions.length})</span>
              </div>
              <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed">
                Applied execution paths where broad advice is distilled into concrete business models. These sessions track your progression from discovery to a validated venture.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {/* Real Specific Sessions */}
                {specificSessions.map(renderSessionCard)}
              </AnimatePresence>
              

            {specificSessions.length === 0 && (
              <Card className="bg-zinc-900/30 border-zinc-800/30 p-8 text-center col-span-full">
                <p className="text-sm text-zinc-500">
                  Niches will appear automatically when you analyze execution-focused videos. No manual creation needed.
                </p>
              </Card>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}