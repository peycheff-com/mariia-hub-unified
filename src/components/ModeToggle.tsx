import { Sparkles, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useMode } from "@/contexts/ModeContext";
import { cn } from "@/lib/utils";


const ModeToggle = () => {
  const { mode, setMode } = useMode();
  const navigate = useNavigate();

  return (
    <div className="inline-flex items-center p-1 rounded-2xl bg-white/8 border border-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/6">
      <button
        type="button"
        aria-pressed={mode === "beauty"}
        onClick={() => {
          setMode("beauty");
          navigate("/beauty");
        }}
        className={cn(
          "inline-flex items-center gap-2 px-4 h-9 rounded-xl transition-colors",
          mode === "beauty" ? "bg-white/10 text-pearl" : "text-pearl/80 hover:text-pearl"
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span>Beauty</span>
      </button>
      <button
        type="button"
        aria-pressed={mode === "fitness"}
        onClick={() => {
          setMode("fitness");
          navigate("/fitness");
        }}
        className={cn(
          "inline-flex items-center gap-2 px-4 h-9 rounded-xl transition-colors",
          mode === "fitness" ? "bg-white/10 text-pearl" : "text-pearl/80 hover:text-pearl"
        )}
      >
        <Dumbbell className="w-4 h-4" />
        <span>Fitness</span>
      </button>
    </div>
  );
};

export default ModeToggle;


