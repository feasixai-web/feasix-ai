import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ChevronDown } from 'lucide-react';

export default function ProgressChart({ videos }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group videos by date and calculate cumulative count
  const processData = () => {
    if (!videos || videos.length === 0) return [];

    // Sort videos by created_date
    const sortedVideos = [...videos].sort((a, b) =>
    new Date(a.created_date) - new Date(b.created_date)
    );

    // Group by date and count cumulatively
    const dataMap = {};
    let cumulative = 0;

    sortedVideos.forEach((video) => {
      const date = new Date(video.created_date);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      cumulative++;
      dataMap[dateKey] = cumulative;
    });

    // Convert to array for recharts
    return Object.entries(dataMap).map(([date, count]) => ({
      date,
      videos: count
    }));
  };

  const data = processData();

  if (data.length === 0) {
    return null;
  }

  return (
    <Card className="bg-zinc-900/50 text-card-foreground px-6 rounded-xl border shadow border-zinc-800/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)} className="mt-4 mb-6 w-full flex items-center justify-between hover:opacity-80 transition-opacity">


        <div className="text-left">
          <h3 className="text-lg font-semibold text-zinc-100">Your Progress</h3>
          <p className="text-sm text-zinc-500 mt-1">Track your video analysis growth and accumulation journey</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-950/50">
            <TrendingUp className="h-5 w-5 text-teal-400" />
          </div>
          <ChevronDown
            className={`h-5 w-5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />

        </div>
      </button>

      {isExpanded &&
      <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
            dataKey="date"
            stroke="#71717a"
            tick={{ fill: '#71717a', fontSize: 12 }} />

            <YAxis
            stroke="#71717a"
            tick={{ fill: '#71717a', fontSize: 12 }} />

            <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: '#f4f4f5'
            }}
            labelStyle={{ color: '#a1a1aa' }} />

            <Bar
            dataKey="videos"
            fill="#14b8a6"
            radius={[8, 8, 0, 0]} />

          </BarChart>
        </ResponsiveContainer>
      }
    </Card>);

}