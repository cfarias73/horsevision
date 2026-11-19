import { useCallback, useEffect, useState } from 'react';
import ProductApp from './product/App.jsx';
import SplashScreen from './product/components/SplashScreen.jsx';
import { supabase } from './product/lib/supabaseClient.js';

export default function App() {
  const [splashFinished, setSplashFinished] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initialUser, setInitialUser] = useState(null);

  const finishSplash = useCallback(() => setSplashFinished(true), []);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active) return;
        setInitialUser(session?.user ?? null);
        setSessionReady(true);
      })
      .catch(() => {
        if (!active) return;
        setInitialUser(null);
        setSessionReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!splashFinished || !sessionReady) {
    return (
      <div className="relative min-h-[100dvh] bg-white">
        <SplashScreen onFinish={finishSplash} />
      </div>
    );
  }

  return <ProductApp isAppStore initialUser={initialUser} skipSplash />;
}
