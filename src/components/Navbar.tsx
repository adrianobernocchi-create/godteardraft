import React from 'react';
import { Crown, BookOpen, Archive, Play, PlusCircle } from 'lucide-react';
import { AppView, DraftSession } from '../types';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  activeSession: DraftSession | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  activeSession
}) => {
  const isDraftInProgress = activeSession && activeSession.status === 'in_progress';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-amber-900/30 text-slate-100 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-amber-700 to-amber-900 p-0.5 shadow-md shadow-amber-950 group-hover:scale-105 transition">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition" />
              </div>
            </div>
            <div>
              <span className="font-cinzel text-lg sm:text-xl font-bold tracking-wider text-amber-200 group-hover:text-amber-100 transition block">
                Godtear
              </span>
              <span className="text-[10px] tracking-widest uppercase text-amber-500/80 font-cinzel block -mt-1">
                Draft Assistant
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onNavigate('setup')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                currentView === 'setup'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Nuovo</span> Draft
            </button>

            <button
              onClick={() => onNavigate('champions')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                currentView === 'champions'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Campioni</span>
            </button>

            <button
              onClick={() => onNavigate('archive')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                currentView === 'archive'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Archive className="w-4 h-4 text-amber-400" />
              <span>Archivio</span>
            </button>

            {/* Quick Resume Active Draft Button */}
            {isDraftInProgress && currentView !== 'draft' && (
              <button
                onClick={() => onNavigate('draft')}
                className="ml-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-500 hover:to-amber-400 transition animate-pulse"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Draft in Corso</span>
                <span className="bg-slate-950 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                  {activeSession.picks.length}/{activeSession.turns.length}
                </span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
