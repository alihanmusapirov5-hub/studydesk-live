import React, { useEffect, useState } from 'react';
import {
  AppState,
  storageService,
  UserAccount,
} from './services/storageService';
import { LoginGate } from './components/LoginGate';
import { Header } from './components/Header';
import { StudentDashboard } from './components/StudentDashboard';
import { CuratorDashboard } from './components/CuratorDashboard';
import { HostDashboard } from './components/HostDashboard';
import { SecretOwnerPanel } from './components/SecretOwnerPanel';

export function App() {
  const [appState, setAppState] = useState<AppState>(() =>
    storageService.getState()
  );
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    storageService.getCurrentUser()
  );
  const [now, setNow] = useState<number>(() => Date.now());
  const [secretPanelOpen, setSecretPanelOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = storageService.subscribe((newState) => {
      setAppState({ ...newState });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
  };

  const handleResetDemo = () => {
    const fresh = storageService.resetToInitialState();
    setAppState({ ...fresh });
  };

  if (!currentUser) {
    return (
      <>
        <LoginGate
          onAuthenticated={(user) => {
            setCurrentUser(user);
            setAppState({ ...storageService.getState() });
          }}
          onOpenSecretPanel={() => setSecretPanelOpen(true)}
        />
        <SecretOwnerPanel
          isOpen={secretPanelOpen}
          state={appState}
          onClose={() => setSecretPanelOpen(false)}
          onResetAll={handleResetDemo}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <Header
          user={currentUser}
          etudeActive={appState.etudeModeActive}
          onLogout={handleLogout}
          onOpenSecretPanel={() => setSecretPanelOpen(true)}
        />

        <main className="pb-12">
          {currentUser.role === 'student' && (
            <StudentDashboard
              user={currentUser}
              state={appState}
              now={now}
            />
          )}

          {currentUser.role === 'curator' && (
            <CuratorDashboard
              user={currentUser}
              state={appState}
              now={now}
            />
          )}

          {currentUser.role === 'host' && (
            <HostDashboard
              user={currentUser}
              state={appState}
              now={now}
              onOpenSecretPanel={() => setSecretPanelOpen(true)}
            />
          )}
        </main>
      </div>

      <SecretOwnerPanel
        isOpen={secretPanelOpen}
        state={appState}
        onClose={() => setSecretPanelOpen(false)}
        onResetAll={handleResetDemo}
      />
    </div>
  );
}

export default App;
