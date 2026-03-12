/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIChat from './pages/AIChat';
import Analyze from './pages/Analyze';
import Categories from './pages/Categories';
import Category from './pages/Category';
import Dashboard from './pages/Dashboard';
import EvaluationHistory from './pages/EvaluationHistory';
import Onboarding from './pages/Onboarding';
import PersonalContext from './pages/PersonalContext';
import PlaceholderSpecificSession from './pages/PlaceholderSpecificSession';
import Pricing from './pages/Pricing';
import Roadmap from './pages/Roadmap';
import SessionDetail from './pages/SessionDetail';
import Sessions from './pages/Sessions';
import Settings from './pages/Settings';
import VentureDetail from './pages/VentureDetail';
import VentureDiscovery from './pages/VentureDiscovery';
import VideoDetail from './pages/VideoDetail';
import VideoPlayer from './pages/VideoPlayer';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIChat": AIChat,
    "Analyze": Analyze,
    "Categories": Categories,
    "Category": Category,
    "Dashboard": Dashboard,
    "EvaluationHistory": EvaluationHistory,
    "Onboarding": Onboarding,
    "PersonalContext": PersonalContext,
    "PlaceholderSpecificSession": PlaceholderSpecificSession,
    "Pricing": Pricing,
    "Roadmap": Roadmap,
    "SessionDetail": SessionDetail,
    "Sessions": Sessions,
    "Settings": Settings,
    "VentureDetail": VentureDetail,
    "VentureDiscovery": VentureDiscovery,
    "VideoDetail": VideoDetail,
    "VideoPlayer": VideoPlayer,
    "LandingPage": LandingPage,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};