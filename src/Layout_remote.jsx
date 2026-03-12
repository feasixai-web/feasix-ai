import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
        LayoutDashboard, 
        Search, 
        Settings, 
        LogOut, 
        Crown,
        Menu,
        X,
        Layers,
        Clock,
        User,
        HelpCircle,
        CheckCircle2,
        Compass
      } from 'lucide-react';
import FeasixWordmark from '@/components/brand/FeasixWordmark';
import FeasixIcon from '@/components/brand/FeasixIcon';
import FeasixBot from '@/components/FeasixBot';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import WelcomeOverlay from '@/components/WelcomeOverlay';
import AnalysisProgressCard from '@/components/ui/AnalysisProgressCard';
import { toast } from 'sonner';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('preparing');
  const [analysisVideoTitle, setAnalysisVideoTitle] = useState('');
  const [analysisVideoId, setAnalysisVideoId] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    loadUser();
    // Check if user has seen welcome overlay
    const hasSeenWelcome = localStorage.getItem('feasix-welcome-seen');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  // Global listener for background video analysis completion
  useEffect(() => {
    const checkAnalysisStatus = async () => {
      const analyzing = sessionStorage.getItem('feasix-analyzing-video');
      const step = sessionStorage.getItem('feasix-analysis-step');
      const title = sessionStorage.getItem('feasix-analysis-title');

      if (!analyzing) {
        return;
      }

      setShowCard(true);
      if (title) setAnalysisVideoTitle(title);
      if (step) setAnalysisStep(step);
      
      try {
        const { videoId } = JSON.parse(analyzing);
        if (videoId) setAnalysisVideoId(videoId);
      } catch (e) {}

      try {
        const { videoId } = JSON.parse(analyzing);
        const videos = await base44.entities.Video.filter({ id: videoId });
        
        if (videos.length > 0) {
          const video = videos[0];
          // Check if analysis is complete
          if (video.friction_analysis || video.eight_dimension_analysis || video.rating) {
            setAnalysisStep('complete');
            toast.success('Video analysis complete!', {
              description: title || 'Your video has been analyzed',
              duration: 5000
            });
            // Stop polling once complete—user must dismiss or click View Results
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error checking analysis status:', error);
      }
    };

    let interval;
    checkAnalysisStatus();
    interval = setInterval(checkAnalysisStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      // Redirect to onboarding if not completed and not already there
      if (!userData?.onboarding_complete && currentPageName !== 'Onboarding') {
        window.location.href = createPageUrl('Onboarding');
      }
    } catch (e) {
      // Not logged in - show landing page
    } finally {
      setIsChecking(false);
    }
  };

  // If not authenticated and checking for auth, show nothing
  if (isChecking) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  // If not authenticated, always redirect to landing page
  if (!user) {
    if (currentPageName !== 'LandingPage') {
      window.location.href = createPageUrl('LandingPage');
      return null;
    }
    // Render landing page for unauthenticated users
    return children;
  }

  // If on landing page or onboarding, render full-width without sidebar
  if (currentPageName === 'LandingPage' || currentPageName === 'Onboarding') {
    return children;
  }
  
  const navItems = [
    { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
    { name: 'Discover Ventures', page: 'VentureDiscovery', icon: Compass },
    { name: 'Analyze', page: 'Analyze', icon: Search },
    { name: 'Sessions', page: 'Sessions', icon: Layers },
    { name: 'Personal Context', page: 'PersonalContext', icon: User },
    { name: 'The Feasibot', page: 'AIChat', icon: HelpCircle },
    { name: 'History', page: 'EvaluationHistory', icon: Clock },
    { name: 'Settings', page: 'Settings', icon: Settings },
  ];
  
  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800/50 flex flex-col items-center justify-center">
        <Link to={createPageUrl('Dashboard')} className="group text-center">
          <FeasixWordmark showIcon={false} className="text-2xl font-bold text-zinc-100 group-hover:text-white transition-colors" />
          <p className="text-xs text-zinc-500 mt-2">Filter advice. Surface requirements.</p>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPageName === item.page;
          const Icon = item.icon;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              onClick={() => setIsOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-zinc-800/80 text-zinc-100' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Analysis Progress Card */}
      {showCard && (
        <div className="px-4 pb-4">
          <AnalysisProgressCard
            currentStep={analysisStep}
            videoTitle={analysisVideoTitle}
            videoId={analysisVideoId}
            onDismiss={() => {
              setShowCard(false);
              sessionStorage.removeItem('feasix-analyzing-video');
              sessionStorage.removeItem('feasix-analysis-step');
              sessionStorage.removeItem('feasix-analysis-title');
              setAnalysisVideoId('');
            }}
          />
        </div>
      )}
      
      {/* Upgrade CTA */}
      <div className="p-4">
        <Link to={createPageUrl('Pricing')}>
          <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-amber-400" />
              <span className="font-semibold text-zinc-200">Upgrade</span>
            </div>
            <p className="text-xs text-zinc-400">Unlock unlimited evaluations and full roadmaps</p>
            <Button size="sm" className="w-full mt-3 bg-zinc-100 text-zinc-900 hover:bg-white">
              $7.99/month
            </Button>
          </div>
        </Link>
      </div>
      
      {/* User */}
      {user && (
        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{user.full_name || 'User'}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            <button 
              onClick={() => base44.auth.logout()}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => setShowWelcome(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Help & Tutorial</span>
          </button>
          <Link
            to={createPageUrl('Onboarding')}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30 transition-colors"
          >
            <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-mono">DEV</span>
            <span>Onboarding</span>
          </Link>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="min-h-screen bg-zinc-950">
      <style>{`
        :root {
          --background: 9 9 11;
          --foreground: 250 250 250;
        }
        body {
          background-color: rgb(9, 9, 11);
          color: rgb(250, 250, 250);
        }
        p, span, li, h1, h2, h3, h4, h5, h6, td, th, blockquote {
          user-select: text;
          cursor: text;
        }
      `}</style>
      
      {/* Welcome Overlay */}
      {showWelcome && <WelcomeOverlay onClose={() => setShowWelcome(false)} />}
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col border-r border-zinc-800/50 bg-zinc-950">
        <NavContent />
      </aside>
      
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50 z-50">
        <div className="flex items-center justify-between h-full px-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="text-zinc-400 hover:text-zinc-200 transition-colors">
                <FeasixWordmark showIcon={false} className="text-xl font-bold text-zinc-100" />
              </button>
            </SheetTrigger>

            <div className="flex items-center gap-3">
              <Link to={createPageUrl('PersonalContext')} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors">
                <div className="w-8 h-8 rounded-full bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Profile</span>
              </Link>

              <SheetTrigger asChild>
                <button className="p-2 text-zinc-400 hover:text-zinc-200 flex items-center justify-center">
                  <FeasixIcon className="w-6 h-6" />
                </button>
              </SheetTrigger>
            </div>
            
            <SheetContent side="left" className="w-64 p-0 bg-zinc-950 border-zinc-800">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen pb-24">
        {children}
      </main>

      {/* Feasix AI Bot */}
      <FeasixBot />
      </div>
      );
      }