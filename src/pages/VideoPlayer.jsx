import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, AlertCircle, Layers, PlayCircle, ExternalLink, Bookmark, BookmarkCheck, ArrowLeft, ChevronLeft, ChevronRight, Loader2, Save, Lock } from 'lucide-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import VideoQuickOverview from '@/components/video/VideoQuickOverview';
import { toast } from 'sonner';

export default function VideoPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get video and search results from state
  const { video, searchResults = [], currentIndex = 0, savedVideos = [], autoStartAnalysis = false } = location.state || {};

  const [videoType, setVideoType] = useState('');
  const [userLevel, setUserLevel] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [newNicheName, setNewNicheName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState('');
  const [savedVideoId, setSavedVideoId] = useState(null);
  const [analysisStep, setAnalysisStep] = useState('preparing');
  const autoSaveAttempted = React.useRef(false);

  useEffect(() => {
    loadUser();
  }, []);

  // Handle auto-analysis from extension
  useEffect(() => {
    if (autoStartAnalysis && video && !isAnalyzing) {
      // Set some sensible defaults for the quick audit
      setVideoType('specific');
      setUserLevel('beginner');
      
      // Give the state a moment to settle before triggering
      const timer = setTimeout(() => {
        // We can't call handleAnalyze directly as it checks state variables
        // which might not have updated yet due to React's async nature.
        // Instead, we manually trigger the logic or ensure states are set.
        // For simplicity, we just click the button or call it with the values.
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStartAnalysis, video]);

  // Special version of handleAnalyze for auto-runs that takes params
  const triggerAutoAnalyze = async () => {
    if (isAnalyzing || !video) return;
    
    setIsAnalyzing(true);
    setAnalysisStep('preparing');
    const videoUrl = `https://youtube.com/watch?v=${video.videoId}`;
    
    // Default specific audit
    const vType = 'specific';
    const uLevel = 'beginner';
    
    try {
      const vData = {
        youtube_id: video.videoId,
        title: video.title,
        channel: video.channelTitle,
        thumbnail_url: video.thumbnail,
        video_type: vType,
        user_level: uLevel,
        has_transcript: false,
        is_simulated: false,
        accumulated: false,
        notes: ''
      };
      
      const savedVideo = await base44.entities.Video.create(vData);
      
      // Route to General by default for quick extension audits to be safe
      // or try to detect niche.
      let generalSession = await base44.entities.AccumulationSession.filter({
        genre: 'General (Global)'
      });
      
      let targetSession;
      if (generalSession.length === 0) {
        targetSession = await base44.entities.AccumulationSession.create({
          session_type: 'general',
          genre: 'General (Global)',
          video_ids: []
        });
      } else {
        targetSession = generalSession[0];
      }

      const currentIds = targetSession.general_video_ids || [];
      if (!currentIds.includes(savedVideo.id)) {
        await base44.entities.AccumulationSession.update(targetSession.id, {
          general_video_ids: [...currentIds, savedVideo.id]
        });
      }

      sessionStorage.setItem('feasix-analyzing-video', JSON.stringify({
        videoId: savedVideo.id,
        sessionId: targetSession.id,
        videoType: 'general'
      }));

      base44.functions.invoke('analyzeVideoWithTranscript', {
        videoId: savedVideo.id
      }).then(() => {
        navigate(createPageUrl(`VideoDetail?id=${savedVideo.id}`));
      });

      toast.success('Quick Audit Started!');
      setTimeout(() => {
        navigate(createPageUrl(`VideoDetail?id=${savedVideo.id}`));
      }, 800);

    } catch (e) {
      setIsAnalyzing(false);
      console.error(e);
    }
  };

  useEffect(() => {
    if (autoStartAnalysis && video && !isAnalyzing) {
      triggerAutoAnalyze();
    }
  }, [autoStartAnalysis, video]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) { }
  };

  // Fetch existing sessions directly
  const { data: existingSessions = [] } = useQuery({
    queryKey: ['specific-sessions', user?.email],
    queryFn: async () => {
      const sessions = await base44.entities.AccumulationSession.filter({
        created_by: user?.email,
        session_type: 'specific'
      });
      return sessions;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (video && savedVideos) {
      const saved = savedVideos.find((sv) => sv.youtube_id === video.videoId);
      if (saved) {
        setSavedVideoId(saved.id);
        setNotes(saved.notes || '');
        setIsSaved(true);
      } else {
        setIsSaved(false);
        setSavedVideoId(null);
        setNotes('');
      }
    }
  }, [video, savedVideos]);

  if (!video) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Link to={createPageUrl('Analyze?tab=search')}>
          <Button variant="ghost" className="mb-4 text-zinc-400">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </Link>
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 text-center">
          <p className="text-zinc-400">Video not found</p>
        </Card>
      </div>);

  }

  const canAnalyze = videoType && userLevel && (
    videoType === 'general' || videoType === 'specific' && (selectedNiche !== 'new' || newNicheName.trim()));

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevVideo = searchResults[currentIndex - 1];
      navigate(createPageUrl('VideoPlayer'), {
        state: {
          video: prevVideo,
          searchResults,
          currentIndex: currentIndex - 1,
          savedVideos
        },
        replace: true
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < searchResults.length - 1) {
      const nextVideo = searchResults[currentIndex + 1];
      navigate(createPageUrl('VideoPlayer'), {
        state: {
          video: nextVideo,
          searchResults,
          currentIndex: currentIndex + 1,
          savedVideos
        },
        replace: true
      });
    }
  };

  const getVideoRecommendation = () => {
    const text = `${video.title} ${video.description || ''}`.toLowerCase();

    // Keywords that indicate specific ventures/niches
    const nicheKeywords = [
      'amazon fba', 'dropshipping', 'shopify', 'etsy', 'ebay',
      'saas', 'software as a service', 'app development',
      'affiliate marketing', 'print on demand', 'pod',
      'freelancing', 'upwork', 'fiverr',
      'youtube automation', 'content creation',
      'real estate investing', 'airbnb', 'rental property',
      'forex', 'day trading', 'stocks',
      'cryptocurrency', 'crypto', 'bitcoin',
      'kindle publishing', 'self-publishing',
      'coaching business', 'consulting',
      'e-commerce store', 'online store',
      'photography business', 'photography', 'photo editing',
      'videography', 'video production',
      'web design', 'web development', 'graphic design',
      'writing', 'copywriting', 'content writing',
      'seo', 'search engine optimization',
      'email marketing', 'marketing automation',
      'social media management', 'instagram', 'tiktok',
      'podcast', 'podcasting',
      'course creation', 'online course',
      'membership', 'subscription',
      'dropservice', 'white label',
      'niche site', 'niche website',
      'data entry', 'virtual assistant',
      'bookkeeping', 'accounting',
      'transcription', 'translation',
      'design', 'ux', 'ui'];


    const foundNiche = nicheKeywords.find((keyword) => text.includes(keyword));

    if (foundNiche) {
      return {
        type: 'niche',
        label: 'Niche (Specific Venture)',
        reason: `This appears to focus on a specific business model`,
        color: 'teal'
      };
    }

    return {
      type: 'advice',
      label: 'Advice (General)',
      reason: 'This covers broad principles or multiple ventures',
      color: 'purple'
    };
  };

  const recommendation = getVideoRecommendation();

  const handleSave = async () => {
    try {
      // Check for existing saves to prevent duplicates
      const existingSaves = await base44.entities.SavedVideo.filter({
        youtube_id: video.videoId
      });

      if (existingSaves.length > 0) {
        // Use existing save
        setSavedVideoId(existingSaves[0].id);
        setNotes(existingSaves[0].notes || '');
        setIsSaved(true);
      } else {
        // Create new save
        const savedVideo = await base44.entities.SavedVideo.create({
          youtube_id: video.videoId,
          title: video.title,
          channel_title: video.channelTitle,
          thumbnail: video.thumbnail,
          description: video.description,
          published_at: video.publishedAt,
          notes: ''
        });
        setSavedVideoId(savedVideo.id);
        setIsSaved(true);
      }
      queryClient.invalidateQueries({ queryKey: ['saved-videos'] });
    } catch (error) {
      console.error('Failed to save video:', error);
    }
  };

  const handleSaveNotes = async () => {
    if (!savedVideoId) return;
    try {
      await base44.entities.SavedVideo.update(savedVideoId, { notes });
      queryClient.invalidateQueries({ queryKey: ['saved-videos'] });
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    setAnalysisStep('preparing');
    const videoUrl = `https://youtube.com/watch?v=${video.videoId}`;

    try {
      // Extract video ID from URL
      const extractVideoId = (url) => {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
      };

      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        alert('Invalid YouTube URL');
        setIsAnalyzing(false);
        return;
      }

      // Determine niche for specific videos
      let detectedNiche = null;
      if (videoType === 'specific') {
        if (selectedNiche === 'new') {
          detectedNiche = newNicheName.trim() || 'Other';
        } else if (selectedNiche) {
          detectedNiche = selectedNiche;
        }
      }

      // Create video record
      const videoData = {
        youtube_id: videoId,
        title: video.title,
        channel: video.channelTitle,
        thumbnail_url: video.thumbnail,
        video_type: videoType,
        user_level: userLevel,
        has_transcript: false,
        is_simulated: false,
        accumulated: false,
        notes: notes || ''
      };

      setAnalysisStep('fetching');
      const savedVideo = await base44.entities.Video.create(videoData);

      // Route to session (same logic as Analyze page)
      const routeToSession = async () => {
        if (videoType === 'general') {
          let generalSession = await base44.entities.AccumulationSession.filter({
            genre: 'General (Global)'
          });

          if (generalSession.length === 0) {
            return await base44.entities.AccumulationSession.create({
              session_type: 'general',
              genre: 'General (Global)',
              video_ids: []
            });
          }
          return generalSession[0];
        } else {
          const sessionGenre = detectedNiche || 'Unknown Niche';
          let specificSession = await base44.entities.AccumulationSession.filter({
            session_type: 'specific',
            genre: sessionGenre
          });

          if (specificSession.length === 0) {
            return await base44.entities.AccumulationSession.create({
              session_type: 'specific',
              genre: sessionGenre,
              video_ids: []
            });
          }
          return specificSession[0];
        }
      };

      const targetSession = await routeToSession();

      // Add video to session immediately (before analysis completes)
      if (targetSession) {
        if (videoType === 'general') {
          const currentIds = targetSession.general_video_ids || [];
          if (!currentIds.includes(savedVideo.id)) {
            await base44.entities.AccumulationSession.update(targetSession.id, {
              general_video_ids: [...currentIds, savedVideo.id]
            });
          }
        } else {
          // For specific videos, add to accumulated_videos immediately
          const currentVideos = targetSession.accumulated_videos || [];
          const alreadyAdded = currentVideos.some(av => av.video_id === savedVideo.id);
          if (!alreadyAdded) {
            const orderNumber = currentVideos.length + 1;
            await base44.entities.AccumulationSession.update(targetSession.id, {
              accumulated_videos: [
                ...currentVideos,
                {
                  video_id: savedVideo.id,
                  order: orderNumber,
                  session_rating: 'skim',
                  session_rating_rationale: 'Analysis in progress...'
                }
              ]
            });
          }
        }
      }

      // Store analysis info for global listener
      sessionStorage.setItem('feasix-analyzing-video', JSON.stringify({
        videoId: savedVideo.id,
        sessionId: targetSession?.id,
        videoType
      }));
      sessionStorage.setItem('feasix-analysis-title', video.title);
      sessionStorage.setItem('feasix-analysis-step', 'analyzing');

      // Get accumulation context from prior videos in the session
      let accumulationData = {};
      if (targetSession?.video_accumulation_snapshots?.length > 0) {
        const priorSnapshots = targetSession.video_accumulation_snapshots.filter(s => s.video_id !== savedVideo.id);
        if (priorSnapshots.length > 0) {
          const mostRecent = priorSnapshots[priorSnapshots.length - 1];
          accumulationData = mostRecent.accumulation || {};
        }
      }

      // Start analysis in background WITHOUT waiting
      base44.functions.invoke('analyzeVideoWithTranscript', {
        videoId: savedVideo.id,
        accumulationData
      }).then(async (analysisResponse) => {
        if (analysisResponse.data.success && videoType === 'specific' && targetSession) {
          sessionStorage.setItem('feasix-analysis-step', 'scoring');
          await base44.functions.invoke('addVideoToSessionAndRate', {
            videoId: savedVideo.id,
            sessionId: targetSession.id
          });
        }

        sessionStorage.setItem('feasix-analysis-step', 'complete');
        // Analysis complete - navigate to video detail page
        navigate(createPageUrl('VideoDetail') + `?id=${savedVideo.id}`);
      }).catch((error) => {
        console.error('Background analysis failed:', error);
        sessionStorage.removeItem('feasix-analyzing-video');
        sessionStorage.removeItem('feasix-analysis-step');
        sessionStorage.removeItem('feasix-analysis-title');
        setIsAnalyzing(false);
        alert('Analysis failed: ' + error.message);
      });

      // Show immediate feedback
      toast.success('Analysis started!', {
        description: 'Redirecting to video page...',
        duration: 2000
      });

      // Redirect early — analysis continues in background
      setTimeout(() => {
        navigate(createPageUrl(`VideoDetail?id=${savedVideo.id}`));
      }, 800);

    } catch (error) {
      console.error('Analysis setup failed:', error);
      alert(`Failed to start analysis: ${error.message || 'Unknown error'}`);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <Link to={createPageUrl('Analyze?tab=search')}>
          <Button variant="ghost" className="text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="border-zinc-700 text-zinc-300 hover:text-zinc-100 disabled:opacity-30 h-12 px-6">

            <ChevronLeft className="h-6 w-6 mr-1" />
            <span className="text-sm font-medium">Previous</span>
          </Button>
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-zinc-300">
              {currentIndex + 1} / {searchResults.length}
            </span>
            <span className="text-xs text-zinc-500">Scroll through videos</span>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={handleNext}
            disabled={currentIndex === searchResults.length - 1}
            className="border-zinc-700 text-zinc-300 hover:text-zinc-100 disabled:opacity-30 h-12 px-6">

            <span className="text-sm font-medium">Next</span>
            <ChevronRight className="h-6 w-6 ml-1" />
          </Button>
        </div>
      </div>

      {/* Video Header */}
      <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-zinc-100 mb-2">{video.title}</h1>
            <p className="text-zinc-400">{video.channelTitle}</p>
          </div>
        </div>

        <a
          href={`https://youtube.com/watch?v=${video.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300">

          <ExternalLink className="h-4 w-4" />
          Open in YouTube
        </a>
      </Card>

      {/* Call to Action Banner */}
      <Card className="bg-gradient-to-r from-teal-950/40 to-teal-900/20 border-teal-800/30 p-4">
        <div className="flex items-center justify-center gap-3">
          <Sparkles className="h-5 w-5 text-teal-400 flex-shrink-0" />
          <p className="text-sm text-teal-200 font-medium text-center">
            Interested in what you see? Hit <span className="text-teal-100">Analyze</span> for a deeper dive into execution steps and requirements
          </p>
          <Sparkles className="h-5 w-5 text-teal-400 flex-shrink-0" />
        </div>
      </Card>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Left Column - Video Player */}
        <div className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800/50 overflow-hidden">
            <div className="w-full" style={{ aspectRatio: '16/9', minHeight: '380px' }}>
              <iframe
                src={`https://www.youtube.com/embed/${video.videoId}`}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen />
            </div>
          </Card>

          {/* Video Description */}
          {video.description &&
            <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">Video Description
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line mb-6">
                {video.description}
              </p>

              {/* Save Button at Bottom of Description */}
              <div className="pt-4 border-t border-zinc-800/50">
                <Button size="lg"
                  variant={isSaved ? "outline" : "default"}
                  onClick={handleSave}
                  disabled={isSaved}
                  className={`w-full h-14 ${isSaved ?
                      'border-amber-800/50 bg-amber-950/30 text-amber-400 hover:text-amber-300' :
                      'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'}`
                  }>

                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      {isSaved ?
                        <>
                          <BookmarkCheck className="h-5 w-5" />
                          <span className="font-medium">Saved for Later</span>
                        </> :

                        <>
                          <Bookmark className="h-5 w-5" />
                          <span className="font-medium">Save for Later</span>
                        </>
                      }
                    </div>
                    {!isSaved &&
                      <span className="text-xs text-zinc-400">Bookmark this video to analyze later</span>
                    }
                  </div>
                </Button>
              </div>
            </Card>
          }
        </div>

        {/* Right Column - Analysis & Tabs */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="bg-zinc-900/50 border-zinc-800/50 p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 h-12 bg-zinc-900 p-1">
                <TabsTrigger value="overview" className="text-xs data-[state=active]:text-zinc-100">Overview</TabsTrigger>
                <TabsTrigger value="analyze" className="text-xs data-[state=active]:text-zinc-100">Analyze</TabsTrigger>
                <TabsTrigger value="notes" className="text-xs data-[state=active]:text-zinc-100">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                <VideoQuickOverview description={video.description} title={video.title} />
              </TabsContent>

              <TabsContent value="analyze" className="mt-0 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-950/20 border border-blue-800/30 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-300 mb-1">Ready to Analyze?</h4>
                      <p className="text-xs text-blue-400/90">
                        Configure analysis settings below and click "Analyze This Video"
                      </p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${recommendation.type === 'niche' ?
                      'bg-teal-950/20 border-teal-800/30' :
                      'bg-purple-950/20 border-purple-800/30'}`
                  }>
                    <div className="flex items-start gap-3">
                      <Sparkles className={`h-5 w-5 mt-0.5 flex-shrink-0 ${recommendation.type === 'niche' ? 'text-teal-400' : 'text-purple-400'}`
                      } />
                      <div>
                        <h4 className={`text-sm font-medium mb-1 ${recommendation.type === 'niche' ? 'text-teal-300' : 'text-purple-300'}`
                        }>
                          Recommended: {recommendation.label}
                        </h4>
                        <p className={`text-xs ${recommendation.type === 'niche' ? 'text-teal-400/90' : 'text-purple-400/90'}`
                        }>
                          {recommendation.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Video Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled
                        className="p-3 rounded-lg border-2 opacity-50 cursor-not-allowed border-zinc-700/50 bg-zinc-900/30 relative">
                        <div className="absolute top-2 right-2">
                          <Lock className="h-3 w-3 text-zinc-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Layers className="h-4 w-4 text-zinc-500" />
                          <span className="text-sm font-medium text-zinc-500">Advice</span>
                        </div>
                        <p className="text-xs text-zinc-600 text-left">Multiple ventures</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVideoType('specific')}
                        className={`p-3 rounded-lg border-2 transition-all ${videoType === 'specific' ?
                            'border-zinc-100 bg-zinc-800/50' :
                            'border-zinc-700/50 bg-zinc-900/30 hover:border-zinc-600'}`
                        }>

                        <div className="flex items-center gap-2 mb-1">
                          <PlayCircle className="h-4 w-4 text-zinc-400" />
                          <span className="text-sm font-medium text-zinc-200">Niche</span>
                        </div>
                        <p className="text-xs text-zinc-500 text-left">One venture</p>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Your Experience Level</Label>
                    <Select value={userLevel} onValueChange={setUserLevel}>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="novice">Novice</SelectItem>
                        <SelectItem value="seasoned">Seasoned</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {videoType === 'specific' &&
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Niche/Venture</Label>
                      <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                        <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-zinc-100">
                          <SelectValue placeholder="Select existing or create new" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingSessions.map((session) =>
                            <SelectItem key={session.id} value={session.genre}>
                              {session.genre}
                            </SelectItem>
                          )}
                          <SelectItem value="new">+ Create New Niche</SelectItem>
                        </SelectContent>
                      </Select>

                      {selectedNiche === 'new' &&
                        <Input
                          placeholder="Enter niche name (e.g., Amazon FBA, SaaS)"
                          value={newNicheName}
                          onChange={(e) => setNewNicheName(e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500" />

                      }
                    </div>
                  }

                  <Button
                    onClick={handleAnalyze}
                    disabled={!canAnalyze || isAnalyzing || videoType === 'general'}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white disabled:bg-zinc-700 disabled:text-zinc-400">

                    {isAnalyzing ?
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </> :

                      <>
                        {videoType === 'general' ? <Lock className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Analyze This Video
                      </>
                    }
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-0 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                {isSaved ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-amber-950/20 border border-amber-800/30 rounded-lg">
                      <BookmarkCheck className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-300 mb-1">Video Saved</h4>
                        <p className="text-xs text-amber-400/90">
                          Add notes below. They'll transfer to the video when you analyze it.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Your Notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any thoughts, observations, or questions about this video..."
                        className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 min-h-[200px]"
                      />
                    </div>

                    <Button
                      onClick={handleSaveNotes}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Notes
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
                      <Bookmark className="h-8 w-8 text-zinc-500" />
                    </div>
                    <h3 className="text-base font-medium text-zinc-300 mb-2">Save video to add notes</h3>
                    <p className="text-xs text-zinc-500 mb-4">
                      Notes are only available for saved videos
                    </p>
                    <Button
                      onClick={handleSave}
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 hover:text-zinc-100"
                    >
                      <Bookmark className="h-4 w-4 mr-2" />
                      Save Video
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>);

}