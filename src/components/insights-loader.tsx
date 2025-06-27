
"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";

export default function InsightsLoader() {
  const [progress, setProgress] = React.useState(10);

  React.useEffect(() => {
    // Animate the progress bar to give a sense of loading
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timer);
          return prev;
        }
        // Use a non-linear increment to feel more realistic
        const increment = Math.random() * 10;
        return Math.min(prev + increment, 95);
      });
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex flex-col justify-center items-center p-16 space-y-4 w-full max-w-md mx-auto">
      <p className="text-lg text-primary font-medium">Analyzing all product results...</p>
      <Progress value={progress} className="w-full" />
      <p className="text-sm text-muted-foreground text-center">
        This can take a moment as we gather data from multiple pages. <br/> Please don't close this window.
      </p>
    </div>
  );
}
