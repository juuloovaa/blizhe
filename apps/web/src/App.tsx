import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Doodles } from './components/Doodles';
import { AuthProvider, useAuth } from './state/AuthContext';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { CardsPage } from './pages/CardsPage';
import { TestsPage } from './pages/TestsPage';
import { TestIntroPage } from './pages/TestIntroPage';
import { TestSessionPage } from './pages/TestSessionPage';
import { AssistantPage } from './pages/AssistantPage';
import { ProfilePage } from './pages/ProfilePage';
import { InviteConfirmPage } from './pages/InviteConfirmPage';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

function AppRoutes() {
  const { me, loading, error, inviteCode } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <Doodles scene="onboarding" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="mascot" style={{ margin: '0 auto 16px' }}>
            б
          </div>
          <h1 className="brand">
            Бли<span>же</span>
          </h1>
          <p className="lead-hand">сейчас будет тепло…</p>
        </div>
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="loading-screen">
        <Doodles scene="default" />
        <div style={{ maxWidth: 360, position: 'relative', zIndex: 1 }}>
          <h1 className="brand">
            Бли<span>же</span>
          </h1>
          <div className="section error-box">{error || 'Не удалось авторизоваться'}</div>
          <p className="lead-hand">откройте приложение через бота — так спокойнее</p>
        </div>
      </div>
    );
  }

  if (!me.onboardingCompleted) {
    return <OnboardingPage />;
  }

  if (inviteCode && !me.couple) {
    return <InviteConfirmPage code={inviteCode} />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Shell>
            <HomePage />
          </Shell>
        }
      />
      <Route
        path="/cards"
        element={
          <Shell>
            <CardsPage />
          </Shell>
        }
      />
      <Route
        path="/tests"
        element={
          <Shell>
            <TestsPage />
          </Shell>
        }
      />
      <Route path="/tests/intro/:slug" element={<TestIntroPage />} />
      <Route path="/tests/session/:id" element={<TestSessionPage />} />
      <Route
        path="/assistant"
        element={
          <Shell>
            <AssistantPage />
          </Shell>
        }
      />
      <Route
        path="/profile"
        element={
          <Shell>
            <ProfilePage />
          </Shell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
