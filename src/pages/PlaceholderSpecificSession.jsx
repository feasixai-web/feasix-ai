import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, AlertCircle, Video } from 'lucide-react';
import RatingBadge from '@/components/ui/RatingBadge';

export default function PlaceholderSpecificSession() {
  const placeholderVideos = [
    {
      id: 'placeholder-1',
      title: 'How I Made $10K/Month with Amazon FBA in 90 Days',
      channel: 'Example Creator',
      thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      rating: 'watch',
      signal_density: 75
    },
    {
      id: 'placeholder-2',
      title: 'Complete Amazon FBA Product Research Strategy',
      channel: 'Business Channel',
      thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      rating: 'skim',
      signal_density: 55
    },
    {
      id: 'placeholder-3',
      title: 'Amazon FBA Mistakes That Cost Me $5,000',
      channel: 'E-commerce Pro',
      thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      rating: 'watch',
      signal_density: 82
    },
    {
      id: 'placeholder-4',
      title: 'Is Amazon FBA Still Worth It in 2026?',
      channel: 'Online Business',
      thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      rating: 'skim',
      signal_density: 48
    },
    {
      id: 'placeholder-5',
      title: 'Step-by-Step Amazon FBA Launch Tutorial',
      channel: 'Startup Guide',
      thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      rating: 'watch',
      signal_density: 70
    }
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link to={createPageUrl('Sessions')}>
          <Button variant="ghost" className="text-zinc-400 hover:text-zinc-200 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-zinc-800/50">
            <Target className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-zinc-100">Amazon FBA</h1>
              <Badge className="bg-zinc-800/50 text-zinc-500 border-zinc-700/50 border text-xs">
                Placeholder
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 mt-1">E-commerce product sales</p>
          </div>
        </div>
      </div>

      {/* General Overview Section (Placeholder) */}
      <Card className="bg-gradient-to-br from-zinc-900/60 to-zinc-900/40 border-zinc-700/50 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/50">
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">General Overview</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-3">
              This section will summarize insights across all applied videos in this niche, combining repeated claims, nuances, and personal context to surface overall feasibility and friction.
            </p>
            <div className="flex items-center gap-2">
              <Badge className="bg-zinc-800/50 text-zinc-500 border-zinc-700/50 text-xs">
                Placeholder
              </Badge>
              <span className="text-xs text-zinc-600">
                No cross-source synthesis yet
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Analyzed Videos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-zinc-500" />
          <h2 className="text-lg font-medium text-zinc-200">Analyzed Videos</h2>
          <span className="text-sm text-zinc-500">({placeholderVideos.length})</span>
        </div>

        <div className="space-y-3">
          {placeholderVideos.map((video) => (
            <Card key={video.id} className="bg-zinc-900/30 border-zinc-800/30 opacity-60 cursor-not-allowed">
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-48 h-32 sm:h-auto flex-shrink-0">
                  <div className="absolute inset-0 bg-zinc-800/50 flex items-center justify-center">
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title}
                      className="w-full h-full object-cover opacity-40"
                    />
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-zinc-900/80 border border-zinc-700/50 rounded text-xs text-zinc-500">
                    Placeholder
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-zinc-400 line-clamp-2">{video.title}</h3>
                      <p className="mt-1 text-sm text-zinc-600">{video.channel}</p>
                      <Badge className="inline-block mt-2 bg-zinc-800/30 border-zinc-700/30 text-zinc-600 text-xs">
                        Specific (Applied)
                      </Badge>
                    </div>
                    <div className="opacity-50">
                      <RatingBadge rating={video.rating} />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-zinc-700/50 rounded-full"
                          style={{ width: `${video.signal_density}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-600">{video.signal_density}%</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-zinc-600">
                    Applied videos in this niche will appear here once analyzed.
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Helper */}
      <Card className="bg-zinc-900/30 border-zinc-800/30 p-5">
        <p className="text-sm text-zinc-500 text-center">
          This is a structural preview. Real videos will accumulate here as Feasix detects execution-focused content in this niche.
        </p>
      </Card>
    </div>
  );
}