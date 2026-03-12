import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { User, Bell, Shield, Trash2, Crown, RefreshCw, CheckCircle2, Mail, Info } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactResult, setContactResult] = useState(null);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    loadUser();
  }, []);
  
  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {}
  };
  
  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ created_by: user?.email });
      return subs[0] || { tier: 'free', evaluations_used: 0, evaluations_limit: 15 };
    },
    enabled: !!user
  });
  
  const isPaid = subscription?.tier === 'paid';
  
  const backfillSessions = async () => {
    setIsBackfilling(true);
    setBackfillResult(null);
    
    try {
      // Get all videos for current user
      const allVideos = await base44.entities.Video.filter({ created_by: user?.email });
      
      // Get all existing sessions
      const existingSessions = await base44.entities.AccumulationSession.filter({ created_by: user?.email });
      
      // Track all video IDs already in sessions
      const videosInSessions = new Set();
      existingSessions.forEach(s => {
        if (s.video_ids) {
          s.video_ids.forEach(id => videosInSessions.add(id));
        }
      });
      
      let generalCount = 0;
      let specificCount = 0;
      const genreMap = new Map();
      
      // Find or create THE SINGLE general session
      let generalSession = existingSessions.find(s => s.session_type === 'general');
      
      // Process each video
      for (const video of allVideos) {
        // Skip if already in a session
        if (videosInSessions.has(video.id)) continue;
        
        const videoType = video.video_type || 'general';
        
        if (videoType === 'general') {
          // Add to THE general session
          if (!generalSession) {
            generalSession = await base44.entities.AccumulationSession.create({
              session_type: 'general',
              video_ids: [video.id],
              aggregated_requirements: [],
              aggregated_failures: []
            });
          } else {
            const updatedIds = [...(generalSession.video_ids || []), video.id];
            await base44.entities.AccumulationSession.update(generalSession.id, {
              video_ids: updatedIds
            });
            generalSession.video_ids = updatedIds;
          }
          generalCount++;
        } else {
          // Specific video - detect genre
          const genrePrompt = `Identify the business genre for: "${video.title}". Common genres: Amazon FBA, SaaS, Freelancing, Content/Media, Dropshipping, Affiliate Marketing, Coaching, E-commerce, Real Estate. Return just the genre name (2-4 words).`;
          
          const genreResult = await base44.integrations.Core.InvokeLLM({
            prompt: genrePrompt,
            response_json_schema: {
              type: "object",
              properties: {
                genre: { type: "string" }
              }
            }
          });
          
          const genre = genreResult.genre || 'Other';
          
          if (!genreMap.has(genre)) {
            genreMap.set(genre, []);
          }
          genreMap.get(genre).push(video.id);
          specificCount++;
        }
      }
      
      // Create or update specific sessions by genre
      for (const [genre, videoIds] of genreMap.entries()) {
        const existingSession = existingSessions.find(s => 
          s.session_type === 'specific' && s.genre === genre
        );
        
        if (existingSession) {
          // Add new video IDs to existing session
          const mergedIds = [...new Set([...(existingSession.video_ids || []), ...videoIds])];
          await base44.entities.AccumulationSession.update(existingSession.id, {
            video_ids: mergedIds
          });
        } else {
          // Create new genre session
          await base44.entities.AccumulationSession.create({
            session_type: 'specific',
            genre: genre,
            video_ids: videoIds,
            aggregated_requirements: [],
            aggregated_failures: []
          });
        }
      }
      
      setBackfillResult({
        success: true,
        generalCount,
        specificCount,
        genresCount: genreMap.size
      });
      
      // Refresh sessions
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      
    } catch (error) {
      console.error('Backfill failed:', error);
      setBackfillResult({ success: false, error: error.message });
    } finally {
      setIsBackfilling(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactResult(null);

    try {
      const response = await base44.functions.invoke('submitContactForm', {
        subject: contactSubject,
        message: contactMessage
      });

      if (response.data.success) {
        setContactResult({ success: true });
        setContactSubject('');
        setContactMessage('');
        setTimeout(() => setContactResult(null), 5000);
      } else {
        setContactResult({ success: false, error: 'Failed to send message' });
      }
    } catch (error) {
      setContactResult({ success: false, error: error.message });
    } finally {
      setContactSubmitting(false);
    }
  };
  
  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-zinc-100">Settings</h1>
        <p className="mt-1 text-zinc-500">Manage your account and preferences</p>
      </div>
      
      {/* Profile Section */}
      <Card className="bg-zinc-900/50 border-2 border-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Profile</h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-400">Full Name</Label>
            <Input 
              value={user?.full_name || ''} 
              disabled
              className="bg-zinc-800/50 border-zinc-700 text-zinc-300"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Email</Label>
            <Input 
              value={user?.email || ''} 
              disabled
              className="bg-zinc-800/50 border-zinc-700 text-zinc-300"
            />
          </div>
        </div>
      </Card>
      
      {/* Subscription Section */}
      <Card className="bg-zinc-900/50 border-2 border-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <Crown className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Subscription</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30">
            <div>
              <p className="font-medium text-zinc-200">
                {isPaid ? 'Professional' : 'Free'} Plan
              </p>
              <p className="text-sm text-zinc-500">
                {isPaid 
                  ? 'Unlimited evaluations and full features' 
                  : `${subscription?.evaluations_used || 0} of ${subscription?.evaluations_limit || 15} evaluations used`
                }
              </p>
            </div>
            {!isPaid && (
              <Link to={createPageUrl('Pricing')}>
                <Button className="bg-amber-500 hover:bg-amber-400 text-zinc-900">
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
      
      {/* Notifications */}
      <Card className="bg-zinc-900/50 border-2 border-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Notifications</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-200">Email updates</p>
              <p className="text-sm text-zinc-500">Receive updates about new features</p>
            </div>
            <Switch />
          </div>
          <Separator className="bg-zinc-800" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-200">Analysis complete</p>
              <p className="text-sm text-zinc-500">Get notified when roadmaps are ready</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>
      
      {/* Data Management */}
      <Card className="bg-zinc-900/50 border-2 border-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <RefreshCw className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Data Management</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-zinc-200">Organize Videos into Sessions</p>
              <p className="text-sm text-zinc-500">Re-organize all previously analyzed videos into proper sessions</p>
            </div>
            <Button 
              onClick={backfillSessions}
              disabled={isBackfilling}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              {isBackfilling ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Organize Now
                </>
              )}
            </Button>
          </div>
          
          {backfillResult && (
            <div className={`p-4 rounded-lg ${backfillResult.success ? 'bg-emerald-950/30 border border-emerald-800/30' : 'bg-red-950/30 border border-red-800/30'}`}>
              {backfillResult.success ? (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-300">Successfully organized videos</p>
                    <p className="text-xs text-emerald-400/80 mt-1">
                      {backfillResult.generalCount} general videos, {backfillResult.specificCount} specific videos across {backfillResult.genresCount} genres
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-red-400">Failed to organize videos. Please try again.</p>
              )}
            </div>
          )}
        </div>
      </Card>
      
      {/* Contact & Support */}
      <Card className="bg-zinc-900/50 border-2 border-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Contact & Support</h2>
        </div>
        
        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Subject</Label>
            <Input 
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              placeholder="Bug report, feature request, question..."
              required
              className="bg-zinc-800/50 border-zinc-700 text-zinc-100"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-zinc-300">Message</Label>
            <Textarea 
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Describe your issue or feedback..."
              rows={6}
              required
              className="bg-zinc-800/50 border-zinc-700 text-zinc-100 resize-none"
            />
          </div>

          {contactResult && (
            <div className={`p-3 rounded-lg text-sm ${contactResult.success ? 'bg-emerald-950/30 border border-emerald-800/30 text-emerald-300' : 'bg-red-950/30 border border-red-800/30 text-red-300'}`}>
              {contactResult.success ? 'Message sent! We\'ll get back to you soon.' : `Error: ${contactResult.error}`}
            </div>
          )}

          <Button 
            type="submit"
            disabled={contactSubmitting || !contactSubject || !contactMessage}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white"
          >
            {contactSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </Card>

      {/* Privacy */}
      <Card className="bg-zinc-900/50 border-2 border-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Privacy</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-200">Data collection</p>
              <p className="text-sm text-zinc-500">Allow anonymous usage analytics</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>
      
      {/* MVP Disclaimer */}
      <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/30">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300/90">
            This is an early access MVP. Expect continuous improvements and occasional bugs. Your feedback helps us improve!
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <Card className="bg-red-950/20 border-red-900/30 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Trash2 className="h-5 w-5 text-red-400" />
          <h2 className="text-lg font-semibold text-red-300">Danger Zone</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-200">Delete all data</p>
              <p className="text-sm text-zinc-500">Permanently delete all your analysis history</p>
            </div>
            <Button variant="outline" className="border-red-800 text-red-400 hover:bg-red-950/50">
              Delete
            </Button>
          </div>
          <Separator className="bg-red-900/30" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-200">Delete account</p>
              <p className="text-sm text-zinc-500">Permanently delete your account and all data</p>
            </div>
            <Button variant="outline" className="border-red-800 text-red-400 hover:bg-red-950/50">
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}