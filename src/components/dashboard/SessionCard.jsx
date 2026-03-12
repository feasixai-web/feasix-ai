import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Layers, ArrowRight, Video, Compass } from 'lucide-react';

const sessionStyles = {
  specific: {
    border: 'border-teal-800/50 hover:border-teal-600/60',
    iconBg: 'bg-teal-950/60 border border-teal-800/40',
    icon: <Compass className="h-5 w-5 text-teal-400" />,
    badge: 'bg-teal-950/60 text-teal-400 border border-teal-800/40',
    label: 'Specific Venture',
    arrow: 'text-teal-500',
  },
  general: {
    border: 'border-purple-800/50 hover:border-purple-600/60',
    iconBg: 'bg-purple-950/60 border border-purple-800/40',
    icon: <Layers className="h-5 w-5 text-purple-400" />,
    badge: 'bg-purple-950/60 text-purple-400 border border-purple-800/40',
    label: 'General Research',
    arrow: 'text-purple-500',
  },
};

export default function SessionCard({ session }) {
  const videoCount = (session.accumulated_videos?.length || 0) + (session.general_video_ids?.length || 0);
  const style = sessionStyles[session.session_type] || sessionStyles.general;

  return (
    <Link to={createPageUrl(`SessionDetail?id=${session.id}`)}>
      <Card className={`bg-zinc-900/50 ${style.border} p-5 transition-all hover:scale-[1.01] cursor-pointer h-full`}>
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${style.iconBg}`}>
            {style.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                {style.label}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 truncate">
              {session.genre || 'General Research Session'}
            </h3>
            {session.summary && (
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{session.summary}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Video className="h-3 w-3" />
                {videoCount} video{videoCount !== 1 ? 's' : ''}
              </span>
              <span className={`flex items-center gap-1 ml-auto ${style.arrow}`}>
                View session <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}