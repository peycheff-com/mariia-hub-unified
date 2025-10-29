import { Sparkles, Dumbbell, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useMode } from "@/contexts/ModeContext";

const QuickActionsBar = () => {
  const navigate = useNavigate();
  const { setMode } = useMode();

  return (
    <div className="sticky top-16 z-40 glass-card backdrop-blur-xl border-b py-2 md:hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => {
              setMode("beauty");
              navigate('/beauty/services');
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-lip-rose/20 text-lip-rose border border-lip-rose/30 hover:bg-lip-rose/30 rounded-full text-xs font-medium transition-all min-h-[44px] touch-manipulation hover:scale-[1.02] active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Book Beauty</span>
          </button>
          <button
            onClick={() => {
              setMode("fitness");
              navigate('/fitness/programs');
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-sage/20 text-sage border border-sage/30 hover:bg-sage/30 rounded-full text-xs font-medium transition-all min-h-[44px] touch-manipulation hover:scale-[1.02] active:scale-95"
          >
            <Dumbbell className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Start Training</span>
          </button>
          <a
            href="https://wa.me/48536200573"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2.5 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 rounded-full text-xs font-medium transition-all min-h-[44px] touch-manipulation hover:scale-[1.02] active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsBar;
