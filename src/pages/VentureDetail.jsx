import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, DollarSign, Clock, Zap, Youtube, Loader2, Layers, ExternalLink } from 'lucide-react';

const archetypeColors = {
  Creator:     'bg-purple-950/40 border-purple-800/40 text-purple-300',
  Builder:     'bg-blue-950/40   border-blue-800/40   text-blue-300',
  Operator:    'bg-teal-950/40   border-teal-800/40   text-teal-300',
  Merchant:    'bg-amber-950/40  border-amber-800/40  text-amber-300',
  Technician:  'bg-cyan-950/40   border-cyan-800/40   text-cyan-300',
  Opportunist: 'bg-green-950/40  border-green-800/40  text-green-300',
};

const capitalLabels  = { Low: '$0–$200', Medium: '$200–$2,000', High: '$2,000+' };
const timeLabels     = { Fast: 'Days to weeks', Medium: '1–3 months', Slow: '3–12 months' };
const complexityColor = { Low: 'text-green-400', Medium: 'text-amber-400', High: 'text-red-400' };

export default function VentureDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const ventureName = decodeURIComponent(urlParams.get('name') || '');

  const [venture, setVenture] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [introVideos, setIntroVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [userData, allVentures] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Venture.list()
      ]);
      setUser(userData);
      const found = allVentures.find(v => v.venture_name === ventureName) || null;
      setVenture(found);
      setIsLoading(false);
      if (found) fetchIntroVideos(found.venture_name);
    };
    load();
  }, [ventureName]);

  const fetchIntroVideos = async (name) => {
    setVideosLoading(true);
    try {
      const res = await base44.functions.invoke('searchYouTubeVideos', {
        query: `${name} for beginners how to start`
      });
      setIntroVideos((res.data?.results || []).slice(0, 3));
    } catch (e) {
      console.error(e);
    } finally {
      setVideosLoading(false);
    }
  };

  const handleAnalyzeForVenture = async () => {
    if (!user || !venture) return;
    setIsCreatingSession(true);
    try {
      const existing = await base44.entities.AccumulationSession.filter({
        created_by: user.email,
        session_type: 'specific',
        genre: venture.venture_name
      });

      if (existing.length === 0) {
        await base44.entities.AccumulationSession.create({
          session_type: 'specific',
          genre: venture.venture_name,
          accumulated_videos: [],
          general_video_ids: [],
          summarized_execution_claims: { entry: [], validation: [], execution: [], scale: [] }
        });
      }

      navigate(createPageUrl(`Analyze?tab=search&venture=${encodeURIComponent(venture.venture_name)}`));
    } catch (err) {
      console.error('Failed to setup venture session:', err);
    } finally {
      setIsCreatingSession(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!venture) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-zinc-400">
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 text-center">
          <p className="text-zinc-400">Venture not found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Discovery
      </Button>

      {/* Hero */}
      <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 space-y-4">
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="text-3xl font-bold text-zinc-100 flex-1">{venture.venture_name}</h1>
          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${archetypeColors[venture.archetype]}`}>
            {venture.archetype}
          </span>
        </div>
        <p className="text-zinc-300 leading-relaxed">{venture.description}</p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Capital Required', value: capitalLabels[venture.capital_required], color: 'text-zinc-200' },
          { icon: Clock,      label: 'Time to Revenue',  value: timeLabels[venture.time_to_first_money],  color: 'text-zinc-200' },
          { icon: Zap,        label: 'Complexity',        value: venture.complexity,                      color: complexityColor[venture.complexity] },
          { icon: Youtube,    label: 'YouTube Content',   value: venture.youtube_content_volume,          color: 'text-zinc-200' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="bg-zinc-900/50 border-zinc-800/50 p-4 text-center">
            <Icon className="h-5 w-5 text-zinc-500 mx-auto mb-2" />
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className={`text-sm font-semibold ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Work Style */}
      <Card className="bg-zinc-900/50 border-zinc-800/50 p-5">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-zinc-400" />
          <div>
            <p className="text-xs text-zinc-500">Work Style</p>
            <p className="text-sm font-medium text-zinc-200">{venture.energy_style}</p>
          </div>
        </div>
      </Card>

      {/* Intro Videos */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Youtube className="h-4 w-4 text-red-500" />
          <h2 className="text-sm font-semibold text-zinc-300">Introduction Videos</h2>
        </div>
        {videosLoading ? (
          <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading videos…
          </div>
        ) : introVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {introVideos.map((v) => {
              const videoId = v.videoId;
              const thumb = v.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
              const title = v.title || 'Video';
              const channel = v.channelTitle || '';
              return (
                <button
                  key={videoId}
                  onClick={() => navigate(createPageUrl('VideoPlayer'), { state: { video: { videoId, title, channelTitle: channel, thumbnail: thumb, description: v.description || '' }, searchResults: introVideos.map(iv => ({ videoId: iv.videoId, title: iv.title, channelTitle: iv.channelTitle || '', thumbnail: iv.thumbnail || '', description: iv.description || '' })), currentIndex: introVideos.indexOf(v), savedVideos: [] } })}
                  className="group block rounded-xl overflow-hidden bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-all text-left w-full"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img src={thumb} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                        <Youtube className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-zinc-200 line-clamp-2 leading-snug">{title}</p>
                    {channel && <p className="text-xs text-zinc-500 mt-1 truncate">{channel}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Analyze CTA */}
      <Card className="bg-gradient-to-br from-teal-950/40 to-zinc-900/60 border-teal-800/30 p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-teal-950/60 border-2 border-teal-800/40 flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Ready to dive deeper?</h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-sm mx-auto">
              Find YouTube videos about <strong className="text-zinc-300">{venture.venture_name}</strong> and run a Feasix analysis to uncover the real execution requirements.
            </p>
          </div>
          <Button
            onClick={handleAnalyzeForVenture}
            disabled={isCreatingSession}
            size="lg"
            className="bg-teal-600 hover:bg-teal-500 text-white px-8"
          >
            {isCreatingSession ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Setting up session...</>
            ) : (
              <><Sparkles className="h-5 w-5 mr-2" />Analyze a Video for This Venture</>
            )}
          </Button>
          <p className="text-xs text-zinc-600">Creates a dedicated "{venture.venture_name}" session in your account</p>
        </div>
      </Card>
    </div>
  );
}