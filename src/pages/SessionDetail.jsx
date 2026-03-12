import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ArrowLeft, Grid, Target, Clock, Lightbulb, DollarSign, TrendingUp, Shield, Zap, RefreshCw, ChevronDown, ArrowRight, Trash2, Coins, Brain, Activity, AlertCircle, BarChart3, Anchor, Eye, Users, Search, Layers } from 'lucide-react';
import FrictionBadge from '@/components/ui/FrictionBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import VideoCard from '@/components/dashboard/VideoCard';
import SubstepDetailPopup from '@/components/session/SubstepDetailPopup';
import DimensionCard from '@/components/session/DimensionCard';
import AccumulationSnapshotModal from '@/components/session/AccumulationSnapshotModal.jsx';
import LoadingWithMessage from '@/components/ui/LoadingWithMessage';

export default function SessionDetail() {
  const [user, setUser] = useState(null);
  const [accumulatedClaims, setAccumulatedClaims] = useState(null);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSubstep, setSelectedSubstep] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [analyzingVideoId, setAnalyzingVideoId] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('id');
  const newAnalyzingVideoId = urlParams.get('analyzingVideoId');

  const [openSubsteps, setOpenSubsteps] = useState(() => {
    const stored = localStorage.getItem(`session-${sessionId}-openSubsteps`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const hasTriggeredAutoRefresh = React.useRef(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const toggleSubstepOpen = (key) => {
    setOpenSubsteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      // Persist to localStorage
      localStorage.setItem(`session-${sessionId}-openSubsteps`, JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  useEffect(() => {
    loadUser();

    // Check if there's a newly analyzing video
    if (newAnalyzingVideoId) {
      setAnalyzingVideoId(newAnalyzingVideoId);
    }
  }, [newAnalyzingVideoId]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {}
  };

  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const sessions = await base44.entities.AccumulationSession.filter({ id: sessionId });
      return sessions[0];
    }
  });

  const { data: videos = [], isLoading: videosLoading, refetch: refetchVideos } = useQuery({
    queryKey: ['session-videos', session?.id, session?.accumulated_videos, session?.general_video_ids],
    queryFn: async () => {
      if (!session) return [];
      const sessionType = session?.session_type || 'general';

      // For general sessions, fetch from general_video_ids
      if (sessionType === 'general') {
        const videoIds = session?.general_video_ids || [];
        if (videoIds.length === 0) return [];
        const videoPromises = videoIds.map((videoId) => {
          if (!videoId) return Promise.resolve(null);
          return base44.entities.Video.filter({ id: videoId }).
          then((fetchedVideos) => {
            const video = fetchedVideos[0];
            return video ? { ...video, session_info: { video_id: videoId } } : null;
          }).
          catch(() => null);
        });
        const fetchedVideos = await Promise.all(videoPromises);
        return fetchedVideos.filter((v) => v !== null && v !== undefined);
      } else {
        // For specific sessions, fetch from accumulated_videos
        const accVids = session?.accumulated_videos || [];
        if (accVids.length === 0) return [];
        const videoPromises = accVids.map((av) => {
          if (!av?.video_id) return Promise.resolve(null);
          return base44.entities.Video.filter({ id: av.video_id }).
          then((fetchedVideos) => {
            const video = fetchedVideos[0];
            return video ? { ...video, session_info: av } : null;
          }).
          catch(() => null);
        });
        const fetchedVideos = await Promise.all(videoPromises);
        return fetchedVideos.filter((v) => v !== null && v !== undefined);
      }
    },
    enabled: !!session
  });

  // Real-time subscription to detect when video analysis is complete
  useEffect(() => {
    if (!analyzingVideoId) return;

    const unsubscribe = base44.entities.Video.subscribe((event) => {
      if (event.id === analyzingVideoId && event.type === 'update') {
        // Check if analysis is complete
        if (event.data?.friction_analysis || event.data?.rating || event.data?.multi_venture_analysis) {
          setAnalyzingVideoId(null);
          refetchSession();
          refetchVideos();
        }
      }
    });

    return () => unsubscribe();
  }, [analyzingVideoId]);

  const generateSessionSummary = async () => {
    if (!session || session.summary || isGeneratingSummary) return;

    setIsGeneratingSummary(true);
    try {
      const videoTitles = videos.slice(0, 5).map((v) => v.title).join(', ');
      const sessionType = session.session_type === 'specific' ? 'specific execution path' : 'general exploration';
      const genre = session.genre || 'business opportunities';

      const prompt = `Based on these session themes: ${videoTitles || 'various business concepts'}
      
Provide a professional "Market Intelligence Brief" (approx 70-90 words) about this business niche in general. 
DO NOT just summarize the videos. Instead, extrapolate from the titles to explain:
1) The general business model and how value is created in this industry.
2) The competitive landscape and common barriers to entry.
3) The core skills or operational focus required for a founder to succeed in this venture.

Make it sound like a high-level executive summary for an investor - realistic, insightful, and oriented towards long-term business fundamentals.`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      const summary = result.trim();

      await base44.entities.AccumulationSession.update(session.id, { summary });
      refetchSession();
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  useEffect(() => {
    if (session && !session.summary && videos.length > 0 && !isGeneratingSummary) {
      generateSessionSummary();
    }
  }, [session?.id, session?.summary, videos.length]);


  const hasExecutionClaims = session?.summarized_execution_claims &&
  Object.values(session.summarized_execution_claims).some((arr) => arr && arr.length > 0);

  const { data: ventureFeasibility, isLoading: feasibilityLoading, refetch: refetchFeasibility } = useQuery({
    queryKey: ['venture-feasibility', sessionId, session?.cached_feasibility],
    queryFn: async () => {
      if (!sessionId) return null;
      // Return cached feasibility if available
      if (session?.cached_feasibility) {
        return session.cached_feasibility;
      }
      const response = await base44.functions.invoke('aggregateSessionFeasibility', { sessionId });
      return response.data;
    },
    enabled: !!(session && hasExecutionClaims),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  const handleRefreshExecutionSteps = async () => {
    setClaimsLoading(true);
    try {
      const claimsVideos = videos.filter((v) => v.friction_analysis);

      if (claimsVideos.length === 0) {
        alert('No analyzed videos found. Please analyze videos first.');
        setClaimsLoading(false);
        return;
      }

      const executionSteps = {
        entry: [],
        validation: [],
        execution: [],
        scale: []
      };

      claimsVideos.forEach((video) => {
        if (video.friction_analysis?.execution_claims) {
          const claims = video.friction_analysis.execution_claims;
          ['entry', 'validation', 'execution', 'scale'].forEach((phase) => {
            if (claims[phase]?.status === 'Mentioned' && claims[phase]?.sub_points) {
              executionSteps[phase].push(...claims[phase].sub_points);
            }
          });
        }
      });

      // Check if we have any claims to process
      const hasClaims = Object.values(executionSteps).some((arr) => arr.length > 0);
      if (!hasClaims) {
        alert('No execution claims found in the analyzed videos. The videos may need to be re-analyzed or may not contain execution phase details.');
        setClaimsLoading(false);
        return;
      }

      const result = await base44.functions.invoke('summarizeExecutionClaims', {
        allPhases: executionSteps,
        sessionId
      });

      if (!result.data) {
        throw new Error('No data returned from analysis');
      }

      const summarized = {
        entry: result.data?.entry || [],
        validation: result.data?.validation || [],
        execution: result.data?.execution || [],
        scale: result.data?.scale || []
      };

      setAccumulatedClaims(summarized);

      await base44.entities.AccumulationSession.update(session.id, {
        summarized_execution_claims: summarized
      });
    } catch (error) {
      console.error('Failed to refresh execution steps:', error);
      alert(`Failed to analyze execution steps: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setClaimsLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    setAccumulatedClaims(null);
    try {
      // Clear cached claims from session
      await base44.entities.AccumulationSession.update(session.id, {
        summarized_execution_claims: { entry: [], validation: [], execution: [], scale: [] }
      });

      // Refresh session and videos data
      await Promise.all([
      refetchSession(),
      refetchVideos()]
      );

      // Refresh feasibility (with error handling)
      try {
        await base44.functions.invoke('aggregateSessionFeasibility', { sessionId, forceRefresh: true });
        await refetchFeasibility();
      } catch (feasError) {
        console.error('Feasibility refresh failed:', feasError);
        // Continue even if feasibility fails
      }

      // Trigger execution steps refresh after all other refreshes
      await handleRefreshExecutionSteps();
    } catch (error) {
      console.error('Refresh failed:', error);
      alert(`Refresh failed: ${error.message || 'Please try again.'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Delete this video from the session?')) return;

    const sessionType = session.session_type || 'general';

    if (sessionType === 'general') {
      const updatedIds = (session.general_video_ids || []).filter((id) => id !== videoId);
      await base44.entities.AccumulationSession.update(session.id, {
        general_video_ids: updatedIds
      });
    } else {
      const updatedVideos = (session.accumulated_videos || []).filter((av) => av.video_id !== videoId);
      await base44.entities.AccumulationSession.update(session.id, {
        accumulated_videos: updatedVideos
      });
    }

    refetchSession();
    refetchVideos();
  };

  const handleResetAccumulation = async () => {
    const confirmMessage = `Are you sure you want to reset this accumulation?\n\nThis will:\n• Delete all videos from the session\n• Clear all execution steps\n• Reset feasibility analysis\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    const sessionType = session.session_type || 'general';

    try {
      if (sessionType === 'general') {
        await base44.entities.AccumulationSession.update(session.id, {
          general_video_ids: [],
          summarized_execution_claims: { entry: [], validation: [], execution: [], scale: [] },
          cached_feasibility: null
        });
      } else {
        await base44.entities.AccumulationSession.update(session.id, {
          accumulated_videos: [],
          summarized_execution_claims: { entry: [], validation: [], execution: [], scale: [] },
          cached_feasibility: null,
          refined_nuances: []
        });
      }

      setAccumulatedClaims(null);
      refetchSession();
      refetchVideos();
      refetchFeasibility();
    } catch (error) {
      console.error('Failed to reset accumulation:', error);
      alert('Failed to reset accumulation. Please try again.');
    }
  };

  useEffect(() => {
    // Load cached claims whenever session data updates
    if (session?.summarized_execution_claims && Object.values(session.summarized_execution_claims).some((arr) => arr && arr.length > 0)) {
      setAccumulatedClaims(session.summarized_execution_claims);
    }
  }, [session?.summarized_execution_claims]);

  useEffect(() => {
    // Auto-refresh execution steps once if they don't have sub_steps yet
    if (session && sessionType === 'specific' && accumulatedClaims && !claimsLoading && !hasTriggeredAutoRefresh.current) {
      const hasSubsteps = Object.values(accumulatedClaims).some((arr) =>
      arr && arr.some((item) => item.sub_steps && item.sub_steps.length > 0)
      );
      const hasAnyClaims = Object.values(accumulatedClaims).some((arr) => arr && arr.length > 0);

      if (hasAnyClaims && !hasSubsteps && !isRefreshing) {
        hasTriggeredAutoRefresh.current = true;
        handleRefreshExecutionSteps();
      }
    }
  }, [session?.id, accumulatedClaims]);

  const sessionTypeConfig = {
    general: {
      label: 'General',
      icon: Grid,
      color: 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50',
      description: 'Broad exploration, multiple ideas or strategies'
    },
    specific: {
      label: 'Specific',
      icon: Target,
      color: 'bg-blue-950/50 text-blue-400 border-blue-800/50',
      description: 'Focused execution path, concrete steps'
    }
  };

  if (sessionLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <LoadingWithMessage
            messages={[
            'Fetching your session details...',
            'Loading video data...',
            'Preparing analysis results...',
            'Almost there...']
            } />

        </Card>
      </div>);

  }

  if (!session) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 text-center">
          <p className="text-zinc-400">Session not found</p>
          <Link to={createPageUrl('Sessions')} className="text-teal-400 hover:text-teal-300 mt-4 inline-block">
            Back to Sessions
          </Link>
        </Card>
      </div>);

  }

  const sessionType = session.session_type || 'general';
  const typeConfig = sessionTypeConfig[sessionType];
  const TypeIcon = typeConfig.icon;

  const getNuancesToConsider = () => {
    if (videos.length === 0) return [];

    const nuanceVideos = session?.session_type === 'specific' ?
    videos.filter((v) => v.session_info?.session_rating === 'watch') :
    videos;

    const allNuances = nuanceVideos.reduce((acc, video) => {
      if (video?.failure_points_discussed && Array.isArray(video.failure_points_discussed)) {
        acc.push(...video.failure_points_discussed);
      }
      if (video?.constraints_mentioned && Array.isArray(video.constraints_mentioned)) {
        acc.push(...video.constraints_mentioned);
      }
      return acc;
    }, []);

    const nuanceCounts = {};
    allNuances.forEach((nuance) => {
      nuanceCounts[nuance] = (nuanceCounts[nuance] || 0) + 1;
    });

    return Object.entries(nuanceCounts).
    sort((a, b) => b[1] - a[1]).
    slice(0, 6).
    map(([nuance, count]) => ({ nuance, count }));
  };

  const nuancesToConsider = getNuancesToConsider();

  const watchVideos = session?.session_type === 'specific' ?
  videos.filter((v) => v.session_info?.session_rating === 'watch' && v.friction_analysis) :
  videos.filter((v) => v.friction_analysis);
  const hasMinimumVideos = videos.filter((v) => v.friction_analysis).length >= 3;


  return (
    <>
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back Button and Refresh */}
      <div className="flex items-center justify-between">
        <Link to={createPageUrl('Sessions')} className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Sessions</span>
        </Link>
        <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 transition-colors border border-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed">

          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh All'}</span>
        </button>
      </div>
      
      {/* Analysis in Progress Banner */}
      {analyzingVideoId &&
        <Card className="bg-blue-950/30 border-blue-800/50 p-6">
          <div className="flex items-center gap-4">
            <RefreshCw className="h-6 w-6 text-blue-400 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-medium text-blue-300 mb-1">Analyzing Video...</h3>
              <p className="text-sm text-blue-400/90">
                Your video is being analyzed and will appear in this session when complete. This typically takes 30-60 seconds.
              </p>
            </div>
          </div>
        </Card>
        }

      {/* Session Header */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 lg:p-8 backdrop-blur-sm transition-all">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1 space-y-4">
            {/* Context Badge & Date */}
            <div className="flex items-center flex-wrap gap-3">
              <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${typeConfig.color}`}>
                <div className="flex items-center gap-2">
                  <TypeIcon className="h-3.5 w-3.5" />
                  {session.genre || typeConfig.label}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                <Clock className="h-3.5 w-3.5" />
                {session.created_date && format(new Date(session.created_date), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-teal-500/80 font-semibold bg-teal-500/5 px-2.5 py-1 rounded-md border border-teal-500/10">
                <Activity className="h-3.5 w-3.5" />
                {(sessionType === 'general' ? session.general_video_ids?.length : session.accumulated_videos?.length) || 0} Videos Analyzed
              </div>
            </div>

            {/* Title Section */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight leading-tight">
                {session.genre ? `Specific execution path for ${session.genre}` : typeConfig.label + ' Venture Exploration'}
              </h1>
              {!session.genre && <p className="text-zinc-500 mt-1 text-sm font-medium">{typeConfig.description}</p>}
            </div>
            
            {/* Venture Brief Section (Paragraph) */}
            <div className="pt-2">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-teal-500/60 mb-3 flex items-center gap-2">
                <Brain className="h-3 w-3" />
                Venture Brief
              </h3>
              {isGeneratingSummary ? (
                <div className="flex items-center gap-3 py-4 animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-teal-500" />
                  <p className="text-sm text-zinc-500 font-medium italic">Synthesizing common patterns into a venture brief...</p>
                </div>
              ) : session.summary ? (
                <p className="text-base md:text-lg text-zinc-300 leading-relaxed max-w-4xl text-balance">
                  {session.summary}
                </p>
              ) : (
                <p className="text-sm text-zinc-600 italic py-2 border-l-2 border-zinc-800 pl-4 bg-zinc-800/10 rounded-r-lg">
                  A venture brief will be automatically generated once your video analysis is complete.
                </p>
              )}
            </div>
            
            {/* Accumulation Action */}
            <div className="flex items-center flex-wrap gap-4 pt-4 border-t border-zinc-800/40">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Latest Intelligence</p>
                {session?.video_accumulation_snapshots?.length > 0 ? (
                  <AccumulationSnapshotModal
                    snapshot={session.video_accumulation_snapshots[0]}
                    trigger={
                      <button className="inline-flex items-center gap-2 group text-sm text-zinc-300 hover:text-teal-400 transition-colors font-medium">
                        <Layers className="h-4 w-4 text-teal-500/70" />
                        <span>View Consolidated Accumulation</span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </button>
                    }
                  />
                ) : (
                  <p className="text-xs text-zinc-600 font-medium flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5" />
                    No snapshots captured yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex md:flex-col gap-3 flex-shrink-0">
            <Link to={createPageUrl('Analyze')}>
              <button className="w-full px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold shadow-lg shadow-teal-900/20 transition-all flex items-center justify-center gap-2 border border-teal-500/20 group">
                <Search className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
                Add Videos
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Convergence Summary - Specific Sessions Only */}
      {sessionType === 'specific' && accumulatedClaims && Object.values(accumulatedClaims).some((arr) => arr && arr.length > 0) && (() => {
          const totalVideos = videos.length;
          const allSteps = [...(accumulatedClaims.entry || []), ...(accumulatedClaims.validation || []), ...(accumulatedClaims.execution || []), ...(accumulatedClaims.scale || [])];
          const totalUniqueSteps = allSteps.length;
          const avgRepetition = totalUniqueSteps > 0 ?
          Math.round(allSteps.reduce((sum, step) => sum + (step.count || 0), 0) / allSteps.length / totalVideos * 100) :
          0;
          const newStepsCount = allSteps.filter((step) => step.count === 1).length;
          const newStepFreq = totalVideos > 0 ? Math.round(newStepsCount / totalVideos * 100) : 0;
          const isStabilizing = avgRepetition > 75 && newStepFreq < 20;

          return null;
































        })()}

      {/* Tabbed Layout for Specific Sessions */}
      {sessionType === 'specific' ?
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50 border border-zinc-700/50">
            <TabsTrigger value="videos" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100">Videos</TabsTrigger>
            <TabsTrigger value="execution" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100">Execution</TabsTrigger>
            <TabsTrigger value="feasibility" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100">Feasibility</TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4 mt-6">
            <div>
              <h2 className="text-lg font-medium text-zinc-200 mb-4">Accumulated Videos</h2>
              {videosLoading ?
              <Card className="bg-zinc-900/50 border-zinc-800/50">
              <LoadingWithMessage
                  messages={[
                  'Fetching accumulated videos...',
                  'Loading analysis results...',
                  'Preparing video cards...']
                  } />

            </Card> :
              videos.length > 0 ?
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {videos.map((video, idx) => {
                const snapshot = session?.video_accumulation_snapshots?.find(s => s.video_id === video.id);
                return (
                <Card key={video.id} className="bg-zinc-800/40 border border-zinc-700/40 p-4 flex flex-col w-[280px] flex-shrink-0">
                  <VideoCard
                    video={video}
                    sessionId={sessionId}
                    onDelete={handleDeleteVideo}
                    accumulationNumber={idx + 1} />



                  {snapshot && (
                    <div className="mt-3 pt-3 border-t border-zinc-700/30">
                      <AccumulationSnapshotModal
                        snapshot={snapshot}
                        trigger={
                          <button className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-teal-600/20 border border-teal-700/40 text-teal-300 hover:bg-teal-600/30 transition-colors text-xs font-medium">
                            <Layers className="h-3.5 w-3.5" />
                            View Accumulation
                          </button>
                        }
                      />
                    </div>
                  )}
                </Card>
                );
              })}
            </div> :

              <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 text-center">
              <p className="text-zinc-400">No videos in this session</p>
              </Card>
              }

            {/* Reset Accumulation Button */}
            {videos.length > 0 &&
              <div className="mt-6 pt-6 border-t border-zinc-800/50">
                <button
                  onClick={handleResetAccumulation}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-950/50 hover:bg-red-950/70 text-red-300 hover:text-red-200 transition-colors border border-red-800/50">
                  <Trash2 className="h-4 w-4" />
                  <span>Reset Accumulation</span>
                </button>
                <p className="text-xs text-zinc-500 mt-2">This will delete all videos and reset the session</p>
              </div>
              }
            </div>
          </TabsContent>

          {/* Execution Tab */}
          <TabsContent value="execution" className="space-y-4 mt-6">
            {claimsLoading ?
            <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
                <div className="flex items-start gap-3 mb-6">
                  <Zap className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium text-zinc-100">Overall Execution Steps</h3>
                    <p className="text-sm text-zinc-400 mt-1">Comprehensive step-by-step execution path</p>
                  </div>
                </div>
                <LoadingWithMessage
                messages={[
                'Extracting execution claims from videos...',
                'Identifying entry phase steps...',
                'Analyzing execution patterns...',
                'Processing scale strategies...',
                'Summarizing substeps and requirements...',
                'Finalizing comprehensive roadmap...']
                }
                interval={1800} />

              </Card> :
            !videosLoading && hasMinimumVideos && accumulatedClaims && Object.values(accumulatedClaims).some((arr) => arr && arr.length > 0) ?
            <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-medium text-zinc-100">Overall Execution Steps</h3>
                      <p className="text-sm text-zinc-400 mt-1">Comprehensive step-by-step execution path across all videos</p>
                    </div>
                  </div>
                  <button
                  onClick={handleRefreshExecutionSteps}
                  disabled={claimsLoading}
                  className="p-2 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                  title="Refresh execution steps">
                    <RefreshCw className={`h-4 w-4 text-zinc-400 group-hover:text-zinc-200 transition-all ${claimsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(() => {
                  let stepCounter = 1;
                  return (
                    <>
                        {accumulatedClaims.entry.length > 0 &&
                      <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className="bg-emerald-950/30 border-emerald-800/50 text-emerald-300">Entry</Badge>
                              <span className="text-xs text-zinc-500">{accumulatedClaims.entry.length} steps</span>
                            </div>
                            <div className="space-y-2">
                              {accumulatedClaims.entry.map((item, idx) => {
                            const currentStep = stepCounter++;
                            return (
                              <Collapsible key={idx} defaultOpen={false}>
                                    <CollapsibleTrigger className="flex items-start gap-3 w-full p-3 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg border border-zinc-700/30 transition-colors text-left group">
                                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                                        <span className="text-sm font-semibold text-emerald-300">{currentStep}</span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-zinc-300 font-medium">{item.representative}</p>
                                        {(() => {
                                      const totalVideos = videos.length;
                                      const stepCount = Math.min(item.count || 0, totalVideos);
                                      const percentage = totalVideos > 0 ? Math.round(stepCount / totalVideos * 100) : 0;
                                      const stability = percentage === 100 ? 'full' : percentage >= 66 ? 'high' : percentage >= 33 ? 'medium' : 'low';
                                      return (
                                        <div className="flex items-center gap-2 mt-1">
                                              <span className="text-xs text-zinc-500">
                                                Seen in {stepCount} / {totalVideos} videos ({percentage}%)
                                              </span>
                                              {stability === 'full' ?
                                          <Badge className="bg-emerald-950/30 border-emerald-800/50 text-emerald-300 text-xs">Fully Converged</Badge> :

                                          <Badge className={`text-xs ${
                                          stability === 'high' ? 'bg-teal-950/30 border-teal-800/50 text-teal-300' :
                                          stability === 'medium' ? 'bg-amber-950/30 border-amber-800/50 text-amber-300' :
                                          'bg-zinc-800/50 border-zinc-700/50 text-zinc-400'}`
                                          }>
                                                  {stability === 'high' ? 'High' : stability === 'medium' ? 'Medium' : 'Low'} Stability
                                                </Badge>
                                          }
                                            </div>);

                                    })()}
                                      </div>
                                      <ChevronDown className="h-4 w-4 text-zinc-500 transition-transform group-data-[state=open]:rotate-180 flex-shrink-0 mt-1" />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2 ml-10 p-3 bg-zinc-800/20 rounded-lg border border-zinc-700/20 space-y-2">
                                      {item.sub_steps && item.sub_steps.length > 0 &&
                                  <div className="pt-2 border-t border-zinc-700/20">
                                          <p className="text-xs text-zinc-400 font-medium mb-2">Detailed Substeps:</p>
                                          <div className="space-y-2">
                                           {item.sub_steps.map((substep, subIdx) => {
                                        const substepKey = `${sessionId}-entry-${idx}-${subIdx}`;
                                        const isOpen = openSubsteps.has(substepKey);
                                        return (
                                          <Collapsible key={subIdx} open={isOpen} onOpenChange={() => toggleSubstepOpen(substepKey)}>
                                               <CollapsibleTrigger className="flex items-start gap-3 w-full p-3 bg-zinc-900/50 hover:bg-zinc-900 rounded border border-zinc-700/30 transition-colors text-left group">
                                                 <p className="text-xs font-medium text-teal-300 flex-1">{substep.text}</p>
                                                 <ChevronDown className="h-3 w-3 text-zinc-500 transition-transform group-data-[state=open]:rotate-180 flex-shrink-0 mt-0.5" />
                                               </CollapsibleTrigger>
                                               <CollapsibleContent className="mt-2 ml-3 p-3 bg-zinc-800/40 rounded border border-zinc-700/20 space-y-2">
                                                 {substep.simplified_explanation &&
                                              <p className="text-xs text-zinc-300">{substep.simplified_explanation}</p>
                                              }
                                                 {(substep.cost_estimate || substep.time_estimate || substep.risk_level) &&
                                              <div className="space-y-1 pt-2 border-t border-zinc-700/20">
                                                     {substep.cost_estimate &&
                                                <div className="text-xs">
                                                         <span className="text-zinc-500">💰 Cost:</span> <span className="text-zinc-300">{substep.cost_estimate}</span>
                                                       </div>
                                                }
                                                     {substep.time_estimate &&
                                                <div className="text-xs">
                                                         <span className="text-zinc-500">⏱️ Time:</span> <span className="text-zinc-300">{substep.time_estimate}</span>
                                                       </div>
                                                }
                                                     {substep.risk_level &&
                                                <div className="text-xs">
                                                         <span className="text-zinc-500">⚠️ Risk:</span> <span className="text-zinc-300">{substep.risk_level}</span>
                                                       </div>
                                                }
                                                   </div>
                                              }
                                                 <div className="flex gap-2 pt-2 border-t border-zinc-700/20">
                                                   <button
                                                  onClick={() => {
                                                    setSelectedSubstep(substep);
                                                    setIsPopupOpen(true);
                                                  }}
                                                  className="flex-1 text-left text-xs text-teal-400 hover:text-teal-300 transition-colors">

                                                     View full details →
                                                   </button>
                                                   <a
                                                  href={`https://www.google.com/search?q=${encodeURIComponent(substep.text)}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex-1 text-center text-xs text-blue-400 hover:text-blue-300 transition-colors">

                                                     ✨ Search with AI
                                                   </a>
                                                 </div>
                                                 </CollapsibleContent>
                                                 </Collapsible>);

                                      })}
                                                 </div>
                                                 </div>
                                  }
                                                 </CollapsibleContent>
                                                 </Collapsible>);

                          })}
                                                 </div>
                                                 </div>
                      }

                                                 {accumulatedClaims.execution.length > 0 &&
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-purple-950/30 border-purple-800/50 text-purple-300">Execution</Badge>
                        {/* Update substepKey for execution phase below */}
                        <span className="text-xs text-zinc-500">{accumulatedClaims.execution.length} steps</span>
                        </div>
                        <div className="space-y-2">
                        {accumulatedClaims.execution.map((item, idx) => {
                            const currentStep = stepCounter++;
                            return (
                              <Collapsible key={idx} defaultOpen={false}>
                        <CollapsibleTrigger className="flex items-start gap-3 w-full p-3 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg border border-zinc-700/30 transition-colors text-left group">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-300">{currentStep}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 font-medium">{item.representative}</p>
                        {(() => {
                                      const totalVideos = videos.length;
                                      const stepCount = Math.min(item.count || 0, totalVideos);
                                      const percentage = totalVideos > 0 ? Math.round(stepCount / totalVideos * 100) : 0;
                                      const stability = percentage === 100 ? 'full' : percentage >= 66 ? 'high' : percentage >= 33 ? 'medium' : 'low';
                                      return (
                                        <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-500">
                                Seen in {stepCount} / {totalVideos} videos ({percentage}%)
                              </span>
                              {stability === 'full' ?
                                          <Badge className="bg-emerald-950/30 border-emerald-800/50 text-emerald-300 text-xs">Fully Converged</Badge> :

                                          <Badge className={`text-xs ${
                                          stability === 'high' ? 'bg-teal-950/30 border-teal-800/50 text-teal-300' :
                                          stability === 'medium' ? 'bg-amber-950/30 border-amber-800/50 text-amber-300' :
                                          'bg-zinc-800/50 border-zinc-700/50 text-zinc-400'}`
                                          }>
                                  {stability === 'high' ? 'High' : stability === 'medium' ? 'Medium' : 'Low'} Stability
                                </Badge>
                                          }
                            </div>);

                                    })()}
                        </div>
                        <ChevronDown className="h-4 w-4 text-zinc-500 transition-transform group-data-[state=open]:rotate-180 flex-shrink-0 mt-1" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 ml-10 p-3 bg-zinc-800/20 rounded-lg border border-zinc-700/20 space-y-2">
                        {item.sub_steps && item.sub_steps.length > 0 &&
                                  <div className="pt-2 border-t border-zinc-700/20">
                          <p className="text-xs text-zinc-400 font-medium mb-2">Detailed Substeps:</p>
                          <div className="space-y-2">
                           {item.sub_steps.map((substep, subIdx) => {
                                        const substepKey = `${sessionId}-execution-${idx}-${subIdx}`;
                                        const isOpen = openSubsteps.has(substepKey);
                                        return (
                                          <Collapsible key={subIdx} open={isOpen} onOpenChange={() => toggleSubstepOpen(substepKey)}>
                                               <CollapsibleTrigger className="flex items-start gap-3 w-full p-3 bg-zinc-900/50 hover:bg-zinc-900 rounded border border-zinc-700/30 transition-colors text-left group">
                                                 <p className="text-xs font-medium text-teal-300 flex-1">{substep.text}</p>
                                                 <ChevronDown className="h-3 w-3 text-zinc-500 transition-transform group-data-[state=open]:rotate-180 flex-shrink-0 mt-0.5" />
                                               </CollapsibleTrigger>
                                               <CollapsibleContent className="mt-2 ml-3 p-3 bg-zinc-800/40 rounded border border-zinc-700/20 space-y-2">
                                                 {substep.simplified_explanation &&
                                              <p className="text-xs text-zinc-300">{substep.simplified_explanation}</p>
                                              }
                                                 {(substep.cost_estimate || substep.time_estimate || substep.risk_level) &&
                                              <div className="space-y-1 pt-2 border-t border-zinc-700/20">
                                                     {substep.cost_estimate &&
                                                <div className="text-xs">
                                                         <span className="text-zinc-500">💰 Cost:</span> <span className="text-zinc-300">{substep.cost_estimate}</span>
                                                       </div>
                                                }
                                                     {substep.time_estimate &&
                                                <div className="text-xs">
                                                         <span className="text-zinc-500">⏱️ Time:</span> <span className="text-zinc-300">{substep.time_estimate}</span>
                                                       </div>
                                                }
                                                     {substep.risk_level &&
                                                <div className="text-xs">
                                                         <span className="text-zinc-500">⚠️ Risk:</span> <span className="text-zinc-300">{substep.risk_level}</span>
                                                       </div>
                                                }
                                                   </div>
                                              }
                                                 <div className="flex gap-2 pt-2 border-t border-zinc-700/20">
                                                   <button
                                                  onClick={() => {
                                                    setSelectedSubstep(substep);
                                                    setIsPopupOpen(true);
                                                  }}
                                                  className="flex-1 text-left text-xs text-teal-400 hover:text-teal-300 transition-colors">

                                                     View full details →
                                                   </button>
                                                   <a
                                                  href={`https://www.google.com/search?q=${encodeURIComponent(substep.text)}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex-1 text-center text-xs text-blue-400 hover:text-blue-300 transition-colors">

                                                     ✨ Search with AI
                                                   </a>
                                                 </div>
                                                 </CollapsibleContent>
                                                 </Collapsible>);

                                      })}
                                                 </div>
                                                 </div>
                                  }
                                                 </CollapsibleContent>
                                                 </Collapsible>);

                          })}
                                                 </div>
                                                 </div>
                      }

                                                 {accumulatedClaims.scale.length > 0 &&
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-amber-950/30 border-amber-800/50 text-amber-300">Scale</Badge>
                        {/* Update substepKey for scale phase below */}
                        <span className="text-xs text-zinc-500">{accumulatedClaims.scale.length} steps</span>
                        </div>
                        <div className="space-y-2">
                        {accumulatedClaims.scale.map((item, idx) => {
                            const currentStep = stepCounter++;
                            return (
                              <Collapsible key={idx} defaultOpen={false}>
                        <CollapsibleTrigger className="flex items-start gap-3 w-full p-3 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg border border-zinc-700/30 transition-colors text-left group">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
                        <span className="text-sm font-semibold text-amber-300">{currentStep}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 font-medium">{item.representative}</p>
                        {(() => {
                                      const totalVideos = videos.length;
                                      const stepCount = Math.min(item.count || 0, totalVideos);
                                      const percentage = totalVideos > 0 ? Math.round(stepCount / totalVideos * 100) : 0;
                                      const stability = percentage === 100 ? 'full' : percentage >= 66 ? 'high' : percentage >= 33 ? 'medium' : 'low';
                                      return (
                                        <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-500">
                                Seen in {stepCount} / {totalVideos} videos ({percentage}%)
                              </span>
                              {stability === 'full' ?
                                          <Badge className="bg-emerald-950/30 border-emerald-800/50 text-emerald-300 text-xs">Fully Converged</Badge> :

                                          <Badge className={`text-xs ${
                                          stability === 'high' ? 'bg-teal-950/30 border-teal-800/50 text-teal-300' :
                                          stability === 'medium' ? 'bg-amber-950/30 border-amber-800/50 text-amber-300' :
                                          'bg-zinc-800/50 border-zinc-700/50 text-zinc-400'}`
                                          }>
                                  {stability === 'high' ? 'High' : stability === 'medium' ? 'Medium' : 'Low'} Stability
                                </Badge>
                                          }
                            </div>);

                                    })()}
                        </div>
                        <ChevronDown className="h-4 w-4 text-zinc-500 transition-transform group-data-[state=open]:rotate-180 flex-shrink-0 mt-1" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 ml-10 p-3 bg-zinc-800/20 rounded-lg border border-zinc-700/20 space-y-2">
                        {item.sub_steps && item.sub_steps.length > 0 &&
                                  <div className="pt-2 border-t border-zinc-700/20">
                          <p className="text-xs text-zinc-400 font-medium mb-2">Detailed Substeps:</p>
                          <div className="space-y-2">
                           {item.sub_steps.map((substep, subIdx) => {
                                        const substepKey = `${sessionId}-scale-${idx}-${subIdx}`;
                                        const isOpen = openSubsteps.has(substepKey);
                                        return (
                                          <Collapsible key={subIdx} open={isOpen} onOpenChange={() => toggleSubstepOpen(substepKey)}>
                                               <CollapsibleTrigger className="flex items-start gap-3 w-full p-3 bg-zinc-900/50 hover:bg-zinc-900 rounded border border-zinc-700/30 transition-colors text-left group">
                                                 <p className="text-xs font-medium text-teal-300 flex-1">{substep.text}</p>
                                                 <ChevronDown className="h-3 w-3 text-zinc-500 transition-transform group-data-[state=open]:rotate-180 flex-shrink-0 mt-0.5" />
                                               </CollapsibleTrigger>
                                               <CollapsibleContent className="mt-2 ml-3 p-3 bg-zinc-800/40 rounded border border-zinc-700/20 space-y-2">
                                                 {substep.simplified_explanation &&
                                              <p className="text-xs text-zinc-300">{substep.simplified_explanation}</p>
                                              }
                                                 {(substep.cost_estimate || substep.time_estimate || substep.risk_level) &&
                                              <div className="space-y-1 pt-2 border-t border-zinc-700/20">
                                                     {substep.cost_estimate &&
                                                <div className="text-xs">
                                                         <span className="text-zinc-500">💰 Cost:</span> <span className="text-zinc-300">{substep.cost_estimate}</span>
                                                       </div>
                                                }
                                                     {substep.time_estimate &&
                                                <div className="text-xs">
                                                         <span className="text-zinc-500">⏱️ Time:</span> <span className="text-zinc-300">{substep.time_estimate}</span>
                                                       </div>
                                                }
                                                     {substep.risk_level &&
                                                <div className="text-xs">
                                                         <span className="text-zinc-500">⚠️ Risk:</span> <span className="text-zinc-300">{substep.risk_level}</span>
                                                       </div>
                                                }
                                                   </div>
                                              }
                                                 <div className="flex gap-2 pt-2 border-t border-zinc-700/20">
                                                   <button
                                                  onClick={() => {
                                                    setSelectedSubstep(substep);
                                                    setIsPopupOpen(true);
                                                  }}
                                                  className="flex-1 text-left text-xs text-teal-400 hover:text-teal-300 transition-colors">

                                                     View full details →
                                                   </button>
                                                   <a
                                                  href={`https://www.google.com/search?q=${encodeURIComponent(substep.text)}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex-1 text-center text-xs text-blue-400 hover:text-blue-300 transition-colors">

                                                     ✨ Search with AI
                                                   </a>
                                                 </div>
                                                 </CollapsibleContent>
                                                 </Collapsible>);

                                      })}
                                                 </div>
                                                 </div>
                                  }
                                                 </CollapsibleContent>
                                                 </Collapsible>);

                          })}
                                                 </div>
                                                 </div>
                      }
                                                 </>);

                })()}
                </div>
                </Card> :
            !videosLoading && !claimsLoading && !hasMinimumVideos ?
            <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
                <div className="flex items-start gap-3 mb-6">
                  <Zap className="h-5 w-5 text-zinc-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium text-zinc-100">Overall Execution Steps</h3>
                    <p className="text-sm text-zinc-400 mt-1">Comprehensive step-by-step execution path</p>
                  </div>
                </div>
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-2">
                    {videos.filter((v) => v.friction_analysis).length === 0 ?
                  'No analyzed videos yet' :
                  `Only ${videos.filter((v) => v.friction_analysis).length} analyzed video${videos.filter((v) => v.friction_analysis).length !== 1 ? 's' : ''}`
                  }
                  </p>
                  <p className="text-sm text-zinc-500">
                    Minimum 3 analyzed videos required for execution steps analysis.
                    {videos.filter((v) => v.friction_analysis).length > 0 && ` ${3 - videos.filter((v) => v.friction_analysis).length} more needed.`}
                  </p>
                </div>
                </Card> :

            <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
                <div className="flex items-start gap-3 mb-6">
                  <Zap className="h-5 w-5 text-zinc-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium text-zinc-100">Overall Execution Steps</h3>
                    <p className="text-sm text-zinc-400 mt-1">Comprehensive step-by-step execution path</p>
                  </div>
                </div>
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-2">Ready to analyze execution steps</p>
                  <p className="text-sm text-zinc-500 mb-6">
                    Execution steps will appear here once analysis is complete.
                  </p>
                  <button
                  onClick={handleRefreshExecutionSteps}
                  disabled={claimsLoading || !hasMinimumVideos}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">

                    <Zap className="h-4 w-4" />
                    Analyze Execution Steps
                  </button>
                </div>
                </Card>
            }

            {/* Nuances to Consider - Specific sessions only */}
            {!videosLoading && sessionType === 'specific' && nuancesToConsider.length > 0 &&
            <Card className="bg-amber-950/30 border-amber-800/50 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Target className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-base font-medium text-amber-100">Nuances to Consider</h3>
                    <p className="text-sm text-amber-300/70 mt-1">Critical factors and constraints mentioned</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {(session.refined_nuances && session.refined_nuances.length > 0 ? session.refined_nuances : nuancesToConsider.map((n) => n.nuance)).map((nuance, idx) =>
                <div key={idx} className="flex items-start gap-3">
                      <span className="text-xs font-medium text-amber-400 bg-amber-900/50 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-amber-100 text-sm pt-0.5">{nuance}</p>
                    </div>
                )}
                </div>
              </Card>
            }
          </TabsContent>

          {/* Feasibility Tab */}
          <TabsContent value="feasibility" className="space-y-4 mt-6">
            {feasibilityLoading ?
            <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-100">Venture Feasibility Score</h2>
                    <p className="text-sm text-zinc-400 mt-1">Analyzing your venture across all dimensions</p>
                  </div>
                </div>
                <LoadingWithMessage
                messages={[
                'Evaluating Capital Intensity requirements...',
                'Assessing Skill Complexity levels...',
                'Measuring Time to Feedback Loop...',
                'Analyzing Emotional Volatility Risk...',
                'Calculating Operational Complexity Growth...',
                'Evaluating Platform Dependency Risk...',
                'Determining Focus Requirements...',
                'Assessing Market Saturation Sensitivity...',
                'Synthesizing overall friction analysis...']
                }
                interval={1500} />

              </Card> :
            !isRefreshing && hasMinimumVideos && ventureFeasibility ?
            <div className="space-y-6">
                {/* Overall Friction Section */}
                <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-medium text-zinc-300">Overall Friction:</h3>
                    <FrictionBadge friction={ventureFeasibility.overall_friction} size="lg" />
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {ventureFeasibility.friction_summary}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    Based on {ventureFeasibility.analyzed_videos_count || 3} analyzed videos
                  </p>
                </Card>

                {/* What This Venture Requires */}
                {ventureFeasibility.venture_requirements && Object.keys(ventureFeasibility.venture_requirements).length > 0 &&
              <div>
                    <h3 className="text-base font-medium text-zinc-200 mb-3">What This Venture Requires</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ventureFeasibility.venture_requirements.time_needed &&
                  <Card className="bg-zinc-800/40 border-zinc-700/40 p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-blue-950/50 border border-blue-800/30">
                              <Clock className="h-4 w-4 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-zinc-400 mb-1">Time Commitment</p>
                              <p className="text-sm text-zinc-200 leading-relaxed">
                                {ventureFeasibility.venture_requirements.time_needed}
                              </p>
                            </div>
                          </div>
                        </Card>
                  }
                      
                      {ventureFeasibility.venture_requirements.capital_needed &&
                  <Card className="bg-zinc-800/40 border-zinc-700/40 p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-800/30">
                              <DollarSign className="h-4 w-4 text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-zinc-400 mb-1">Capital Investment</p>
                              <p className="text-sm text-zinc-200 leading-relaxed">
                                {ventureFeasibility.venture_requirements.capital_needed}
                              </p>
                            </div>
                          </div>
                        </Card>
                  }
                      
                      {ventureFeasibility.venture_requirements.skill_required &&
                  <Card className="bg-zinc-800/40 border-zinc-700/40 p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-purple-950/50 border border-purple-800/30">
                              <TrendingUp className="h-4 w-4 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-zinc-400 mb-1">Skills Needed</p>
                              <p className="text-sm text-zinc-200 leading-relaxed">
                                {ventureFeasibility.venture_requirements.skill_required}
                              </p>
                            </div>
                          </div>
                        </Card>
                  }
                      
                      {ventureFeasibility.venture_requirements.risk_level &&
                  <Card className="bg-zinc-800/40 border-zinc-700/40 p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-800/30">
                              <Shield className="h-4 w-4 text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-zinc-400 mb-1">Risk Profile</p>
                              <p className="text-sm text-zinc-200 leading-relaxed">
                                {ventureFeasibility.venture_requirements.risk_level}
                              </p>
                            </div>
                          </div>
                        </Card>
                  }
                    </div>
                  </div>
              }

                {/* 8 Dimension Structural Analysis */}
                {ventureFeasibility.eight_dimension_analysis &&
              <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-medium text-zinc-200">8-Dimension Structural Feasibility</h3>
                        <p className="text-xs text-zinc-500 mt-1">
                          {ventureFeasibility.eight_dimension_analysis.synthesis_sentence}
                        </p>
                      </div>
                      <button
                    onClick={async () => {
                      await base44.functions.invoke('aggregateSessionFeasibility', { sessionId, forceRefresh: true });
                      refetchFeasibility();
                    }}
                    className="p-2 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                    title="Refresh feasibility analysis">
                        <RefreshCw className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 group-hover:rotate-180 transition-all duration-500" />
                      </button>
                    </div>

                    {/* Dimension Cards - Collapsible */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ventureFeasibility.eight_dimension_analysis.dimensions.map((dimension, idx) => {
                    const dimensionIcons = {
                      'Capital Intensity': Coins,
                      'Skill Complexity': Brain,
                      'Time to Feedback Loop': Activity,
                      'Emotional Volatility Risk': AlertCircle,
                      'Operational Complexity Growth': BarChart3,
                      'Platform Dependency Risk': Anchor,
                      'Focus Requirement': Eye,
                      'Market Saturation Sensitivity': Users
                    };
                    const DimensionIcon = dimensionIcons[dimension.dimension_name] || Zap;

                    return (
                      <Collapsible key={idx}>
                            <CollapsibleTrigger className="w-full">
                              <Card className="bg-zinc-800/40 border-zinc-700/40 p-4 hover:bg-zinc-800/60 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                dimension.micro_verdict === 'high' ? 'bg-red-950/50 border border-red-800/30' :
                                dimension.micro_verdict === 'medium' ? 'bg-amber-950/50 border border-amber-800/30' :
                                'bg-emerald-950/50 border border-emerald-800/30'}`
                                }>
                                      <DimensionIcon className={`h-4 w-4 ${
                                  dimension.micro_verdict === 'high' ? 'text-red-400' :
                                  dimension.micro_verdict === 'medium' ? 'text-amber-400' :
                                  'text-emerald-400'}`
                                  } />
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm font-medium text-zinc-200">{dimension.dimension_name}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                dimension.micro_verdict === 'high' ? 'bg-red-900/50 text-red-300 border border-red-800/50' :
                                dimension.micro_verdict === 'medium' ? 'bg-amber-900/50 text-amber-300 border border-amber-800/50' :
                                'bg-emerald-900/50 text-emerald-300 border border-emerald-800/50'}`
                                }>
                                      {dimension.micro_verdict}
                                    </span>
                                    <ChevronDown className="h-4 w-4 text-zinc-500 group-data-[state=open]:rotate-180 transition-transform" />
                                  </div>
                                </div>
                              </Card>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <Card className="bg-zinc-900/50 border-zinc-800/50 p-4 mt-2">
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs font-medium text-zinc-400 mb-2">STRUCTURAL REALITY</p>
                                    <ul className="space-y-1.5">
                                      {dimension.structural_reality.map((reality, rIdx) =>
                                  <li key={rIdx} className="text-xs text-zinc-300 leading-relaxed flex items-start gap-2">
                                          <span className="text-zinc-600 mt-1">•</span>
                                          <span>{reality}</span>
                                        </li>
                                  )}
                                    </ul>
                                  </div>
                                  
                                  {dimension.personal_context_collision?.collision_exists &&
                              <div className="pt-3 border-t border-zinc-700/30">
                                      <p className="text-xs font-medium text-amber-400 mb-2">⚠️ Context Collision</p>
                                      <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                                        {dimension.personal_context_collision.collision_explanation}
                                      </p>
                                      {dimension.personal_context_collision.relevant_constraints &&
                                <div className="flex flex-wrap gap-1.5">
                                          {dimension.personal_context_collision.relevant_constraints.map((constraint, cIdx) =>
                                  <span key={cIdx} className="text-xs px-2 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-800/30">
                                              {constraint}
                                            </span>
                                  )}
                                        </div>
                                }
                                    </div>
                              }
                                </div>
                              </Card>
                            </CollapsibleContent>
                          </Collapsible>);

                  })}
                    </div>
                  </div>
              }
              </div> :

            <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
                <h2 className="text-lg font-semibold text-zinc-100 mb-4">Structural Feasibility Analysis</h2>
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                  {!hasExecutionClaims ?
                <>
                      <p className="text-zinc-400 mb-2">Execution steps must be analyzed first</p>
                      <p className="text-sm text-zinc-500 mb-6">
                        The feasibility analysis requires execution steps data. Please complete the execution analysis in the Execution tab first.
                      </p>
                    </> :
                watchVideos.length === 0 ?
                <>
                      <p className="text-zinc-400 mb-2">No analyzed videos yet</p>
                      <p className="text-sm text-zinc-500 mb-6">
                        Minimum 3 analyzed videos required for structural feasibility analysis.
                      </p>
                    </> :

                <>
                      <p className="text-zinc-400 mb-2">
                        Only {watchVideos.length} analyzed video{watchVideos.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-zinc-500 mb-6">
                        Minimum 3 analyzed videos required. {3 - watchVideos.length} more needed.
                      </p>
                    </>
                }
                  <button
                  onClick={async () => {
                    try {
                      const result = await base44.functions.invoke('aggregateSessionFeasibility', { sessionId, forceRefresh: true });
                      if (result?.data) {
                        await refetchSession();
                        await refetchFeasibility();
                      } else {
                        throw new Error('No data returned from feasibility analysis');
                      }
                    } catch (error) {
                      console.error('Feasibility analysis failed:', error);
                      alert(`Failed to analyze feasibility: ${error.message || 'Please try again.'}`);
                    }
                  }}
                  disabled={feasibilityLoading || !hasMinimumVideos || !hasExecutionClaims}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">

                    <Lightbulb className="h-4 w-4" />
                    Analyze Feasibility
                  </button>
                </div>
              </Card>
            }
            </TabsContent>
        </Tabs> :

        <div className="space-y-6">
          <h2 className="text-lg font-medium text-zinc-200">Analyzed Videos</h2>
          {videosLoading ?
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[1, 2, 3, 4].map((i) =>
            <Skeleton key={i} className="h-64 w-[280px] flex-shrink-0 bg-zinc-800/50 rounded-lg" />
            )}
            </div> :
          videos.length > 0 ?
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {videos.map((video, idx) =>
            <Card key={video.id} className="bg-zinc-800/40 border border-zinc-700/40 p-4 w-[280px] flex-shrink-0">
                <VideoCard
                video={video}
                sessionId={sessionId}
                onDelete={handleDeleteVideo}
                accumulationNumber={video.session_info?.order || idx + 1} />

              </Card>
            )}
        </div> :

          <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 text-center">
              <p className="text-zinc-400">No videos in this session</p>
            </Card>
          }

        {/* Reset Accumulation Button */}
        {videos.length > 0 &&
          <div className="mt-6 pt-6 border-t border-zinc-800/50">
            <button
              onClick={handleResetAccumulation}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-950/50 hover:bg-red-950/70 text-red-300 hover:text-red-200 transition-colors border border-red-800/50">
              <Trash2 className="h-4 w-4" />
              <span>Reset Accumulation</span>
            </button>
            <p className="text-xs text-zinc-500 mt-2">This will delete all videos and reset the session</p>
          </div>
          }
        </div>
        }
        <SubstepDetailPopup
          substep={selectedSubstep}
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)} />

        </div>
        </>);


}