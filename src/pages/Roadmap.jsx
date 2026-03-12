import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RoadmapStep from '@/components/roadmap/RoadmapStep';
import FeasibilityFactor from '@/components/roadmap/FeasibilityFactor';
import AggregatedInsights from '@/components/analysis/AggregatedInsights';
import { ArrowLeft, Loader2, Lock, Map, AlertTriangle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function Roadmap() {
  const [user, setUser] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session');
  
  useEffect(() => {
    loadUser();
  }, []);
  
  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {}
  };
  
  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const sessions = await base44.entities.AccumulationSession.filter({ id: sessionId });
      return sessions[0];
    },
    enabled: !!sessionId
  });
  
  const { data: category } = useQuery({
    queryKey: ['category', session?.category_id],
    queryFn: async () => {
      const cats = await base44.entities.Category.filter({ id: session?.category_id });
      return cats[0];
    },
    enabled: !!session?.category_id
  });
  
  const { data: videos = [] } = useQuery({
    queryKey: ['session-videos', session?.video_ids],
    queryFn: async () => {
      const allVideos = await base44.entities.Video.list();
      return allVideos.filter(v => session?.video_ids?.includes(v.id));
    },
    enabled: !!session?.video_ids?.length
  });
  
  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ created_by: user?.email });
      return subs[0] || { tier: 'free' };
    },
    enabled: !!user
  });
  
  const isPaid = subscription?.tier === 'paid';
  
  // Generate roadmap when session loads
  useEffect(() => {
    if (session && category && videos.length > 0 && !roadmap && !isGenerating) {
      generateRoadmap();
    }
  }, [session, category, videos, roadmap, isGenerating]);
  
  const generateRoadmap = async () => {
    setIsGenerating(true);
    
    try {
      const prompt = `
        Based on analyzing ${videos.length} high-quality advice videos about "${category?.name}", 
        generate a structural roadmap that represents the implicit sequence of steps assumed by the advice content.
        
        This is NOT prescriptive advice - it's a descriptive model of what the advice assumes.
        
        Video insights:
        ${videos.map(v => `
          - ${v.title}
          - Requirements addressed: ${v.requirements_addressed?.join(', ') || 'None specified'}
          - Failure points discussed: ${v.failure_points_discussed?.join(', ') || 'None specified'}
          - Constraints: ${v.constraints_mentioned?.join(', ') || 'None specified'}
        `).join('\n')}
        
        Category requirements: ${JSON.stringify(category?.core_requirements || [])}
        Category failure points: ${JSON.stringify(category?.common_failure_points || [])}
        
        Generate:
        1. 4-6 structural steps (what the advice implicitly assumes happens)
        2. For each step: why it exists, common failures, assumptions about the user
        3. 3-5 feasibility factors (conditional statements like "Feasibility increases with...")
        4. Aggregated requirements and failure points from the videos
        
        Remember: No timelines, no "do this next," no optimization language.
        Frame everything as descriptive observations, not instructions.
      `;
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  order: { type: "number" },
                  title: { type: "string" },
                  description: { type: "string" },
                  why_exists: { type: "string" },
                  common_failures: { type: "array", items: { type: "string" } },
                  assumptions_about_user: { type: "array", items: { type: "string" } }
                }
              }
            },
            feasibility_factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  statement: { type: "string" },
                  impact_level: { type: "string" }
                }
              }
            },
            aggregated_requirements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  requirement: { type: "string" },
                  source_count: { type: "number" },
                  confidence: { type: "string" }
                }
              }
            },
            aggregated_failures: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  failure: { type: "string" },
                  source_count: { type: "number" },
                  stage: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      // Save roadmap
      const savedRoadmap = await base44.entities.Roadmap.create({
        session_id: sessionId,
        category_id: category.id,
        steps: result.steps,
        feasibility_factors: result.feasibility_factors
      });
      
      // Update session with aggregated data
      await base44.entities.AccumulationSession.update(session.id, {
        status: 'complete',
        aggregated_requirements: result.aggregated_requirements,
        aggregated_failures: result.aggregated_failures,
        roadmap_generated: true
      });
      
      setRoadmap({
        ...savedRoadmap,
        ...result
      });
      
    } catch (e) {
      console.error('Failed to generate roadmap:', e);
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (loadingSession) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64 bg-zinc-800/50 mb-4" />
        <Skeleton className="h-4 w-96 bg-zinc-800/50" />
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="text-zinc-400">Session not found</p>
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="outline" className="mt-4 border-zinc-700 text-zinc-300">
              Return to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link to={createPageUrl('Dashboard')} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-zinc-800/50">
            <Map className="h-6 w-6 text-zinc-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-zinc-100">
              Structural Roadmap
            </h1>
            <p className="mt-1 text-zinc-500">{category?.name}</p>
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <Card className="bg-blue-950/20 border-blue-800/30 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-300">
              This roadmap represents the implicit structure assumed by the analyzed advice content.
            </p>
            <p className="text-sm text-blue-400/70 mt-1">
              It is descriptive, not prescriptive. No timelines or action recommendations are provided.
            </p>
          </div>
        </div>
      </Card>
      
      {isGenerating ? (
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-12 text-center">
          <Loader2 className="h-8 w-8 text-zinc-400 mx-auto animate-spin mb-4" />
          <p className="text-zinc-400">Generating structural roadmap...</p>
          <p className="text-sm text-zinc-500 mt-1">Analyzing {videos.length} accumulated sources</p>
        </Card>
      ) : roadmap ? (
        <>
          {/* Roadmap Steps */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Inferred Structure</h2>
            <div className="space-y-4">
              {roadmap.steps?.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <RoadmapStep 
                    step={step} 
                    isBlurred={!isPaid && index >= 2}
                  />
                </motion.div>
              ))}
            </div>
            
            {!isPaid && roadmap.steps?.length > 2 && (
              <Card className="mt-4 bg-amber-950/20 border-amber-800/30 p-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-amber-400" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-300">
                      {roadmap.steps.length - 2} more steps available with paid tier
                    </p>
                  </div>
                  <Link to={createPageUrl('Pricing')}>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white">
                      Upgrade
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </section>
          
          {/* Feasibility Factors */}
          {roadmap.feasibility_factors?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Feasibility Factors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roadmap.feasibility_factors.map((factor, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <FeasibilityFactor 
                      factor={factor} 
                      isBlurred={!isPaid && index >= 2}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}
          
          {/* Aggregated Insights */}
          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Aggregated Insights</h2>
            <AggregatedInsights 
              session={{
                aggregated_requirements: roadmap.aggregated_requirements,
                aggregated_failures: roadmap.aggregated_failures
              }}
              isBlurred={!isPaid}
            />
            
            {!isPaid && (
              <Card className="mt-4 bg-amber-950/20 border-amber-800/30 p-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-amber-400" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-300">
                      Full insights available with paid tier
                    </p>
                  </div>
                  <Link to={createPageUrl('Pricing')}>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white">
                      Upgrade
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </section>
        </>
      ) : (
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="text-zinc-400">No roadmap data available</p>
        </Card>
      )}
    </div>
  );
}