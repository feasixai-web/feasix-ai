import React from 'react';
import { Lightbulb, DollarSign, Users, FileText } from 'lucide-react';

export default function VideoQuickOverview({ description, title }) {
  const parseOverview = () => {
          const desc = (description || '').toLowerCase();
          const titleLower = (title || '').toLowerCase();

          // Define category keywords for smart matching
          const categories = {
            'E-commerce & Retail': {
              keywords: ['amazon fba', 'ebay', 'shopify', 'dropshipping', 'etsy', 'retail', 'ecommerce', 'online store', 'print on demand'],
              templates: {
                summary: 'This video covers an e-commerce or retail business model. It explores how to source, market, and sell products online with various fulfillment options.',
                whatItIs: 'An online or retail business focused on selling products',
                howMoneyIsMade: 'Selling products through online marketplaces or your own store',
                whoDoesWork: 'You handle sourcing/marketing, fulfillment varies by model',
                whatVideCovers: 'Product sales and e-commerce strategies'
              }
            },
            'Software & Tech': {
              keywords: ['saas', 'software', 'app', 'ai business', 'ai-based', 'web development', 'coding', 'developer', 'tech startup'],
              templates: {
                summary: 'This video covers a software or tech-based business. It explores how to build and monetize digital products or services with scalable technology.',
                whatItIs: 'A software, app, or technology-based business',
                howMoneyIsMade: 'Subscription fees, licensing, or service delivery',
                whoDoesWork: 'You build and maintain the software/service',
                whatVideCovers: 'Building and monetizing software solutions'
              }
            },
            'Services & Freelancing': {
              keywords: ['freelance', 'freelancing', 'consulting', 'services', 'coaching', 'mentoring', 'agency', 'virtual assistant', 'digital marketing'],
              templates: {
                summary: 'This video covers a service-based or freelancing business. It explores how to offer professional services and build a client base.',
                whatItIs: 'A service-based business offering professional skills',
                howMoneyIsMade: 'Charging clients for your time, expertise, or project deliverables',
                whoDoesWork: 'You provide services directly to clients',
                whatVideCovers: 'Building and scaling a service business'
              }
            },
            'Content & Creators': {
              keywords: ['youtube', 'blogging', 'podcasting', 'content creator', 'affiliate marketing', 'influencer', 'streaming', 'content'],
              templates: {
                summary: 'This video covers a content creation or creator business. It explores how to build an audience and monetize through ads, sponsorships, or affiliate sales.',
                whatItIs: 'A content creation or audience-building business',
                howMoneyIsMade: 'Ad revenue, sponsorships, affiliate marketing, or direct sales',
                whoDoesWork: 'You create and distribute content',
                whatVideCovers: 'Building an audience and monetizing content'
              }
            },
            'Real Estate & Properties': {
              keywords: ['real estate', 'real estate investing', 'property', 'rental', 'flipping', 'airbnb', 'short term rental'],
              templates: {
                summary: 'This video covers a real estate or property-based business. It explores how to invest in, manage, or flip properties for profit.',
                whatItIs: 'A real estate or property investment business',
                howMoneyIsMade: 'Rental income, property flipping, or appreciation',
                whoDoesWork: 'You identify, purchase, and manage properties',
                whatVideCovers: 'Real estate investment strategies'
              }
            },
            'Food & Hospitality': {
              keywords: ['restaurant', 'catering', 'food', 'bakery', 'cooking', 'meal prep', 'chef', 'cafe', 'coffee shop'],
              templates: {
                summary: 'This video covers a food or hospitality business. It explores how to start and operate a food-based venture.',
                whatItIs: 'A food service or hospitality business',
                howMoneyIsMade: 'Selling food products or services to customers',
                whoDoesWork: 'You prepare, market, and sell food/services',
                whatVideCovers: 'Starting and running a food business'
              }
            },
            'Creative Services': {
              keywords: ['photography', 'graphic design', 'design', 'video production', 'editing', 'branding', 'web design', 'logo'],
              templates: {
                summary: 'This video covers a creative services business. It explores how to offer design, photography, or creative expertise to clients.',
                whatItIs: 'A creative services business',
                howMoneyIsMade: 'Charging for creative projects or retainers',
                whoDoesWork: 'You create deliverables for clients',
                whatVideCovers: 'Building a creative services business'
              }
            },
            'Personal Development & Education': {
              keywords: ['course', 'education', 'training', 'online course', 'udemy', 'teaching', 'skill', 'masterclass'],
              templates: {
                summary: 'This video covers an educational or online course business. It explores how to create and sell educational content.',
                whatItIs: 'An educational or online course business',
                howMoneyIsMade: 'Selling courses or educational content',
                whoDoesWork: 'You create and sell educational materials',
                whatVideCovers: 'Building and selling online courses'
              }
            },
            'Health & Wellness': {
              keywords: ['fitness', 'gym', 'personal trainer', 'wellness', 'nutrition', 'health coaching', 'yoga', 'supplement'],
              templates: {
                summary: 'This video covers a health and wellness business. It explores how to help clients improve their physical health, fitness, or wellness through services or products.',
                whatItIs: 'A health and wellness-focused business',
                howMoneyIsMade: 'Selling fitness services, coaching, products, or subscriptions',
                whoDoesWork: 'You provide guidance, training, or products to clients',
                whatVideCovers: 'Building a fitness or wellness business'
              }
            },
            'Transportation & Mobility': {
              keywords: ['uber', 'lyft', 'delivery', 'logistics', 'transportation', 'courier', 'car rental'],
              templates: {
                summary: 'This video covers a transportation or mobility-based business. It explores how to provide transportation or delivery services.',
                whatItIs: 'A transportation or mobility service business',
                howMoneyIsMade: 'Charging for transportation, delivery, or logistics services',
                whoDoesWork: 'You provide vehicle and logistics management',
                whatVideCovers: 'Building transportation or delivery services'
              }
            },
            'Finance & Investing': {
              keywords: ['stocks', 'investing', 'crypto', 'trading', 'forex', 'finance', 'wealth management', 'bitcoin'],
              templates: {
                summary: 'This video covers a finance or investing business. It explores strategies for growing wealth through trading, investing, or financial services.',
                whatItIs: 'A finance, trading, or investment-focused business',
                howMoneyIsMade: 'Trading profits, investment returns, or advisory fees',
                whoDoesWork: 'You manage investments and market analysis',
                whatVideCovers: 'Investment strategies and wealth building'
              }
            },
            'Home Services & Maintenance': {
              keywords: ['plumbing', 'electrical', 'cleaning', 'landscaping', 'hvac', 'handyman', 'home maintenance', 'contractor'],
              templates: {
                summary: 'This video covers a home services business. It explores how to provide residential maintenance, repair, or cleaning services.',
                whatItIs: 'A home services or maintenance business',
                howMoneyIsMade: 'Charging for residential repair, maintenance, or cleaning services',
                whoDoesWork: 'You perform services at customer locations',
                whatVideCovers: 'Building a home services business'
              }
            },
            'Pet Services & Products': {
              keywords: ['pet grooming', 'pet sitting', 'pet care', 'dog training', 'pet business', 'veterinary', 'pet supplies'],
              templates: {
                summary: 'This video covers a pet services or products business. It explores how to serve pet owners through services or product sales.',
                whatItIs: 'A pet services or products business',
                howMoneyIsMade: 'Selling pet services, care, grooming, or products',
                whoDoesWork: 'You care for and serve pets and their owners',
                whatVideCovers: 'Building a pet-focused business'
              }
            },
            'Beauty & Personal Care': {
              keywords: ['salon', 'makeup', 'beauty', 'skincare', 'hairdressing', 'cosmetology', 'nails', 'esthetician'],
              templates: {
                summary: 'This video covers a beauty or personal care business. It explores how to provide beauty services or sell beauty products.',
                whatItIs: 'A beauty or personal care business',
                howMoneyIsMade: 'Selling beauty services or products to clients',
                whoDoesWork: 'You provide beauty services or manage product sales',
                whatVideCovers: 'Building a beauty industry business'
              }
            },
            'Marketing & Advertising': {
              keywords: ['marketing', 'seo', 'social media marketing', 'advertising', 'brand marketing', 'digital ads'],
              templates: {
                summary: 'This video covers a marketing or advertising business. It explores how to help businesses grow through marketing strategies and advertising.',
                whatItIs: 'A marketing or advertising services business',
                howMoneyIsMade: 'Charging clients for marketing services or advertising management',
                whoDoesWork: 'You develop and execute marketing strategies',
                whatVideCovers: 'Building a marketing agency or consulting business'
              }
            },
            'Manufacturing & Production': {
              keywords: ['manufacturing', 'production', 'factory', 'supplier', 'wholesale', 'industrial'],
              templates: {
                summary: 'This video covers a manufacturing or production business. It explores how to make and sell physical products at scale.',
                whatItIs: 'A manufacturing or production-based business',
                howMoneyIsMade: 'Selling manufactured goods to retailers or consumers',
                whoDoesWork: 'You manage production, quality, and distribution',
                whatVideCovers: 'Building a manufacturing business'
              }
            },
            'Automotive & Repair': {
              keywords: ['mechanic', 'auto repair', 'car detailing', 'auto sales', 'automotive', 'vehicle maintenance'],
              templates: {
                summary: 'This video covers an automotive or repair business. It explores how to provide vehicle maintenance, repair, or sales services.',
                whatItIs: 'An automotive service or sales business',
                howMoneyIsMade: 'Charging for vehicle repairs, maintenance, or sales',
                whoDoesWork: 'You perform repairs and manage customer relationships',
                whatVideCovers: 'Building an automotive business'
              }
            },
            'Local Services & Retail': {
              keywords: ['local business', 'retail store', 'shop', 'boutique', 'local services', 'brick and mortar'],
              templates: {
                summary: 'This video covers a local services or retail business. It explores how to build a community-based business with physical presence.',
                whatItIs: 'A local retail or services business',
                howMoneyIsMade: 'Selling products or services directly to local customers',
                whoDoesWork: 'You manage operations and customer relationships',
                whatVideCovers: 'Building a local business'
              }
            },
            'Event Planning & Entertainment': {
              keywords: ['event planning', 'event management', 'entertainment', 'party planning', 'dj', 'catering event'],
              templates: {
                summary: 'This video covers an event planning or entertainment business. It explores how to organize and profit from events.',
                whatItIs: 'An event planning or entertainment business',
                howMoneyIsMade: 'Charging clients for event planning and coordination',
                whoDoesWork: 'You plan and execute events for clients',
                whatVideCovers: 'Building an event planning business'
              }
            },
            'Consulting & Professional Services': {
              keywords: ['consultant', 'consulting', 'advisor', 'business consultant', 'management consulting', 'expert advice'],
              templates: {
                summary: 'This video covers a consulting or professional services business. It explores how to leverage expertise to advise businesses or individuals.',
                whatItIs: 'A consulting or professional advisory business',
                howMoneyIsMade: 'Charging for consulting advice and expertise',
                whoDoesWork: 'You provide strategic advice and analysis',
                whatVideCovers: 'Building a consulting practice'
              }
            }
          };

          // Try to find a matching category
          for (const [categoryName, categoryData] of Object.entries(categories)) {
            if (categoryData.keywords.some(keyword => titleLower.includes(keyword) || desc.includes(keyword))) {
              return categoryData.templates;
            }
          }

          // Fallback: intelligently extract business type from title and generate generic description
          // Try to extract a business type noun from the title (e.g., "How to Start a Photography Business" → "photography")
          const businessTypeMatch = titleLower.match(/(?:start|build|launch|create).*?(?:a|an)\s+([a-z\s]+)(?:business|venture|startup|service)/i);
          let extractedType = businessTypeMatch ? businessTypeMatch[1].trim() : null;

          if (extractedType) {
            return {
              summary: `This video covers how to build a ${extractedType} business. It explores the fundamentals and strategies for starting and growing this type of venture.`,
              whatItIs: `A business focused on ${extractedType}`,
              howMoneyIsMade: `Revenue depends on the specific ${extractedType} model and value delivered`,
              whoDoesWork: 'You build and operate the business',
              whatVideCovers: `${extractedType} business strategies and execution`
            };
          }

          // Ultimate fallback: generic descriptions
          return {
            summary: 'This video offers principles and insights applicable to various business endeavors. It explores foundational concepts and strategies.',
            whatItIs: 'Business principles, strategies, or concepts',
            howMoneyIsMade: 'Varies depending on the specific business model discussed',
            whoDoesWork: 'Entrepreneurs and individuals pursuing business goals',
            whatVideCovers: 'Business fundamentals and strategic concepts'
          };
        };
  
  const overview = parseOverview();
  
  const RequirementCard = ({ icon: Icon, title, description, iconBg, iconColor }) => (
    <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-lg p-5 hover:border-zinc-700/50 transition-colors">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <h4 className="text-sm font-medium text-zinc-300">{title}</h4>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-200">Video Discussion</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {overview.summary}
        </p>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-100">How This Model Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RequirementCard
            icon={Lightbulb}
            title="What It Is"
            description={overview.whatItIs}
            iconBg="bg-blue-950/50"
            iconColor="text-blue-400"
          />
          <RequirementCard
            icon={DollarSign}
            title="How Money Is Made"
            description={overview.howMoneyIsMade}
            iconBg="bg-emerald-950/50"
            iconColor="text-emerald-400"
          />
          <RequirementCard
            icon={Users}
            title="Who Does The Work"
            description={overview.whoDoesWork}
            iconBg="bg-purple-950/50"
            iconColor="text-purple-400"
          />
          <RequirementCard
            icon={FileText}
            title="What This Video Covers"
            description={overview.whatVideCovers}
            iconBg="bg-orange-950/50"
            iconColor="text-orange-400"
          />
        </div>
      </div>
    </div>
  );
}