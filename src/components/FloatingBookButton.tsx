import { useState, useEffect } from "react";
import { Sparkles, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useMode } from "@/contexts/ModeContext";


const FloatingBookButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const { mode } = useMode();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling down 600px
      setIsVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    if (mode === "beauty") {
      navigate("/beauty/services");
    } else if (mode === "fitness") {
      navigate("/fitness/programs");
    } else {
      navigate("/book");
    }
  };

  const getButtonText = () => {
    if (mode === "beauty") return t('floatingCTA.bookBeauty', 'Book Beauty');
    if (mode === "fitness") return t('floatingCTA.bookFitness', 'Book Fitness');
    return t('floatingCTA.bookNow', 'Book Now');
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <Button
        size="lg"
        onClick={handleClick}
        className="shadow-luxury-strong hover:shadow-luxury-strong hover:scale-105 active:scale-95 group min-h-[56px] px-6 rounded-full"
      >
        {mode === "beauty" ? (
          <Sparkles className="w-5 h-5 mr-2 text-champagne-foreground group-hover:rotate-12 transition-transform" />
        ) : (
          <Calendar className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
        )}
        <span className="font-semibold">{getButtonText()}</span>
        <span className="ml-2 transition-transform group-hover:translate-x-1 inline-block">→</span>
      </Button>
    </div>
  );
};

export default FloatingBookButton;
