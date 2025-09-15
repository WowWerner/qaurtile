import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { UserInteractionsService } from '../utils/userInteractions';

// Map of routes to page information
const pageMapping: Record<string, { title: string; icon: string; category: string }> = {
  '/': { title: 'Home', icon: 'Building', category: 'Navigation' },
  '/select-client': { title: 'Client Selection', icon: 'Building', category: 'Client Management' },
  '/intelligence-center': { title: 'Intelligence Center', icon: 'Brain', category: 'Analysis' },
  '/action-analysis': { title: 'Workforce Planning', icon: 'Users', category: 'Planning' },
  '/dashboard/overview': { title: 'Overview Dashboard', icon: 'BarChart3', category: 'Dashboard' },
  '/dashboard/campaigns': { title: 'Campaigns Dashboard', icon: 'Target', category: 'Dashboard' },
  '/dashboard/finance': { title: 'Financial Dashboard', icon: 'DollarSign', category: 'Dashboard' },
  '/dashboard/clients': { title: 'Clients Dashboard', icon: 'Building', category: 'Dashboard' },
  '/dashboard/hr': { title: 'HR Dashboard', icon: 'UserCheck', category: 'Dashboard' },
  '/dashboard/productivity': { title: 'Productivity Dashboard', icon: 'Activity', category: 'Dashboard' },
  '/enhanced-features': { title: 'Enhanced Features', icon: 'Target', category: 'Analysis' },
  '/intelligence-center/analysis-results': { title: 'Analysis Results', icon: 'BarChart3', category: 'Analysis' },
  '/intelligence-center/scoring-methodology': { title: 'Scoring Methodology', icon: 'Target', category: 'Configuration' },
  '/intelligence-center/scoring-configuration': { title: 'Scoring Configuration', icon: 'Settings', category: 'Configuration' },
  '/intelligence-center/batch-history': { title: 'Batch History', icon: 'Clock', category: 'Analysis' },
  '/intelligence-center/contact-analysis': { title: 'Contact Analysis', icon: 'Phone', category: 'Analysis' },
  '/intelligence-center/address-analysis': { title: 'Address Analysis', icon: 'MapPin', category: 'Analysis' },
  '/intelligence-center/payment-analysis': { title: 'Payment Analysis', icon: 'CreditCard', category: 'Analysis' },
  '/intelligence-center/debt-analysis': { title: 'Debt Analysis', icon: 'DollarSign', category: 'Analysis' },
  '/intelligence-center/demographics-analysis': { title: 'Demographics Analysis', icon: 'Users', category: 'Analysis' },
  '/intelligence-center/legal-analysis': { title: 'Legal Analysis', icon: 'Scale', category: 'Analysis' }
};

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Don't track login page or immediate redirects
    if (location.pathname === '/login') return;

    // Get page info
    const pageInfo = pageMapping[location.pathname];
    
    if (pageInfo) {
      // Small delay to avoid tracking rapid navigation
      const timer = setTimeout(() => {
        UserInteractionsService.trackInteraction({
          id: location.pathname,
          title: pageInfo.title,
          path: location.pathname,
          icon: pageInfo.icon,
          type: 'page',
          category: pageInfo.category
        });
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // Handle dynamic routes
      if (location.pathname.startsWith('/client/')) {
        const segments = location.pathname.split('/');
        if (segments.length === 3) {
          // Client data page
          UserInteractionsService.trackInteraction({
            id: location.pathname,
            title: `Client Data - ${segments[2]}`,
            path: location.pathname,
            icon: 'Building',
            type: 'page',
            category: 'Client Management'
          });
        } else if (segments.length === 5 && segments[3] === 'accounts') {
          // Accounts page
          UserInteractionsService.trackInteraction({
            id: location.pathname,
            title: `${segments[4].toUpperCase()} Priority Accounts`,
            path: location.pathname,
            icon: 'Target',
            type: 'page',
            category: 'Client Management'
          });
        }
      }
    }
  }, [location.pathname]);
}