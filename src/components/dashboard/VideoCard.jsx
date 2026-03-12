import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RatingBadge from '@/components/ui/RatingBadge';
import FrictionBadge from '@/components/ui/FrictionBadge';
import SignalMeter from '@/components/ui/SignalMeter';
import { Plus, Check, ExternalLink, AlertTriangle, X, ArrowRight, Lock } from 'lucide-react';

export default function VideoCard({ 
  video, 
  onAccumulate, 
  isAccumulated = false,
  canAccumulate = true,
  showDetails = false,
  onDelete,
  sessionId,
  accumulationNumber
}) {
  const isSimulated = video.is_simulated;
  const isGeneralVideo = video.video_type === 'general';
  
  const cardContent = (
      <Card className={`bg-zinc-900/50 border-zinc-800/50 overflow-hidden h-full
        ${isGeneralVideo 
          ? 'opacity-50 cursor-not-allowed relative' 
          : 'cursor-pointer transition-all duration-300 transform-gpu shadow-[0_4px_8px_-2px_rgba(0,0,0,0.3),0_2px_6px_-2px_rgba(0,0,0,0.2),0_10px_20px_-6px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.6),0_10px_25px_-8px_rgba(0,0,0,0.5),0_35px_60px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:-translate-y-3 hover:scale-[1.02] hover:border-zinc-700 hover:bg-zinc-900/70 active:translate-y-0 active:scale-100'
        }`}>
        <div className="flex flex-col h-full">
            {/* Thumbnail */}
          <div className="relative w-full aspect-video flex-shrink-0">
          <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
            {video.thumbnail_url ? (
              <img 
                src={video.thumbnail_url} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-zinc-600 text-xs">No thumbnail</div>
            )}
          </div>
          {video.duration && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs text-zinc-300">
              {video.duration}
            </div>
          )}
          {accumulationNumber && (
            <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-teal-600/90 border-2 border-teal-500 flex items-center justify-center text-sm font-semibold text-white shadow-lg">
              {accumulationNumber}
            </div>
          )}
          {isSimulated && !accumulationNumber && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-900/80 border border-amber-700/50 rounded text-xs text-amber-300 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Simulated
            </div>
          )}
          {isGeneralVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-zinc-400" />
                </div>
                <span className="text-xs text-zinc-400 font-medium">Locked</span>
              </div>
            </div>
          )}
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-zinc-100 line-clamp-2">{video.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">{video.channel}</p>
              {video.video_type && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-xs text-zinc-400">
                  {video.video_type === 'general' ? 'General' : 'Specific'}
                </span>
              )}
              </div>
              {video.rating && (
              <RatingBadge rating={video.rating} />
              )}
              </div>
          
          {video.friction_analysis?.final_verdict?.reason && (
            <p className="mt-3 text-sm text-zinc-400 line-clamp-4">
              {video.friction_analysis.final_verdict.reason}
            </p>
          )}
          

          
          {showDetails && video.requirements_addressed?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-zinc-500 mb-1">Requirements addressed:</p>
              <div className="flex flex-wrap gap-1">
                {video.requirements_addressed.slice(0, 3).map((req, i) => (
                  <span key={i} className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
                    {req}
                  </span>
                ))}
                {video.requirements_addressed.length > 3 && (
                  <span className="px-2 py-0.5 text-xs text-zinc-500">
                    +{video.requirements_addressed.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {onAccumulate && (video.video_type === 'general' || video.rating !== 'skip') && (
                <Button
                  size="sm"
                  variant={isAccumulated ? "secondary" : "outline"}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAccumulate?.(video);
                  }}
                  disabled={isAccumulated || !canAccumulate}
                  className={`
                    ${isAccumulated 
                      ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400' 
                      : 'border-zinc-700 text-zinc-400 hover:text-zinc-100'
                    }
                  `}
                >
                  {isAccumulated ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Accumulated
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Add to Analysis
                    </>
                  )}
                </Button>
              )}
              {video.youtube_id && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-zinc-500 hover:text-zinc-300"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  asChild
                >
                  <a 
                    href={`https://youtube.com/watch?v=${video.youtube_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(video.id);
                }}
                className="p-1.5 rounded-lg hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Delete video"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          </div>
        </div>
      </Card>
  );
  
  return isGeneralVideo ? cardContent : (
    <Link to={createPageUrl(`VideoDetail?id=${video.id}${sessionId ? `&sessionId=${sessionId}` : ''}`)}>
      {cardContent}
    </Link>
  );
}