import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import BottomNavigation from "@/components/BottomNavigation";
import Dashboard from "@/components/Dashboard";
import Planning from "@/components/Planning";
import Entry from "@/components/Entry";
import Analytics from "@/components/Analytics";
import { initDB } from "@/lib/db";

export default function Home() {
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  useEffect(() => {
    initDB().then(() => {
      setIsDbInitialized(true);
    }).catch(error => {
      console.error('Failed to initialize database:', error);
    });
  }, []);

  // Service worker will be handled by vite-plugin-pwa in production

  if (!isDbInitialized) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-study-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-clock text-white"></i>
          </div>
          <h2 className="text-xl font-semibold mb-2">TimeTracker</h2>
          <p className="text-text-muted">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary text-text-primary flex flex-col">
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/planning" component={Planning} />
          <Route path="/entry" component={Entry} />
          <Route path="/analytics" component={Analytics} />
        </Switch>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
