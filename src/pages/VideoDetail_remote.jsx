import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import RatingBadge from '@/components/ui/RatingBadge';
import FrictionBadge from '@/components/ui/FrictionBadge';
import SignalMeter from '@/components/ui/SignalMeter';
import { ArrowLeft, ExternalLink, AlertTriangle, Clock, Tag, Pencil, Check, X, TrendingUp, DollarSign, Zap, Shield, Loader2, RefreshCw, ChevronLeft, ChevronRight, Sparkles, Plus, Trash2, Target, Hammer } from 'lucide-react';
import { toast } from 'sonner';
import AddTimestampedNoteDialog from '@/components/video/AddTimestampedNoteDialog';
import DetailsTab from '@/components/video/DetailsTab';
import AccumulationTab from '@/components/video/AccumulationTab';
import VideoBreakdownList from '@/components/video/VideoBreakdownList';
import { Skeleton } from '@/components/ui/skeleton';
import FeasixAdvisorHead from '@/components/FeasixAdvisorHead';
import ChapterChatPanel from '@/components/video/ChapterChatPanel';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import useEmblaCarousel from 'embla-carousel-react';

export default function VideoDetail() {
  const [user, setUser] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [analyzingFriction, setAnalyzingFriction] = useState(false);
  const [lastEvaluationDate, setLastEvaluationDate] = useState(null);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [timestampedNotes, setTimestampedNotes] = useState([]);
  const [creatingNiche, setCreatingNiche] = useState(null);
  const [showJumpIndicator, setShowJumpIndicator] = useState(false);
  const [jumpedToTimestamp, setJumpedToTimestamp] = useState('');
  const [isAnalysisInProgress, setIsAnalysisInProgress] = useState(false);
  const [iframeStartSeconds, setIframeStartSeconds] = useState(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const iframeRef = React.useRef(null);
  const playerRef = React.useRef(null);
  const [advisorMessage, setAdvisorMessage] = useState(null);
  const [advisorStatus, setAdvisorStatus] = useState('normal');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('id');
  let sessionId = urlParams.get('sessionId');
  
  // Fallback to sessionStorage if sessionId not in URL params
  if (!sessionId) {
    sessionId = sessionStorage.getItem('currentSessionId');
  }

  useEffect(() => {
    loadUser();
    
    // Load YouTube Iframe API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const jumpToTimestamp = (seconds, label) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seconds, true);
    } else {
      setIframeStartSeconds(seconds);
    }
    setJumpedToTimestamp(label);
    setShowJumpIndicator(true);
    setTimeout(() => setShowJumpIndicator(false), 3000);
  };

  const generateAdvisorResponse = async (chapter) => {
    if (!chapter || !video) return;
    
    setSelectedChapter(chapter);
    setIsGeneratingAdvice(true);
    setAdvisorStatus('thinking');
    setAdvisorMessage(null);
    
    try {
      const response = await base44.functions.invoke('generateAdvisorResponse', {
        videoId: video.id,
        chapterTimestamp: chapter.timestamp,
        chapterTitle: chapter.title,
        chapterDescription: chapter.explanation || chapter.significance,
        chapterPhase: chapter.phase
      });
      
      if (response.data) {
        setAdvisorMessage(response.data.message);
        setAdvisorStatus(response.data.status || 'normal');
      }
    } catch (error) {
      console.error('Failed to generate advisor response:', error);
      setAdvisorMessage('Unable to generate advice for this chapter.');
      setAdvisorStatus('warning');
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {}
  };

  // Check if analysis was just kicked off for this video (e.g. redirected from Analyze page)
  useEffect(() => {
    const stored = sessionStorage.getItem('feasix-analyzing-video');
    if (stored) {
      try {
        const { videoId: storedId } = JSON.parse(stored);
        if (storedId === videoId) setIsAnalysisInProgress(true);
      } catch (e) {}
    }
  }, [videoId]);

  const { data: video, isLoading, refetch } = useQuery({
    queryKey: ['video', videoId],
    queryFn: async () => {
      const videos = await base44.entities.Video.filter({ id: videoId });
      const videoData = videos[0];
      // If we were polling for analysis completion, check if it's done now
      if (videoData?.raw_friction_analysis_output || videoData?.multi_venture_analysis?.length > 0) {
        setIsAnalysisInProgress(false);
        sessionStorage.removeItem('feasix-analyzing-video');
        sessionStorage.removeItem('feasix-analysis-step');
        sessionStorage.removeItem('feasix-analysis-title');
      }
      return videoData;
    },
    enabled: !!(videoId && user),
    // Poll every 5s while analysis is in progress
    refetchInterval: isAnalysisInProgress ? 5000 : false,
  });

  // Find which session this video belongs to
  const { data: videoSession } = useQuery({
    queryKey: ['video-session', videoId],
    queryFn: async () => {
      if (!video) return null;
      
      const allSessions = await base44.entities.AccumulationSession.filter({
        created_by: user?.email
      });
      
      // Find session that contains this video
      const session = allSessions.find(s => {
        // Check general_video_ids
        if (s.general_video_ids?.includes(videoId)) return true;
        // Check accumulated_videos
        if (s.accumulated_videos?.some(v => v.video_id === videoId)) return true;
        return false;
      });
      
      return session;
    },
    enabled: !!(videoId && video && user)
  });

  useEffect(() => {
    if (video?.last_evaluated) {
      setLastEvaluationDate(new Date(video.last_evaluated));
    }
  }, [video]);

  useEffect(() => {
    if (video?.notes) {
      setNotes(video.notes);
    }
    if (video?.timestamped_notes) {
      setTimestampedNotes(video.timestamped_notes);
    }
  }, [video]);

  // Initialize YouTube Player when video changes
  useEffect(() => {
    if (!video?.youtube_id || !window.YT || !window.YT.Player) return;

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: video.youtube_id,
        playerVars: {
          start: iframeStartSeconds || 0,
          autoplay: iframeStartSeconds ? 1 : 0
        },
        events: {
          onReady: (event) => {
            // Start tracking time
            const interval = setInterval(() => {
              if (playerRef.current && playerRef.current.getCurrentTime) {
                const time = playerRef.current.getCurrentTime();
                setCurrentVideoTime(time);
              }
            }, 500); // Update every 500ms

            // Cleanup interval when component unmounts
            return () => clearInterval(interval);
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [video?.youtube_id, iframeStartSeconds]);





  const forceRefresh = async () => {
    await refetch();
  };

  const analyzeFriction = async () => {
    if (!video || !user) return;
    
    // For specific videos, must have transcript
    if (video.video_type === 'specific' && !video.has_transcript) {
      alert('This video requires a transcript to be analyzed. Please upload a transcript first.');
      return;
    }
    
    setAnalyzingFriction(true);
    
    try {
      // Branch based on video type
      if (video.video_type === 'general') {
        // For general videos, call extractVenturesFromVideo
        const detailsResult = await base44.functions.invoke('extractVenturesFromVideo', { videoId });
        await base44.entities.Video.update(videoId, { 
          multi_venture_analysis: detailsResult.data?.ventures || [],
          last_evaluated: new Date().toISOString()
        });
      } else {
        // For specific videos, call analyzeVideoWithTranscript (single backend entry point)
        // If in a session context, pass the saved accumulation snapshots from prior videos as context
        let accumulationData = {};
        if (sessionId && videoSession?.video_accumulation_snapshots?.length > 0) {
          // Get the most recent prior snapshot (excluding the current video) and send its raw accumulation JSON
          const priorSnapshots = videoSession.video_accumulation_snapshots.filter(s => s.video_id !== videoId);
          if (priorSnapshots.length > 0) {
            const mostRecent = priorSnapshots[priorSnapshots.length - 1];
            accumulationData = mostRecent.accumulation || {};
          }
        }

        const simulatedInput = `Video Title: "${video.title}"\n\nExperience Level: ${video.user_level || 'novice'}${Object.keys(accumulationData).length > 0 ? '\n\n' + JSON.stringify(accumulationData, null, 2) : ''}\n\nTranscript (timestamped):\n[will be appended by backend]`;
        console.log('[FRONTEND] Simulated OpenAI input (pre-send):\n', simulatedInput);
        console.log('[FRONTEND] accumulationData being sent:', JSON.stringify(accumulationData, null, 2));

        const response = await base44.functions.invoke('analyzeVideoWithTranscript', { videoId, accumulationData });
        
        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Analysis failed');
        }
        
        // Identify new perspectives if in session context
        if (sessionId) {
          try {
            const perspectivesResponse = await base44.functions.invoke('identifyNewPerspectives', {
              videoId,
              sessionId
            });
            
            if (perspectivesResponse.data?.success && perspectivesResponse.data?.new_perspectives) {
              await base44.entities.Video.update(videoId, {
                perspectives_identified: perspectivesResponse.data.new_perspectives
              });
            }
          } catch (perspectiveError) {
            console.error('Failed to identify perspectives:', perspectiveError);
          }
        }
      }
      
      // Refresh video data
      await queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      await refetch();
    } catch (error) {
      console.error('Failed to analyze:', error);
      
      let errorMessage = 'Analysis failed';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Analysis Failed', {
        description: errorMessage,
        duration: 6000
      });
    } finally {
      setAnalyzingFriction(false);
    }
  };

  const handleTranscriptReanalysis = async (transcriptText) => {
    try {
      // Parse and store transcript in normalized format
      const transcriptLines = transcriptText.split('\n').filter(line => line.trim());
      const normalizedTranscript = transcriptLines.map((line, idx) => ({
        start: idx * 3,
        end: (idx + 1) * 3,
        text: line.trim()
      }));

      // Update video with transcript
      await base44.entities.Video.update(videoId, {
        has_transcript: true,
        transcript: normalizedTranscript
      });

      // Call backend function with videoId only
      const response = await base44.functions.invoke('analyzeVideoWithTranscript', { videoId });

      if (response.data.success) {
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Reanalysis failed:', error);
      throw error;
    }
  };

  const updateTitleMutation = useMutation({
    mutationFn: (newTitle) => base44.entities.Video.update(videoId, { title: newTitle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['recent-videos'] });
      setIsEditingTitle(false);
    }
  });

  const deleteVideoMutation = useMutation({
    mutationFn: () => base44.entities.Video.delete(videoId),
    onSuccess: () => {
      window.location.href = createPageUrl('Dashboard');
    }
  });

  const handleDeleteVideo = () => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      deleteVideoMutation.mutate();
    }
  };

  const handleStartEdit = () => {
    setEditedTitle(video?.title || '');
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== video?.title) {
      updateTitleMutation.mutate(editedTitle.trim());
    } else {
      setIsEditingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditedTitle('');
  };

  const saveNotes = async () => {
    if (!videoId) return;
    setIsSavingNotes(true);
    try {
      await base44.entities.Video.update(videoId, { notes });
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAddTimestampedNote = async (note) => {
    if (!videoId) return;
    const updatedNotes = [...timestampedNotes, note];
    setTimestampedNotes(updatedNotes);
    try {
      await base44.entities.Video.update(videoId, { timestamped_notes: updatedNotes });
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
    } catch (error) {
      console.error('Failed to save timestamped note:', error);
    }
  };

  const handleDeleteTimestampedNote = async (index) => {
    if (!videoId) return;
    const updatedNotes = timestampedNotes.filter((_, i) => i !== index);
    setTimestampedNotes(updatedNotes);
    try {
      await base44.entities.Video.update(videoId, { timestamped_notes: updatedNotes });
      queryClient.invalidateQueries({ queryKey: ['video', videoId] });
    } catch (error) {
      console.error('Failed to delete timestamped note:', error);
    }
  };

  const handleCreateNiche = async (ventureName) => {
    setCreatingNiche(ventureName);
    try {
      const response = await base44.functions.invoke('createNicheSession', {
        ventureName,
        videoId: video.id
      });
      
      if (response.data?.success) {
        window.location.href = createPageUrl('SessionDetail') + `?id=${response.data.sessionId}`;
      } else {
        throw new Error(response.data?.error || 'Failed to create niche session');
      }
    } catch (error) {
      console.error('Failed to create niche:', error);
      alert(`Failed to create niche session: ${error.message}`);
      setCreatingNiche(null);
    }
  };

  const handleTranscriptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !video) return;

    setIsReanalyzing(true);
    try {
      // Read file content
      const transcriptText = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      console.log('Transcript text length:', transcriptText?.length);

      // Use the new reanalysis function that preserves execution_steps
      await handleTranscriptReanalysis(transcriptText);

      // Refresh video data
      await queryClient.invalidateQueries({ queryKey: ['video', videoId] });
      await refetch();
      setTranscriptFile(null);
    } catch (error) {
      console.error('Failed to reanalyze:', error);
      alert(`Failed to reanalyze video: ${error.message}`);
    } finally {
      setIsReanalyzing(false);
      e.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-zinc-800/50" />
        <Skeleton className="h-64 bg-zinc-800/50" />
        <Skeleton className="h-48 bg-zinc-800/50" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" className="mb-4 text-zinc-400">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 text-center">
          <p className="text-zinc-400">Video not found</p>
        </Card>
      </div>
    );
  }

  const isSimulated = video.is_simulated;

  // Derive the effective rating directly from the verdict text (source of truth)
  const verdictText = video.raw_friction_analysis_output?.feasix_verdict
    || video.raw_friction_analysis_output?.overview_tab?.feasix_verdict
    || video.friction_analysis?.FEASIX_VERDICT
    || '';
  const verdictRatingMatch = verdictText.match(/\b(watch|skim|skip)\b/i);
  const displayRating = verdictRatingMatch ? verdictRatingMatch[1].toLowerCase() : (video.rating || 'skim');

  // Find current video position in session
  const currentVideoIndex = videoSession?.accumulated_videos?.findIndex(v => v.video_id === videoId) ?? -1;
  const hasPrevVideo = currentVideoIndex > 0;
  const hasNextVideo = currentVideoIndex >= 0 && currentVideoIndex < (videoSession?.accumulated_videos?.length - 1 || 0);
  const prevVideoId = hasPrevVideo ? videoSession.accumulated_videos[currentVideoIndex - 1].video_id : null;
  const nextVideoId = hasNextVideo ? videoSession.accumulated_videos[currentVideoIndex + 1].video_id : null;

  return (
    <TooltipProvider>
    <div className="p-6 lg:p-8 lg:max-w-7xl mx-auto space-y-6 scroll-mt-0">
      {/* Back Button and Navigation */}
      <div className="flex items-center justify-between">
        <Link to={videoSession ? createPageUrl(`SessionDetail?id=${videoSession.id}`) : createPageUrl('Dashboard')}>
          <Button variant="ghost" className="text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {videoSession ? `Back to ${videoSession.genre}` : 'Back to Dashboard'}
          </Button>
        </Link>
        
        <div className="flex items-center gap-3">
          {/* Video Navigation Arrows */}
          {videoSession && video.video_type === 'specific' && (hasPrevVideo || hasNextVideo) && (
            <div className="flex items-center gap-2">
              <div className="text-right mr-2">
                <p className="text-xs font-medium text-zinc-400">Navigate Session Videos</p>
                <p className="text-xs text-zinc-500">
                  Video {currentVideoIndex + 1} of {videoSession.accumulated_videos.length}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (prevVideoId) {
                    window.location.href = createPageUrl(`VideoDetail?id=${prevVideoId}&sessionId=${videoSession.id}`);
                  }
                }}
                disabled={!hasPrevVideo}
                className="h-10 w-10 border-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                title="Previous video"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (nextVideoId) {
                    window.location.href = createPageUrl(`VideoDetail?id=${nextVideoId}&sessionId=${videoSession.id}`);
                  }
                }}
                disabled={!hasNextVideo}
                className="h-10 w-10 border-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                title="Next video"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          )}
          
          {video?.video_type === 'general' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteVideo}
              disabled={deleteVideoMutation.isPending}
              className="text-zinc-500 hover:text-red-400"
              title="Delete video"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Analysis In Progress Banner */}
      {isAnalysisInProgress && (
        <Card className="bg-teal-950/30 border-teal-800/50 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-teal-400 animate-spin flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-teal-300">Analysis in progress</h3>
              <p className="text-xs text-teal-500 mt-0.5">Fetching transcript and running AI analysis. This page will update automatically.</p>
            </div>
          </div>
        </Card>
      )}

      {/* No New Execution Steps Banner - UI Structure */}
      {video.video_type === 'specific' && false && (
        <Card className="bg-amber-950/30 border-amber-800/50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-base font-medium text-amber-300 mb-1">⚠ No New Execution Steps</h3>
              <p className="text-sm text-amber-400/90">
                This video reinforces the existing execution structure.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Video Header */}
      <Card className="bg-zinc-900/50 border-zinc-800/50 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Thumbnail */}
          <div className="relative w-full lg:w-80 aspect-video lg:aspect-auto lg:h-auto flex-shrink-0">
            {video.thumbnail_url ? (
              <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                <img 
                  src={video.thumbnail_url} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                <div className="text-zinc-600">No thumbnail</div>
              </div>
            )}
            {video.duration && (
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 rounded text-sm text-zinc-300">
                {video.duration}
              </div>
            )}
            {isSimulated && (
              <div className="absolute top-3 left-3 px-2 py-1 bg-amber-900/80 border border-amber-700/50 rounded text-sm text-amber-300 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Simulated
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="p-6 relative">
            {/* Session video number badge */}
            {currentVideoIndex >= 0 && (
              <div className="absolute top-4 right-4 w-14 h-14 rounded-full bg-teal-600/20 border-2 border-teal-500/50 flex items-center justify-center">
                <span className="text-2xl font-bold text-teal-300">{currentVideoIndex + 1}</span>
              </div>
            )}
            <div className="mb-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-2xl font-semibold bg-zinc-800/50 border-zinc-700 text-zinc-100"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSaveTitle}
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    <Check className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="text-zinc-500 hover:text-zinc-400"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-2 group">
                  <h1 className="text-2xl font-semibold text-zinc-100">{video.title}</h1>
                  <button
                    onClick={handleStartEdit}
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 transition-all"
                    title="Edit title"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-zinc-400 mb-4">{video.channel}</p>
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {displayRating && (
                <RatingBadge rating={displayRating} />
              )}
            </div>

            {/* Feasix Verdict Card */}
            {video?.raw_friction_analysis_output && verdictText && (
              <div className={`p-4 rounded-lg border ${
                displayRating === 'watch' ? 'bg-gradient-to-br from-emerald-950/30 to-emerald-900/10 border-emerald-800/30' :
                displayRating === 'skip'  ? 'bg-gradient-to-br from-red-950/30 to-red-900/10 border-red-800/30' :
                                            'bg-gradient-to-br from-amber-950/30 to-amber-900/10 border-amber-800/30'
              }`}>
                <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                  displayRating === 'watch' ? 'text-emerald-400' :
                  displayRating === 'skip'  ? 'text-red-400' :
                                              'text-amber-400'
                }`}>Feasix Verdict</h3>
                <p className="text-sm text-zinc-200 leading-relaxed">{verdictText}</p>
              </div>
            )}

          </div>
        </div>
      </Card>

      {/* Transcript Status Section */}
      <Card className="bg-zinc-900/50 border-zinc-800/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-medium text-zinc-300">Analysis Status</h4>
            {video.has_transcript ? (
              <Badge className="bg-emerald-950/30 border-emerald-800/50 text-emerald-300">
                <Check className="h-3 w-3 mr-1" />
                Transcript used
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-zinc-800/30 border-zinc-700/50 text-zinc-400">
                No transcript
              </Badge>
            )}

            {video.transcript && video.transcript.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-400 hover:text-zinc-100 h-7 text-xs px-2">
                    View Transcript
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[75vh] overflow-y-auto bg-zinc-900 border-zinc-800">
                  <DialogHeader>
                    <DialogTitle className="text-zinc-100">Transcript</DialogTitle>
                  </DialogHeader>
                  <div className="mt-3 space-y-1 font-mono text-xs text-zinc-300 leading-relaxed">
                    {video.transcript.map((seg, i) => {
                      const s = Math.floor(seg.start);
                      const mins = Math.floor(s / 60);
                      const secs = s % 60;
                      const ts = `${mins}:${String(secs).padStart(2, '0')}`;
                      return (
                        <p key={i}><span className="text-teal-400">[{ts}]</span> {seg.text}</p>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!video.has_transcript && (
              <>
                <input
                  type="file"
                  id="transcript-upload"
                  accept=".txt,.srt,.vtt"
                  onChange={handleTranscriptUpload}
                  disabled={isReanalyzing}
                  className="hidden"
                />
                <label htmlFor="transcript-upload">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:text-zinc-100 cursor-pointer"
                    disabled={isReanalyzing}
                    asChild
                  >
                    <span>
                      {isReanalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Upload Transcript
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                setAnalyzingFriction(true);
                try {
                  if (video?.raw_friction_analysis_output) {
                    const response = await base44.functions.invoke('processVideoAnalysisOutput', { videoId });
                    if (response.data?.success) {
                      await refetch();
                      toast.success('Display refreshed from stored analysis');
                    } else {
                      throw new Error(response.data?.error || 'Failed to refresh display');
                    }
                  } else {
                    await analyzeFriction();
                    await refetch();
                    const updatedVideo = await base44.entities.Video.filter({ id: videoId });
                    if (!updatedVideo[0]?.raw_friction_analysis_output) {
                      toast.error('Analysis Failed', {
                        description: 'Unable to generate raw analysis data.',
                        duration: 8000
                      });
                    }
                  }
                } catch (error) {
                  console.error('Failed to process:', error);
                  toast.error('Analysis Error', {
                    description: error.message || 'Could not complete the analysis.',
                    duration: 8000
                  });
                } finally {
                  setAnalyzingFriction(false);
                }
              }}
              disabled={analyzingFriction}
              className="border-zinc-700 text-zinc-400 hover:text-zinc-100"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${analyzingFriction ? 'animate-spin' : ''}`} />
              {video?.raw_friction_analysis_output ? 'Refresh Display' : 'Evaluate'}
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!video.raw_friction_analysis_output}
                  className={video.raw_friction_analysis_output
                    ? "border-teal-700 text-teal-300 hover:bg-teal-950/30 hover:text-teal-200"
                    : "border-zinc-700/50 text-zinc-500 cursor-not-allowed"
                  }
                  title={video.raw_friction_analysis_output ? "View raw AI analysis data" : "No raw analysis data available"}
                >
                  {video.raw_friction_analysis_output ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Raw JSON
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      No Raw Data
                    </>
                  )}
                </Button>
              </DialogTrigger>
              {video.raw_friction_analysis_output && (
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-zinc-900 border-zinc-800">
                  <DialogHeader>
                    <DialogTitle className="text-zinc-100">Raw AI Analysis Output</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <pre className="bg-zinc-950 p-4 rounded-lg text-xs text-zinc-300 overflow-x-auto border border-zinc-800">
                      {JSON.stringify(video.raw_friction_analysis_output, null, 2)}
                    </pre>
                  </div>
                </DialogContent>
              )}
            </Dialog>
          </div>
        </div>
      </Card>

      {/* Desktop Two-Column Layout for Specific Videos */}
      {video.video_type === 'specific' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Video and Signal Density */}
          <div className="space-y-6">
            {/* Larger Video Embed for Desktop */}
            {video.youtube_id && (
              <Card className="bg-zinc-900/50 border-zinc-800/50 overflow-hidden relative">
                <div className="w-full aspect-video">
                  <div id="youtube-player" className="w-full h-full" />
                </div>
                {showJumpIndicator && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-teal-600 text-white rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-medium">Jumped to {jumpedToTimestamp}</span>
                  </div>
                )}
              </Card>
            )}

            {/* Feasix Advisor Panel */}
            {selectedChapter && (advisorMessage || isGeneratingAdvice) && (
              <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 border-zinc-700/50 p-5 space-y-3">
                <div className="flex items-start gap-4">
                  <FeasixAdvisorHead 
                    status={isGeneratingAdvice ? 'thinking' : advisorStatus} 
                    size="md" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Feasix Advisor</h4>
                      {selectedChapter && (
                        <span className="text-xs text-zinc-500">• {selectedChapter.title}</span>
                      )}
                    </div>
                    {isGeneratingAdvice ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 text-teal-400 animate-spin" />
                        <span className="text-sm text-zinc-400">Analyzing chapter context...</span>
                      </div>
                    ) : advisorMessage ? (
                      <div className="relative bg-zinc-700/30 text-zinc-200 text-sm p-3 rounded-2xl shadow-md border border-zinc-600/30 before:content-[''] before:absolute before:-left-2 before:top-4 before:w-4 before:h-4 before:bg-zinc-700/30 before:border-l before:border-b before:border-zinc-600/30 before:rotate-45">
                        <p className="leading-relaxed">{advisorMessage}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
                
                {/* Chapter Chat Panel */}
                <ChapterChatPanel chapter={selectedChapter} video={video} />
              </Card>
            )}

            {/* Skeleton placeholders for left column while analysis is running */}
            {isAnalysisInProgress && !video?.raw_friction_analysis_output && (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full bg-zinc-800/50 rounded-lg" />
                <Skeleton className="h-20 w-full bg-zinc-800/50 rounded-lg" />
              </div>
            )}

            {/* What the Business Is + What This Video Talks About - summary below iframe */}
            {(video?.raw_friction_analysis_output?.overview_tab?.what_the_business_is || video?.raw_friction_analysis_output?.what_the_business_is || video?.raw_friction_analysis_output?.overview_tab?.what_this_video_talks_about || video?.raw_friction_analysis_output?.what_this_video_talks_about) && (
              <Card className="bg-zinc-900/50 border-zinc-800/50 p-5 space-y-4">
                {(video?.raw_friction_analysis_output?.overview_tab?.what_the_business_is || video?.raw_friction_analysis_output?.what_the_business_is) && (
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100 mb-1">What the Business Is</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {video.raw_friction_analysis_output?.overview_tab?.what_the_business_is || video.raw_friction_analysis_output?.what_the_business_is}
                    </p>
                  </div>
                )}
                {(video?.raw_friction_analysis_output?.overview_tab?.what_this_video_talks_about || video?.raw_friction_analysis_output?.what_this_video_talks_about) && (
                  <div className={(video?.raw_friction_analysis_output?.overview_tab?.what_the_business_is || video?.raw_friction_analysis_output?.what_the_business_is) ? "pt-4 border-t border-zinc-700/40" : ""}>
                    <h3 className="text-lg font-bold text-zinc-100 mb-1">What This Video Talks About</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {video.raw_friction_analysis_output?.overview_tab?.what_this_video_talks_about || video.raw_friction_analysis_output?.what_this_video_talks_about}
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* Talking Points / Chapters */}
            {video.talking_points && video.talking_points.length > 0 && (
              <Card className="bg-zinc-900/50 border-zinc-800/50 overflow-hidden">
                <Collapsible defaultOpen={false}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-6 hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-600/20 border border-teal-500/30">
                        <Clock className="h-5 w-5 text-teal-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-semibold text-teal-300">Talking Points</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{video.talking_points.length} chapters</p>
                      </div>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-zinc-500 transition-transform duration-200 group-data-[state=open]:rotate-90" style={{transform: 'rotate(-90deg)'}} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="border-t border-zinc-800/50 p-6 space-y-3">
                    {video.talking_points.map((point, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-teal-950/30 to-teal-900/10 rounded-lg border border-teal-800/30 hover:from-teal-950/50 hover:to-teal-900/20 transition-all cursor-pointer group"
                        onClick={() => {
                          const parts = point.timestamp.split(':');
                          let seconds = 0;
                          if (parts.length === 2) {
                            seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                          } else if (parts.length === 3) {
                            seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                          }
                          jumpToTimestamp(seconds, point.timestamp);
                        }}
                      >
                        <span className="text-xs font-mono font-bold text-teal-300 flex-shrink-0">{point.timestamp}</span>
                        <p className="text-sm font-medium text-zinc-100 group-hover:text-teal-300 transition-colors flex-1">{point.label}</p>
                        <ChevronLeft className="h-4 w-4 text-teal-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{transform: 'rotate(-90deg)'}} />
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Signal Density Below Video */}
            {video.raw_friction_analysis_output && video.signal_density !== undefined && video.signal_density > 0 && (
              <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Signal Density</h3>
                {(video.friction_rationale || video.rating_rationale || video.friction_analysis?.signal_density_rationale) && (
                  <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                    {video.video_type === 'general' 
                      ? video.friction_rationale 
                      : (video.friction_analysis?.signal_density_rationale || video.rating_rationale)}
                  </p>
                )}
                <SignalMeter value={video.signal_density} rating={video.rating} />
              </Card>
            )}
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
              <Tabs defaultValue="chapters" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-6 h-12 bg-zinc-900 p-1">
                  <TabsTrigger value="chapters" className="text-xs data-[state=active]:text-zinc-100">Chapters</TabsTrigger>
                  <TabsTrigger value="accumulation" className="text-xs data-[state=active]:text-zinc-100">Accumulation</TabsTrigger>
                  <TabsTrigger value="details" className="text-xs data-[state=active]:text-zinc-100">Details</TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs data-[state=active]:text-zinc-100">Notes</TabsTrigger>
                  <TabsTrigger value="analysis" className="text-xs data-[state=active]:text-zinc-100">Detailed Steps</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-0 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                  {video?.raw_friction_analysis_output ? (
                    <div className="space-y-6">
                      {/* Signal Density Summary */}
                      {video?.friction_analysis?.signal_density_rationale && (
                        <div className="p-4 bg-zinc-800/30 border-zinc-700/30 rounded-lg">
                          <h4 className="text-xs font-semibold text-zinc-300 mb-2">Analysis Summary</h4>
                          <p className="text-sm text-zinc-200 leading-relaxed">
                            {video.friction_analysis.signal_density_rationale}
                          </p>
                        </div>
                      )}


                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
                        <Sparkles className="h-8 w-8 text-zinc-500" />
                      </div>
                      <h3 className="text-base font-medium text-zinc-300 mb-2">No Analysis Available</h3>
                      <p className="text-xs text-zinc-500">
                        Click "Evaluate" to analyze this video.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="analysis" className="mt-0 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                  {/* Run Detailed Analysis Button */}
                  {!video?.friction_analysis?.execution_steps?.length && (
                    <div className="mb-6 p-5 bg-zinc-800/30 border border-zinc-700/30 rounded-lg text-center">
                      <h4 className="text-sm font-medium text-zinc-200 mb-2">Detailed Step Extraction</h4>
                      <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                        Use this when the video shows meaningful structural contribution or you want a full execution breakdown with constraint mapping.
                      </p>
                      <Button
                        onClick={async () => {
                          setAnalyzingFriction(true);
                          try {
                            await base44.functions.invoke('analyzeDetailedSteps', { videoId });
                            await queryClient.invalidateQueries({ queryKey: ['video', videoId] });
                            await refetch();
                          } catch (error) {
                            console.error('Failed to analyze detailed steps:', error);
                            alert('Analysis failed: ' + error.message);
                          } finally {
                            setAnalyzingFriction(false);
                          }
                        }}
                        disabled={analyzingFriction}
                        className="bg-teal-600 hover:bg-teal-500 text-white"
                      >
                        {analyzingFriction ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Running Analysis...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Run Detailed Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {analyzingFriction ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full bg-zinc-800/50" />
                      <Skeleton className="h-16 w-full bg-zinc-800/50" />
                      <Skeleton className="h-16 w-full bg-zinc-800/50" />
                    </div>
                  ) : video?.friction_analysis?.execution_steps?.length > 0 ? (
                    <div className="space-y-4">
                      {video.friction_analysis.execution_steps.map((step, idx) => (
                        <Collapsible key={idx} defaultOpen={false}>
                          <CollapsibleTrigger className="flex items-start gap-3 w-full p-4 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg border border-zinc-700/30 transition-colors text-left group">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600/20 border border-teal-500/30 flex items-center justify-center">
                              <span className="text-sm font-semibold text-teal-300">{idx + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-zinc-100">{step.step_name}</h4>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 ml-11 p-5 bg-gradient-to-br from-zinc-800/30 to-zinc-800/10 rounded-lg border border-zinc-700/30 space-y-4">
                            {step.step_summary && (
                              <div className="p-4 bg-zinc-900/40 rounded-lg border-l-4 border-teal-500/50">
                                <h5 className="text-xs font-semibold text-teal-300 mb-2 flex items-center gap-2">
                                  <Sparkles className="h-3 w-3" />
                                  What this step is
                                </h5>
                                <p className="text-sm text-zinc-200 leading-relaxed">{step.step_summary}</p>
                              </div>
                            )}

                            <div className="space-y-3">
                              {step.process && step.process.length > 0 && (
                                <div className="p-4 bg-gradient-to-br from-blue-950/20 to-blue-900/5 rounded-lg border border-blue-800/30">
                                  <h5 className="text-xs font-semibold text-blue-300 mb-3 flex items-center gap-2">
                                    <Zap className="h-3 w-3" />
                                    Process Steps
                                  </h5>
                                  <ul className="space-y-2">
                                    {step.process.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-200 leading-relaxed p-2 bg-zinc-800/30 rounded border-l-2 border-blue-500/50">
                                        <span className="text-blue-400 font-bold mt-0.5 text-xs">{i + 1}.</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {step.unspoken_requirements && step.unspoken_requirements.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                                    Requirements
                                  </h5>
                                  {step.unspoken_requirements.map((req, i) => {
                                    const getRequirementStyle = (factor) => {
                                      switch(factor) {
                                        case 'money':
                                          return { 
                                            icon: DollarSign, 
                                            bg: 'from-emerald-950/20 to-emerald-900/5', 
                                            border: 'border-emerald-700/40',
                                            iconColor: 'text-emerald-400',
                                            badge: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
                                          };
                                        case 'time':
                                          return { 
                                            icon: Clock, 
                                            bg: 'from-purple-950/20 to-purple-900/5', 
                                            border: 'border-purple-700/40',
                                            iconColor: 'text-purple-400',
                                            badge: 'bg-purple-900/50 text-purple-300 border-purple-700/50'
                                          };
                                        case 'skills':
                                          return { 
                                            icon: TrendingUp, 
                                            bg: 'from-teal-950/20 to-teal-900/5', 
                                            border: 'border-teal-700/40',
                                            iconColor: 'text-teal-400',
                                            badge: 'bg-teal-900/50 text-teal-300 border-teal-700/50'
                                          };
                                        case 'connections':
                                          return { 
                                            icon: Target, 
                                            bg: 'from-amber-950/20 to-amber-900/5', 
                                            border: 'border-amber-700/40',
                                            iconColor: 'text-amber-400',
                                            badge: 'bg-amber-900/50 text-amber-300 border-amber-700/50'
                                          };
                                        default:
                                          return { 
                                            icon: Shield, 
                                            bg: 'from-zinc-800/20 to-zinc-800/5', 
                                            border: 'border-zinc-700/40',
                                            iconColor: 'text-zinc-400',
                                            badge: 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50'
                                          };
                                      }
                                    };
                                    
                                    const style = getRequirementStyle(req.factor);
                                    const Icon = style.icon;
                                    
                                    return (
                                      <div key={i} className={`p-3 bg-gradient-to-br ${style.bg} rounded-lg border ${style.border}`}>
                                        <div className="flex items-start gap-3">
                                          <div className={`p-2 rounded-lg bg-zinc-900/50 border ${style.border} flex-shrink-0`}>
                                            <Icon className={`h-4 w-4 ${style.iconColor}`} />
                                          </div>
                                          <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${style.badge}`}>
                                                {req.factor || 'resource'}
                                              </span>
                                              {req.numeric_range && req.numeric_range !== 'N/A' && (
                                                <span className="text-xs font-bold text-zinc-100 bg-zinc-900/70 px-2 py-0.5 rounded border border-zinc-700/50">
                                                  {req.numeric_range}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-sm text-zinc-200 leading-relaxed">
                                              {req.detail}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-zinc-400 mb-2">No execution steps available yet.</p>
                      <p className="text-xs text-zinc-500">Click "Evaluate" to analyze this video.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="chapters" className="mt-0 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 scroll-mt-0">
                  {video?.raw_friction_analysis_output?.video_breakdown ? (
                    <VideoBreakdownList 
                      breakdown={video.raw_friction_analysis_output.video_breakdown}
                      currentTime={currentVideoTime}
                      onTimestampClick={(timestamp) => {
                        const parts = timestamp.split(':');
                        let seconds = 0;
                        if (parts.length === 2) {
                          seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                        } else if (parts.length === 3) {
                          seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                        }
                        jumpToTimestamp(seconds, timestamp);
                      }}
                      onChapterSelect={generateAdvisorResponse}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-zinc-400 text-sm">No chapter breakdown available</p>
                      <p className="text-zinc-500 text-xs mt-1">Evaluate the video to generate chapters</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="mt-0 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                  <DetailsTab
                    video={video}
                    analyzingFriction={analyzingFriction}
                    onJumpToTimestamp={jumpToTimestamp}
                  />
                </TabsContent>

                <TabsContent value="accumulation" className="mt-0 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                  <div className="space-y-3">
                    {/* Analysis skeleton while in progress */}
                    {isAnalysisInProgress && !video?.raw_friction_analysis_output && (
                      <div className="space-y-3 py-2">
                        <Skeleton className="h-24 w-full bg-zinc-800/50 rounded-lg" />
                        <Skeleton className="h-16 w-full bg-zinc-800/50 rounded-lg" />
                        <Skeleton className="h-16 w-3/4 bg-zinc-800/50 rounded-lg" />
                        <Skeleton className="h-16 w-5/6 bg-zinc-800/50 rounded-lg" />
                      </div>
                    )}
                    {/* Feasix Verdict */}
                    {video?.raw_friction_analysis_output && verdictText && (
                      <div className={`p-4 rounded-lg border ${
                        displayRating === 'watch' ? 'bg-gradient-to-br from-emerald-950/30 to-emerald-900/10 border-emerald-800/30' :
                        displayRating === 'skip'  ? 'bg-gradient-to-br from-red-950/30 to-red-900/10 border-red-800/30' :
                                                    'bg-gradient-to-br from-amber-950/30 to-amber-900/10 border-amber-800/30'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-sm font-semibold ${
                            displayRating === 'watch' ? 'text-emerald-300' :
                            displayRating === 'skip'  ? 'text-red-300' :
                                                        'text-amber-300'
                          }`}>Feasix Verdict</h3>
                          <RatingBadge rating={displayRating} />
                        </div>
                        <p className="text-sm text-zinc-200 leading-relaxed">{verdictText}</p>
                      </div>
                    )}
                    <AccumulationTab video={video} sessionId={sessionId} onJumpToTimestamp={jumpToTimestamp} />
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-0 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                  <div className="space-y-4">
                    {/* Timestamped Notes Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-zinc-300">Timestamped Notes</h4>
                        <Button
                          size="sm"
                          onClick={() => setIsNoteDialogOpen(true)}
                          className="bg-teal-600 hover:bg-teal-500 text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Note
                        </Button>
                      </div>
                      
                      {timestampedNotes.length > 0 ? (
                        <div className="space-y-2">
                          {timestampedNotes.map((note, idx) => (
                            <div key={idx} className="p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg group">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-teal-400" />
                                  <span className="text-xs font-mono text-teal-400">{note.timestamp}</span>
                                  <span className="text-xs text-zinc-500">•</span>
                                  <span className="text-sm font-medium text-zinc-200">{note.title}</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteTimestampedNote(idx)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700/50 rounded transition-all"
                                  title="Delete note"
                                >
                                  <Trash2 className="h-3 w-3 text-zinc-500 hover:text-red-400" />
                                </button>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 px-4 bg-zinc-800/20 border border-zinc-700/20 rounded-lg">
                          <Clock className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                          <p className="text-xs text-zinc-500">No timestamped notes yet</p>
                        </div>
                      )}
                    </div>

                    {/* General Notes Section */}
                    <div className="pt-4 border-t border-zinc-700/30">
                      <h4 className="text-sm font-medium text-zinc-300 mb-3">General Notes</h4>
                      <p className="text-xs text-zinc-400 mb-3">
                        Add your personal notes and insights from this video
                      </p>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Write your notes here..."
                        className="w-full min-h-[200px] p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-y text-sm"
                      />
                      <div className="flex justify-end mt-3">
                        <Button
                          onClick={saveNotes}
                          disabled={isSavingNotes}
                          className="bg-zinc-100 text-zinc-900 hover:bg-white"
                          size="sm"
                        >
                          {isSavingNotes ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Notes'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      )}

      {/* Video Embed for General Videos */}
      {video.video_type === 'general' && video.youtube_id && (
        <Card className="bg-zinc-900/50 border-zinc-800/50 overflow-hidden">
          <div className="w-full aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${video.youtube_id}`}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Card>
      )}

      {/* Signal Density for General Videos */}
       {video.video_type === 'general' && video.raw_friction_analysis_output && video.signal_density !== undefined && video.signal_density > 0 && (
         <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
           <h3 className="text-sm font-medium text-zinc-400 mb-2">Signal Density</h3>
           {(video.friction_rationale || video.rating_rationale || video.friction_analysis?.signal_density_rationale) && (
             <p className="text-sm text-zinc-400 leading-relaxed mb-4">
               {video.video_type === 'general' 
                 ? video.friction_rationale 
                 : (video.friction_analysis?.signal_density_rationale || video.rating_rationale)}
             </p>
           )}
           <SignalMeter value={video.signal_density} rating={video.rating} />
         </Card>
       )}

      {/* Venture Analysis for General Videos */}
      {video.video_type === 'general' && (video.multi_venture_analysis?.length > 0 || video.friction_analysis) && (
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">Ventures Discussed</h3>
              {video.friction_rationale && (
                <p className="text-sm text-zinc-400 mt-2 mb-1">{video.friction_rationale}</p>
              )}
              <p className="text-xs text-zinc-500 mt-1">In the order they appear in the video</p>
            </div>
            <span className="text-xs text-zinc-500">
              {video?.multi_venture_analysis?.length > 0 ? `${video.multi_venture_analysis.length} ventures identified` : 'Not analyzed'}
            </span>
          </div>
          {analyzingFriction ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full bg-zinc-800/50" />
              <Skeleton className="h-24 w-full bg-zinc-800/50" />
              <Skeleton className="h-24 w-full bg-zinc-800/50" />
            </div>
          ) : video.multi_venture_analysis?.length > 0 || video.friction_analysis?.execution_steps?.length > 0 ? (
            <div className="relative">
              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollPrev}
                  disabled={!canScrollPrev}
                  className="border-zinc-700 text-zinc-300 hover:text-zinc-100 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollNext}
                  disabled={!canScrollNext}
                  className="border-zinc-700 text-zinc-300 hover:text-zinc-100 disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Execution Steps for friction_analysis */}
              {video.friction_analysis?.execution_steps?.length > 0 && (
                <div className="space-y-4 mb-8">
                  <h4 className="text-lg font-semibold text-zinc-100">Execution Steps</h4>
                  {video.friction_analysis.execution_steps.map((step, idx) => (
                    <div key={idx} className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                      <h5 className="font-medium text-zinc-100 mb-2">{step.step_name}</h5>
                      {step.step_summary && <p className="text-sm text-zinc-400 mb-3">{step.step_summary}</p>}
                      {step.process?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-zinc-500 mb-2">Process:</p>
                          <ul className="space-y-1">
                            {step.process.map((item, i) => <li key={i} className="text-xs text-zinc-300">• {item}</li>)}
                          </ul>
                        </div>
                      )}
                      {step.unspoken_requirements?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-zinc-500 mb-2">Requirements:</p>
                          <ul className="space-y-1">
                            {step.unspoken_requirements.map((req, i) => <li key={i} className="text-xs text-zinc-300">• {req.detail}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Carousel for multi_venture_analysis */}
              {video.multi_venture_analysis?.length > 0 && (
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex gap-6">
                    {video.multi_venture_analysis.map((venture, idx) => (
                      <div key={idx} className="flex-[0_0_100%] min-w-0 space-y-4">
                        {/* Venture Header Card */}
                        <div className="border border-zinc-800/50 rounded-lg p-6 bg-zinc-800/20">
                          <h4 className="text-xl font-semibold text-zinc-100 mb-2">{venture.venture_name}</h4>
                          <p className="text-sm text-zinc-400">{venture.venture_summary}</p>
                        </div>

                        {/* Venture Requirements Grid */}
                        {venture.venture_requirements && (
                          <div className="border border-zinc-800/50 rounded-lg p-6 bg-zinc-800/20">
                            <h5 className="text-sm font-semibold text-zinc-300 mb-4">Venture Requirements</h5>
                            <div className="grid grid-cols-2 gap-4">
                              {venture.venture_requirements.time_needed && (
                                <div className="flex items-start gap-3 p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/30">
                                  <Clock className="h-5 w-5 text-teal-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs text-zinc-500 block mb-1">Time Commitment</span>
                                    <p className="text-sm font-semibold text-zinc-200">{venture.venture_requirements.time_needed}</p>
                                  </div>
                                </div>
                              )}
                              {venture.venture_requirements.capital_needed && (
                                <div className="flex items-start gap-3 p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/30">
                                  <DollarSign className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs text-zinc-500 block mb-1">Capital Investment</span>
                                    <p className="text-sm font-semibold text-zinc-200">{venture.venture_requirements.capital_needed}</p>
                                  </div>
                                </div>
                              )}
                              {venture.venture_requirements.skill_required && (
                                <div className="flex items-start gap-3 p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/30">
                                  <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs text-zinc-500 block mb-1">Skills Needed</span>
                                    <p className="text-sm font-semibold text-zinc-200">{venture.venture_requirements.skill_required}</p>
                                  </div>
                                </div>
                              )}
                              {venture.venture_requirements.risk_level && (
                                <div className="flex items-start gap-3 p-4 bg-zinc-800/40 rounded-lg border border-zinc-700/30">
                                  <Shield className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs text-zinc-500 block mb-1">Risk Profile</span>
                                    <p className="text-sm font-semibold text-zinc-200">{venture.venture_requirements.risk_level}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Alignment Analysis - Collapsible */}
                        {venture.alignment_analysis?.length > 0 && (
                          <div className="border border-zinc-800/50 rounded-lg p-6 bg-zinc-800/20">
                            <h5 className="text-sm font-semibold text-zinc-300 mb-4">How Your Personal Context Aligns</h5>
                            <div className="space-y-3">
                              {venture.alignment_analysis.map((item, i) => (
                                <Collapsible key={i} defaultOpen={false}>
                                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg border border-zinc-700/30 transition-colors">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <span className="text-sm font-medium text-zinc-200">{item.factor}</span>
                                      <span className={`text-xs font-medium px-2 py-1 rounded flex-shrink-0 ${
                                        item.alignment === 'good_fit' 
                                          ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-800/50' 
                                          : item.alignment === 'moderate_fit'
                                          ? 'bg-amber-900/50 text-amber-300 border border-amber-800/50'
                                          : 'bg-red-900/50 text-red-300 border border-red-800/50'
                                      }`}>
                                        {item.alignment === 'good_fit' ? 'Good Match' : item.alignment === 'moderate_fit' ? 'Partial Match' : 'Gap'}
                                      </span>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2 ml-0 p-4 bg-zinc-800/20 rounded-lg border border-zinc-700/20 space-y-2">
                                    <div className="text-xs">
                                      <span className="text-zinc-500">Venture needs:</span>{' '}
                                      <span className="text-zinc-300 font-semibold">{item.required}</span>
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-zinc-500">You have:</span>{' '}
                                      <span className="text-zinc-300 font-semibold">{item.user_has}</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-relaxed pt-2">{item.explanation}</p>
                                  </CollapsibleContent>
                                </Collapsible>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Key Details - Collapsible */}
                        {venture.key_details?.length > 0 && (
                          <div className="border border-zinc-800/50 rounded-lg p-6 bg-zinc-800/20">
                            <h5 className="text-xs font-semibold text-zinc-400 uppercase mb-3">Key Details</h5>
                            <div className="space-y-2">
                              {venture.key_details.map((detail, i) => (
                                <Collapsible key={i} defaultOpen={false}>
                                  <CollapsibleTrigger className="flex items-start gap-2 w-full p-3 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg border border-zinc-700/30 transition-colors text-left">
                                    <span className="text-xs font-semibold text-teal-400 flex-shrink-0 mt-0.5">{detail.stage}</span>
                                    <span className="text-xs text-zinc-300 flex-1 line-clamp-2">{detail.detail}</span>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2 p-3 bg-zinc-800/20 rounded-lg border border-zinc-700/20">
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                      {detail.explanation_context || `This is a critical detail mentioned during the ${detail.stage} phase.`}
                                    </p>
                                  </CollapsibleContent>
                                </Collapsible>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Nuances */}
                        {venture.nuances?.length > 0 && (
                          <div className="border border-zinc-800/50 rounded-lg p-6 bg-zinc-800/20">
                            <h5 className="text-xs font-semibold text-zinc-400 uppercase mb-3">Critical Nuances</h5>
                            <div className="space-y-2">
                              {venture.nuances.map((nuance, i) => (
                                <div key={i} className="flex items-start gap-2 p-3 bg-amber-950/20 border border-amber-800/30 rounded-lg">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                                  <p className="text-sm text-zinc-300">{nuance}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Create Niche Button */}
                        <Button
                          onClick={() => handleCreateNiche(venture.venture_name)}
                          disabled={creatingNiche === venture.venture_name}
                          className="w-full bg-teal-600 hover:bg-teal-500 text-white"
                        >
                          {creatingNiche === venture.venture_name ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Target className="h-4 w-4 mr-2" />
                              Interested? Create as Niche & Start Accumulating
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                  </div>
                  ) : (
            <div className="text-center py-4">
              <p className="text-zinc-500 italic mb-2">No ventures analyzed yet</p>
              <p className="text-xs text-zinc-600">Click "Evaluate" to analyze this video</p>
            </div>
          )}
        </Card>
      )}



          {/* Notes - For general videos (standalone) */}
          {video.video_type === 'general' && (
          <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">My Notes</h3>
          <div className="space-y-6">
            {/* Timestamped Notes Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-zinc-300">Timestamped Notes</h4>
                <Button
                  size="sm"
                  onClick={() => setIsNoteDialogOpen(true)}
                  className="bg-teal-600 hover:bg-teal-500 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Note
                </Button>
              </div>
              
              {timestampedNotes.length > 0 ? (
                <div className="space-y-2">
                  {timestampedNotes.map((note, idx) => (
                    <div key={idx} className="p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-teal-400" />
                          <span className="text-xs font-mono text-teal-400">{note.timestamp}</span>
                          <span className="text-xs text-zinc-500">•</span>
                          <span className="text-sm font-medium text-zinc-200">{note.title}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteTimestampedNote(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700/50 rounded transition-all"
                          title="Delete note"
                        >
                          <Trash2 className="h-3 w-3 text-zinc-500 hover:text-red-400" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 px-4 bg-zinc-800/20 border border-zinc-700/20 rounded-lg">
                  <Clock className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">No timestamped notes yet</p>
                </div>
              )}
            </div>

            {/* General Notes Section */}
            <div className="pt-4 border-t border-zinc-700/30">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">General Notes</h4>
              <p className="text-sm text-zinc-400 mb-3">
                Add your personal notes and insights from this video
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your notes here..."
                className="w-full min-h-[300px] p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-y"
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={saveNotes}
                  disabled={isSavingNotes}
                  className="bg-zinc-100 text-zinc-900 hover:bg-white"
                >
                  {isSavingNotes ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Notes'
                  )}
                </Button>
              </div>
            </div>
          </div>
          </Card>
          )}
      
      <AddTimestampedNoteDialog
        isOpen={isNoteDialogOpen}
        onClose={() => setIsNoteDialogOpen(false)}
        onSave={handleAddTimestampedNote}
        currentTime="00:00:00"
      />
    </div>
    </TooltipProvider>
          );
          }