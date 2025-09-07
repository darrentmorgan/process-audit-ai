import React from 'react';
import { Button } from '@/components/ui/button';

const HospoDojoBrandedLanding: React.FC = () => {
  const hospoDojoLandingContent = {
    hero: {
      headline: "PREP FOR SUCCESS",
      subheadline: "BE BATTLE-READY WITH ACTIONABLE FRAMEWORKS AND MENTORS",
      description: "A safe, collaborative dojo where hospitality pros level up.",
      cta: "Join the Dojo"
    },
    features: [
      {
        title: "Master Service Standards",
        description: "Framework-driven training for consistent guest experiences",
        icon: "🥋"
      },
      {
        title: "Mentor Network Access", 
        description: "Connect with seasoned hospitality senseis and industry masters",
        icon: "👨‍🏫"
      },
      {
        title: "Battle-Tested Workflows",
        description: "Proven operational frameworks for hospitality excellence",
        icon: "⚔️"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#42551C] text-white flex flex-col">
      <header className="container mx-auto px-4 py-8 flex justify-between items-center">
        <div className="logo text-2xl font-bold">Hospo Dojo</div>
        <nav>
          <Button variant="outline" className="text-white border-white hover:bg-white hover:text-[#42551C]">
            Sign In
          </Button>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-4 flex flex-col justify-center items-center text-center">
        <h1 className="text-5xl font-gefika uppercase mb-4">
          {hospoDojoLandingContent.hero.headline}
        </h1>
        <h2 className="text-3xl font-nimbus-sans mb-6">
          {hospoDojoLandingContent.hero.subheadline}
        </h2>
        <p className="text-xl mb-8 max-w-2xl">
          {hospoDojoLandingContent.hero.description}
        </p>
        
        <Button size="lg" className="bg-white text-[#42551C] hover:bg-gray-100">
          {hospoDojoLandingContent.hero.cta}
        </Button>

        <div className="features mt-16 grid md:grid-cols-3 gap-8">
          {hospoDojoLandingContent.features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card bg-black/30 p-6 rounded-lg text-center"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center">
        <p>© 2025 Hospo Dojo. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HospoDojoBrandedLanding;