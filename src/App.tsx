import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { ClientSelectionPage } from './pages/ClientSelectionPage';
import { ClientDataPage } from './pages/ClientDataPage';
import { IntelligenceCenterPage } from './pages/IntelligenceCenterPage';
import { AnalysisResultsPage } from './pages/AnalysisResultsPage';
import { DebtorDetailsPage } from './pages/DebtorDetailsPage';
import { ScoringMethodologyPage } from './pages/ScoringMethodologyPage';
import { ScoringConfigurationPage } from './pages/ScoringConfigurationPage';
import { BatchHistoryPage } from './pages/BatchHistoryPage';
import { AccountActionAnalysisPage } from './pages/AccountActionAnalysisPage';
import { ActionAccountsPage } from './pages/ActionAccountsPage';
import { AccountsPage } from './pages/AccountsPage';
import { OverviewDashboardPage } from './pages/OverviewDashboardPage';
import { CampaignsDashboardPage } from './pages/CampaignsDashboardPage';
import { FinanceDashboardPage } from './pages/FinanceDashboardPage';
import { ClientsDashboardPage } from './pages/ClientsDashboardPage';
import HRDashboardPage from './pages/HRDashboardPage';
import { ProductivityDashboardPage } from './pages/ProductivityDashboardPage';
import { ContactAnalysisPage } from './pages/ContactAnalysisPage';
import { AddressAnalysisPage } from './pages/AddressAnalysisPage';
import { PaymentAnalysisPage } from './pages/PaymentAnalysisPage';
import { DebtAnalysisPage } from './pages/DebtAnalysisPage';
import { DemographicsAnalysisPage } from './pages/DemographicsAnalysisPage';
import { LegalAnalysisPage } from './pages/LegalAnalysisPage';
import { EnhancedFeaturesPage } from './pages/EnhancedFeaturesPage';
import { AccountDetailsPage } from './pages/AccountDetailsPage';
import { GlobalSidebar } from './components/GlobalSidebar';
import { usePageTracking } from './hooks/usePageTracking';
import './App.css';

function App() {
  // Enable page tracking across the entire app
  usePageTracking();
  
  return (
    <div className="min-h-screen bg-white">
      <GlobalSidebar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/select-client" element={
          <ProtectedRoute>
            <ClientSelectionPage />
          </ProtectedRoute>
        } />
        <Route path="/intelligence-center" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <IntelligenceCenterPage />
          </ProtectedRoute>
        } />
        <Route path="/intelligence-center/analysis-results" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <AnalysisResultsPage />
          </ProtectedRoute>
        } />
        <Route path="/intelligence-center/debtor/:debtorId" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <DebtorDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="/intelligence-center/scoring-methodology" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <ScoringMethodologyPage />
          </ProtectedRoute>
        } />
        <Route path="/intelligence-center/scoring-configuration" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <ScoringConfigurationPage />
          </ProtectedRoute>
        } />
        <Route path="/intelligence-center/batch-history" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <BatchHistoryPage />
          </ProtectedRoute>
        } />
        <Route path="/intelligence-center/contact-analysis" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <ContactAnalysisPage />
          </ProtectedRoute>
        } />
        <Route path="/intelligence-center/address-analysis" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <AddressAnalysisPage />
          </ProtectedRoute>
        } />
        <Route path="/intelligence-center/payment-analysis" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <PaymentAnalysisPage />
          </ProtectedRoute>
        } />
        <Route path="/intelligence-center/debt-analysis" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <DebtAnalysisPage />
          </ProtectedRoute>
        } />
        <Route path="/intelligence-center/demographics-analysis" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <DemographicsAnalysisPage />
          </ProtectedRoute>
        } />
        <Route path="/intelligence-center/legal-analysis" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <LegalAnalysisPage />
          </ProtectedRoute>
        } />
        <Route path="/action-analysis" element={
          <ProtectedRoute>
            <AccountActionAnalysisPage />
          </ProtectedRoute>
        } />
        <Route path="/action-analysis/accounts/:accountType" element={
          <ProtectedRoute>
            <ActionAccountsPage />
          </ProtectedRoute>
        } />
        <Route path="/client/:clientId" element={
          <ProtectedRoute>
            <ClientDataPage />
          </ProtectedRoute>
        } />
        <Route path="/client/:clientId/accounts/:accountType" element={
          <ProtectedRoute>
            <AccountsPage />
          </ProtectedRoute>
        } />
        <Route path="/client/:clientId/account/:accountId" element={
          <ProtectedRoute>
            <AccountDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/overview" element={
          <ProtectedRoute>
            <OverviewDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/campaigns" element={
          <ProtectedRoute>
            <CampaignsDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/finance" element={
          <ProtectedRoute>
            <FinanceDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/clients" element={
          <ProtectedRoute>
            <ClientsDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/hr" element={
          <ProtectedRoute>
            <HRDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/productivity" element={
          <ProtectedRoute>
            <ProductivityDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/enhanced-features" element={
          <ProtectedRoute requireSuperAdmin={true}>
            <EnhancedFeaturesPage />
          </ProtectedRoute>
        } />
        <Route path="/finance/account/:accountId" element={
          <ProtectedRoute>
            <AccountDetailsPage />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;