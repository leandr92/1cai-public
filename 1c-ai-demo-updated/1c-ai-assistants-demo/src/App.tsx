import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import AgentProfiles from './components/AgentProfiles';
import DemoSection from './components/DemoSection';
import ExamplesSection from './components/ExamplesSection';
import FAQ from './components/FAQ';
import CaseStudies from './components/CaseStudies';
import Statistics from './components/Statistics';
import Footer from './components/Footer';
import TestAccount from './components/TestAccount';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Имитация загрузки для улучшения UX
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Загрузка ИИ-ассистентов...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={
              <>
                <Hero />
                <AgentProfiles />
                <DemoSection />
                <ExamplesSection />
                <Statistics />
                <CaseStudies />
                <FAQ />
                <TestAccount />
              </>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;