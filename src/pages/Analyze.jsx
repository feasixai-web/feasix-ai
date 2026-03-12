import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VideoCard from '@/components/dashboard/VideoCard';
import UsageIndicator from '@/components/dashboard/UsageIndicator';
import RatingBadge from '@/components/ui/RatingBadge';
import FrictionBadge from '@/components/ui/FrictionBadge';
import VideoSearchResult from '@/components/search/VideoSearchResult';

import SavedVideoCard from '@/components/search/SavedVideoCard';
import { Search, Loader2, Youtube, AlertTriangle, Lock, Sparkles, PlayCircle, Layers, AlertCircle, Bookmark, TrendingUp, X, Chrome, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Analyze() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoType, setVideoType] = useState(''); // User-selected video type
  const [userLevel, setUserLevel] = useState(''); // User's experience level
  const [selectedNiche, setSelectedNiche] = useState('');
  const [newNicheName, setNewNicheName] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const queryClient = useQueryClient();

  // Get default tab from URL params
  const urlParams = new URLSearchParams(location.search);
  const defaultTab = urlParams.get('tab') || 'search';

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [analyzedVideos, setAnalyzedVideos] = useState(new Set());

  // Handle autoRun from extension
  useEffect(() => {
    const url = urlParams.get('url');
    const autoRun = urlParams.get('autoRun') === 'true';
    if (url && (autoRun || defaultTab === 'url')) {
      setYoutubeUrl(url);
      if (autoRun) {
        // Short delay to ensure component is ready
        const timer = setTimeout(() => {
          // Find the button and click it or call the function directly
          // We call handleOpenVideo but we need to ensure it uses the latest youtubeUrl
          // Instead, we call a dedicated auto-loader
          processAutoRunUrl(url);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [location.search]);

  const processAutoRunUrl = async (url) => {
    const videoId = extractVideoId(url);
    if (!videoId) return;

    setIsAnalyzing(true);
    try {
      const response = await base44.functions.invoke('searchYouTubeVideos', {
        query: videoId,
        isDirectVideo: true
      });
      const videoData = response.data.results?.[0];
      if (videoData) {
        addRecentUrl(url, videoData.title, videoData.thumbnail, videoData.videoId, videoData);
        navigate(createPageUrl('VideoPlayer'), {
          state: { video: videoData, searchResults: [], currentIndex: 0, savedVideos, autoStartAnalysis: true }
        });
      }
    } catch (e) {
      console.error('AutoRun failed:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Recent searches - persist in localStorage
  const [recentSearches, setRecentSearches] = useState(() => {
    const stored = localStorage.getItem('feasix-recent-searches');
    return stored ? JSON.parse(stored) : [];
  });

  // Recently viewed URLs - persist in localStorage
  const [recentUrls, setRecentUrls] = useState(() => {
    const stored = localStorage.getItem('feasix-recent-urls');
    return stored ? JSON.parse(stored) : [];
  });

  const addRecentUrl = (url, title, thumbnail, videoId, videoData = null) => {
    const entry = { url, title, thumbnail, videoId, videoData };
    const updated = [entry, ...recentUrls.filter((r) => r.videoId !== videoId)].slice(0, 5);
    setRecentUrls(updated);
    localStorage.setItem('feasix-recent-urls', JSON.stringify(updated));
  };

  const removeRecentUrl = (videoId) => {
    const updated = recentUrls.filter((r) => r.videoId !== videoId);
    setRecentUrls(updated);
    localStorage.setItem('feasix-recent-urls', JSON.stringify(updated));
  };

  // Session routing is now active with immutability rules enforced
  const ANALYSIS_PAUSED = false;

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) { }
  };

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ created_by: user?.email });
      if (subs.length === 0) {
        const newSub = await base44.entities.Subscription.create({ tier: 'free', evaluations_used: 0 });
        return newSub;
      }
      return subs[0];
    },
    enabled: !!user
  });

  const isPaid = subscription?.tier === 'paid';
  const canEvaluate = isPaid || (subscription?.evaluations_used || 0) < (subscription?.evaluations_limit || 15);

  // Fetch all analyzed videos to check if search results are already analyzed
  const { data: allVideos = [] } = useQuery({
    queryKey: ['all-videos', user?.email],
    queryFn: async () => {
      const videos = await base44.entities.Video.filter({ created_by: user?.email });
      return videos;
    },
    enabled: !!user
  });

  // Fetch saved videos
  const { data: savedVideos = [], refetch: refetchSavedVideos } = useQuery({
    queryKey: ['saved-videos', user?.email],
    queryFn: async () => {
      const videos = await base44.entities.SavedVideo.filter({ created_by: user?.email });
      return videos;
    },
    enabled: !!user
  });

  // Fetch existing specific sessions for niche dropdown
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

  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };



  // CANONICAL SESSION ROUTING
  // Route videos to immutable canonical sessions
  const routeVideoToSession = async (videoType, niche = null) => {
    try {
      if (videoType === 'general') {
        // All general videos route to the single "General (Global)" session
        let generalSession = await base44.entities.AccumulationSession.filter({
          created_by: user?.email,
          genre: 'General (Global)'
        });

        if (generalSession.length === 0) {
          // Create canonical General (Global) if it doesn't exist
          return await base44.entities.AccumulationSession.create({
            session_type: 'general',
            genre: 'General (Global)',
            video_ids: []
          });
        }

        return generalSession[0];
      } else {
        // Specific videos: one session per niche
        // Extract niche from LLM analysis or default to provided niche
        const sessionGenre = niche || 'Unknown Niche';

        let specificSession = await base44.entities.AccumulationSession.filter({
          created_by: user?.email,
          session_type: 'specific',
          genre: sessionGenre
        });

        if (specificSession.length === 0) {
          // Create exactly one new session for this niche
          return await base44.entities.AccumulationSession.create({
            session_type: 'specific',
            genre: sessionGenre,
            video_ids: []
          });
        }

        return specificSession[0];
      }
    } catch (error) {
      console.error('Error routing video to session:', error);
      return null;
    }
  };

  // Extract niche from specific video analysis
  const extractNiche = async (videoId) => {
    try {
      const niches = ['Amazon FBA', 'SaaS', 'Freelancing', 'Content / Media', 'Dropshipping', 'Agencies', 'YouTube Automation'];

      const nichemPrompt = `
        Based on this YouTube video ID: ${videoId}
        
        Identify which business niche it focuses on.
        Choose from: ${niches.join(', ')}
        
        Return ONLY the niche name, nothing else.
      `;

      const nichemResult = await base44.integrations.Core.InvokeLLM({
        prompt: nichemPrompt
      });

      const detectedNiche = nichemResult.trim();
      return niches.includes(detectedNiche) ? detectedNiche : 'Other';
    } catch (error) {
      console.error('Error extracting niche:', error);
      return 'Other';
    }
  };

  const analyzeVideo = async () => {
    if (ANALYSIS_PAUSED) return;

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId || !videoType) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisStatus('Preparing video analysis...');

    try {
      setAnalysisStatus('Fetching video metadata from YouTube...');
      // Use user-selected video type (no automatic classification)
      // For specific videos, use user's selection or new niche name
      let detectedNiche = null;

      if (videoType === 'specific') {
        if (selectedNiche === 'new') {
          detectedNiche = newNicheName.trim() || 'Other';
        } else if (selectedNiche) {
          detectedNiche = selectedNiche;
        } else {
          detectedNiche = await extractNiche(videoId);
        }
      }

      // Create video record first (title will be auto-fetched by backend)
      const videoData = {
        youtube_id: videoId,
        title: 'Fetching...',
        channel: "YouTube Channel",
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        video_type: videoType,
        user_level: userLevel,
        has_transcript: false,
        is_simulated: false,
        accumulated: false
      };

      const savedVideo = await base44.entities.Video.create(videoData);

      setAnalysisStatus('Routing to session...');

      // ROUTE VIDEO TO CANONICAL SESSION FIRST
      let targetSession = null;

      if (videoType === 'general') {
        targetSession = await routeVideoToSession('general');
      } else {
        const niche = detectedNiche || (await extractNiche(videoId));
        targetSession = await routeVideoToSession('specific', niche);
      }

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
          // For specific videos, add to accumulated_videos array directly
          const currentVideos = targetSession.accumulated_videos || [];
          const orderNumber = currentVideos.length + 1;

          await base44.entities.AccumulationSession.update(targetSession.id, {
            accumulated_videos: [
              ...currentVideos,
              {
                video_id: savedVideo.id,
                order: orderNumber,
                session_rating: 'skim', // Temporary rating
                session_rating_rationale: 'Analysis in progress...'
              }]

          });
        }
      }

      // Update subscription usage
      if (subscription && !isPaid) {
        await base44.entities.Subscription.update(subscription.id, {
          evaluations_used: (subscription.evaluations_used || 0) + 1
        });
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
      }

      // Store analysis info for global listener
      sessionStorage.setItem('feasix-analyzing-video', JSON.stringify({
        videoId: savedVideo.id,
        sessionId: targetSession?.id,
        videoType
      }));
      sessionStorage.setItem('feasix-analysis-title', `Analyzing: ${videoData.title}`);
      sessionStorage.setItem('feasix-analysis-step', 'analyzing');

      // Start analysis in background (don't wait for it)
      base44.functions.invoke('analyzeVideoWithTranscript', {
        videoId: savedVideo.id
      }).then(async (analysisResponse) => {
        if (analysisResponse.data.success && videoType === 'specific' && targetSession) {
          // After analysis completes, update the session rating
          await base44.functions.invoke('addVideoToSessionAndRate', {
            videoId: savedVideo.id,
            sessionId: targetSession.id
          });
        }

        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['recent-videos'] });
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
        queryClient.invalidateQueries({ queryKey: ['session', targetSession?.id] });
      }).catch((error) => {
        console.error('Background analysis failed:', error);
      });

      // Redirect to VideoDetail after shorter delay since backend is faster now
      setTimeout(() => {
        navigate(createPageUrl(`VideoDetail?id=${savedVideo.id}`));
      }, 1500);

    } catch (error) {
      console.error('Analysis failed:', error);
      alert(`Analysis failed: ${error.response?.data?.error || error.message || 'Unknown error occurred. Please try again.'}`);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus('');
    }
  };

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchQuery(query);

    try {
      const response = await base44.functions.invoke('searchYouTubeVideos', { query });
      setSearchResults(response.data.results || []);

      // Update analyzed videos set
      const analyzedIds = new Set(allVideos.map((v) => v.youtube_id));
      setAnalyzedVideos(analyzedIds);

      // Add to recent searches
      const updatedRecent = [query, ...recentSearches.filter((q) => q !== query)].slice(0, 8);
      setRecentSearches(updatedRecent);
      localStorage.setItem('feasix-recent-searches', JSON.stringify(updatedRecent));
    } catch (error) {
      console.error('Search failed:', error);
      alert('Failed to search videos. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearRecentSearch = (query) => {
    const updated = recentSearches.filter((q) => q !== query);
    setRecentSearches(updated);
    localStorage.setItem('feasix-recent-searches', JSON.stringify(updated));
  };

  const handleSaveVideo = async (video) => {
    try {
      await base44.entities.SavedVideo.create({
        youtube_id: video.videoId,
        title: video.title,
        channel_title: video.channelTitle,
        thumbnail: video.thumbnail,
        description: video.description,
        published_at: video.publishedAt
      });
      refetchSavedVideos();
    } catch (error) {
      console.error('Failed to save video:', error);
      alert('Failed to save video. Please try again.');
    }
  };

  const handleRemoveSavedVideo = async (videoId) => {
    try {
      await base44.entities.SavedVideo.delete(videoId);
      refetchSavedVideos();
    } catch (error) {
      console.error('Failed to remove video:', error);
      alert('Failed to remove video. Please try again.');
    }
  };

  const handleAnalyzeSavedVideo = (video) => {
    const videoUrl = `https://youtube.com/watch?v=${video.youtube_id}`;
    setYoutubeUrl(videoUrl);
    // Switch to URL tab
    document.querySelector('[value="url"]')?.click();
  };

  const handleVideoClick = (video) => {
    // Save to recently viewed so it appears in the recently viewed section
    addRecentUrl(
      `https://youtube.com/watch?v=${video.videoId}`,
      video.title,
      video.thumbnail,
      video.videoId,
      video
    );
    navigate(createPageUrl('VideoPlayer'), {
      state: {
        video,
        searchResults,
        currentIndex: searchResults.findIndex((v) => v.videoId === video.videoId),
        savedVideos
      }
    });
  };

  const handleOpenVideo = async () => {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Fetch video metadata from YouTube
      const response = await base44.functions.invoke('searchYouTubeVideos', {
        query: videoId,
        isDirectVideo: true
      });

      const videoData = response.data.results?.[0];

      if (!videoData) {
        alert('Failed to fetch video details');
        return;
      }

      // Save to recently viewed URLs
      addRecentUrl(youtubeUrl, videoData.title, videoData.thumbnail, videoData.videoId, videoData);

      // Navigate to VideoPlayer
      navigate(createPageUrl('VideoPlayer'), {
        state: {
          video: videoData,
          searchResults: [],
          currentIndex: 0,
          savedVideos
        }
      });
    } catch (error) {
      console.error('Failed to load video:', error);
      alert('Failed to load video. Please check the URL and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };



  // Recommended searches
  const recommendedSearches = [
    "How to start a business with no money",
    "Passive income ideas 2026",
    "Amazon FBA beginner guide",
    "Building a SaaS product",
    "Digital marketing strategies",
    "Freelancing success tips"];


  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-zinc-100">Search & Analyze</h1>
        <p className="mt-1 text-zinc-500">
          Evaluate business and income generation content for practical signal quality
        </p>
      </div>

      {/* Discovery Card - Always Visible */}
      <Card className="bg-gradient-to-br from-blue-950/40 via-zinc-900/50 to-zinc-900/50 border-blue-800/30 p-8">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-blue-950/50 border-2 border-blue-800/50 flex items-center justify-center">
                <Youtube className="h-10 w-10 text-blue-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-teal-950/50 border-2 border-teal-800/50 flex items-center justify-center">
                <Search className="h-4 w-4 text-teal-400" />
              </div>
            </div>
          </div>

          <div className="flex-1 text-center lg:text-left">
            <h3 className="text-xl font-semibold text-blue-100 mb-2">
              Discover Business Videos
            </h3>
            <p className="text-sm text-blue-200/90 leading-relaxed">
              Search YouTube for business ideas, income strategies, and venture execution guides. Watch, save for later, or analyze immediately.
            </p>
          </div>

          <div className="flex gap-3 lg:flex-col">
            <div className="flex items-center gap-2 text-blue-300/80">
              <Search className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">Search</span>
            </div>
            <div className="flex items-center gap-2 text-blue-300/80">
              <Bookmark className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">Save</span>
            </div>
            <div className="flex items-center gap-2 text-blue-300/80">
              <Sparkles className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">Analyze</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabbed Interface */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50 border border-zinc-700/50">
          <TabsTrigger value="search" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100">
            Search Videos
          </TabsTrigger>
          <TabsTrigger value="url" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100">
            Analyze by URL
          </TabsTrigger>
        </TabsList>

        {/* URL Analysis Tab */}
        <TabsContent value="url" className="mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800/50 p-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-zinc-300 text-lg font-semibold">YouTube URL</Label>
                <div className="relative">
                  <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-zinc-500" />
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleOpenVideo()}
                    className="pl-12 h-14 text-base bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500" />
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-950/20 border border-blue-800/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-300 mb-1">Preview First, Analyze Later</h4>
                  <p className="text-xs text-blue-400/90">
                    Enter a YouTube URL to open the video player. From there, you can watch, save, or run a deeper analysis.
                  </p>
                </div>
              </div>

              {/* Loading Indicator */}
              {isAnalyzing &&
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-blue-950/20 border border-blue-800/30 rounded-lg">

                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-300">Loading video...</p>
                  </div>
                </motion.div>
              }

              <Button
                onClick={handleOpenVideo}
                disabled={!youtubeUrl || isAnalyzing}
                size="lg"
                className="w-full h-14 text-base bg-zinc-100 text-zinc-900 hover:bg-white disabled:bg-zinc-700 disabled:text-zinc-400">
                {isAnalyzing ?
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Loading...
                  </> :

                  <>
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Open Video
                  </>
                }
              </Button>
            </div>
          </Card>

          {/* Recently Viewed URLs */}
          {recentUrls.length > 0 &&
            <div className="space-y-3">
              <div className="pt-4 pb-1 flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                <h3 className="text-sm font-medium text-zinc-300">Recently Viewed</h3>
              </div>
              <div className="space-y-2">
                {recentUrls.map((item, idx) =>
                  <div key={idx} className="relative group/item w-full">
                    <button
                      onClick={() => {
                        if (item.videoData) {
                          navigate(createPageUrl('VideoPlayer'), {
                            state: {
                              video: item.videoData,
                              searchResults: [],
                              currentIndex: 0,
                              savedVideos
                            }
                          });
                        } else {
                          setYoutubeUrl(item.url);
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/40 rounded-lg transition-colors text-left">

                      {item.thumbnail &&
                        <img src={item.thumbnail} alt="" className="w-16 h-9 object-cover rounded flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{item.title || item.url}</p>
                        <p className="text-xs text-zinc-500 truncate">{item.url}</p>
                      </div>
                      <PlayCircle className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeRecentUrl(item.videoId); }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-zinc-700/80 text-zinc-400 hover:text-zinc-100 opacity-0 group-hover/item:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          }

          {/* Saved Videos Section - Moved under URL card */}
          {savedVideos.length > 0 &&
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-zinc-400" />
                <h3 className="text-zinc-300 py-5 text-sm font-medium">Saved for Later ({savedVideos.length})</h3>
              </div>
              <div className="space-y-2">
                {savedVideos.map((video) =>
                  <SavedVideoCard
                    key={video.id}
                    video={video}
                    onAnalyze={handleAnalyzeSavedVideo}
                    onRemove={handleRemoveSavedVideo} />

                )}
              </div>
            </div>
          }
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="mt-6 space-y-6">
          {/* Recently Viewed - Search Tab */}
          {recentUrls.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                <h3 className="text-sm font-medium text-zinc-300">Recently Viewed</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentUrls.map((item, idx) => (
                  <div key={idx} className="relative group/card">
                    <button
                      onClick={() => {
                        if (item.videoData) {
                          navigate(createPageUrl('VideoPlayer'), {
                            state: { video: item.videoData, searchResults: [], currentIndex: 0, savedVideos }
                          });
                        } else {
                          navigate(createPageUrl('Analyze?tab=url'));
                        }
                      }}
                      className="w-full flex flex-col bg-zinc-900/50 hover:bg-zinc-800/60 border border-zinc-800/50 hover:border-zinc-700 rounded-lg overflow-hidden transition-all text-left group"
                    >
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} className="w-full aspect-video object-cover" />
                      ) : (
                        <div className="w-full aspect-video bg-zinc-800 flex items-center justify-center">
                          <PlayCircle className="h-8 w-8 text-zinc-600" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm text-zinc-200 font-medium line-clamp-2 group-hover:text-teal-300 transition-colors">{item.title || item.url}</p>
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeRecentUrl(item.videoId); }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-zinc-800/90 text-zinc-400 hover:text-zinc-100 opacity-0 group-hover/card:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Box */}
          {/* Intro Message */}





















          <Card className="bg-zinc-900/50 border-zinc-800/50 p-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-zinc-300 text-lg font-semibold">Search YouTube</Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-zinc-500" />
                    <Input
                      placeholder="Search for business, income generation, or venture videos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-12 h-14 text-base bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500" />

                  </div>
                  <Button
                    onClick={() => handleSearch()}
                    disabled={!searchQuery.trim() || isSearching}
                    size="lg"
                    className="h-14 px-8 bg-zinc-100 text-zinc-900 hover:bg-white disabled:bg-zinc-700 disabled:text-zinc-400">

                    {isSearching ?
                      <Loader2 className="h-5 w-5 animate-spin" /> :

                      <Search className="h-5 w-5" />
                    }
                  </Button>
                </div>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 &&
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-500">Recent Searches</Label>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((query, idx) =>
                      <button
                        key={idx}
                        onClick={() => handleSearch(query)}
                        className="group flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 transition-colors">

                        <span>{query}</span>
                        <X
                          className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearRecentSearch(query);
                          }} />

                      </button>
                    )}
                  </div>
                </div>
              }

              {/* Recommended Searches */}
              {searchResults.length === 0 && !searchQuery &&
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-500 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Recommended Searches
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {recommendedSearches.map((query, idx) =>
                      <button
                        key={idx}
                        onClick={() => handleSearch(query)}
                        className="px-3 py-1.5 bg-teal-950/30 hover:bg-teal-950/50 border border-teal-800/30 rounded-lg text-xs text-teal-300 hover:text-teal-200 transition-colors">

                        {query}
                      </button>
                    )}
                  </div>
                </div>
              }










            </div>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 &&
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-300">
                {searchResults.length} results
              </h3>
              {searchResults.map((video) =>
                <VideoSearchResult
                  key={video.videoId}
                  video={video}
                  onClick={() => handleVideoClick(video)}
                  onSave={() => handleSaveVideo(video)}
                  isAnalyzed={analyzedVideos.has(video.videoId)}
                  isSaved={savedVideos.some((sv) => sv.youtube_id === video.videoId)} />

              )}
            </div>
          }

          {searchResults.length === 0 && !isSearching && searchQuery &&
            <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 text-center">
              <Search className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">No results found for "{searchQuery}"</p>
              <p className="text-sm text-zinc-500 mt-1">Try adjusting your search terms</p>
            </Card>
          }


        </TabsContent>
      </Tabs>

      {/* Usage Status */}
      {subscription && !isPaid && !ANALYSIS_PAUSED &&
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-4">
          <UsageIndicator
            used={subscription.evaluations_used || 0}
            limit={subscription.evaluations_limit || 15}
            label="Free evaluations remaining"
            showUpgrade={true} />

        </Card>
      }

      {/* Browser Extension - Coming Soon */}






















      {/* Analysis Paused Notice */}
      {ANALYSIS_PAUSED &&
        <Card className="bg-amber-950/30 border-amber-800/50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
            <div>
              <h3 className="text-base font-medium text-amber-300 mb-1">Analysis Temporarily Paused</h3>
              <p className="text-sm text-amber-400/90">
                Video analysis is temporarily disabled while we stabilize the session structure. This prevents duplicate sessions and unnecessary credit usage.
              </p>
            </div>
          </div>
        </Card>
      }


    </div>);

}