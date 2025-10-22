import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackToTopButtonProps {
  threshold?: number;
}

export function BackToTopButton({ threshold = 800 }: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-28 right-4 z-50 flex flex-col items-center gap-1 animate-fade-in">
      <Button
        onClick={scrollToTop}
        size="icon"
        className="h-12 w-12 rounded-full bg-gray-900 text-white shadow-lg transition-all duration-300 hover:bg-gray-800 hover:scale-110 hover:shadow-xl dark:bg-gray-800 dark:hover:bg-gray-700"
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
        Back to Top
      </span>
    </div>
  );
}
