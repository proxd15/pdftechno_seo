// Create a new file called useScroll.js with this content:

import { useEffect, useState, useRef } from "react";

const BOUND_HEIGHT = 100;  // Buffer zone for scrolling

function getScrollDirection({
  position,
  upperBounds = Infinity,
  lowerBounds = -Infinity
}) {
  if (position === undefined) {
    return "stable";
  }
  if (position > lowerBounds - BOUND_HEIGHT) {
    return "bottom";
  }
  if (position < upperBounds + BOUND_HEIGHT) {
    return "top";
  }
  return "stable";
}

export const useScroll = (ref) => {
  const [config, setConfig] = useState({
    position: 0,
    isScrollAllowed: false
  });
  
  const scrollTimer = useRef(null);
  const scrollSpeed = 5;  // Adjust as needed
  
  const { position, isScrollAllowed } = config;
  
  useEffect(() => {
    // Only run if scrolling is allowed and we have a valid ref
    if (isScrollAllowed && ref.current) {
      // Get the container boundaries
      const bounds = ref.current.getBoundingClientRect();
      
      // Determine scroll direction
      const direction = getScrollDirection({
        position,
        upperBounds: bounds.top,
        lowerBounds: bounds.bottom
      });
      
      // Set up interval for smooth scrolling
      if (direction !== "stable") {
        scrollTimer.current = setInterval(() => {
          ref.current?.scrollBy(0, scrollSpeed * (direction === "top" ? -1 : 1));
        }, 10);  // 10ms interval for smooth scrolling
      }
    }
    
    // Clean up interval on changes
    return () => {
      if (scrollTimer.current) {
        clearInterval(scrollTimer.current);
        scrollTimer.current = null;
      }
    };
  }, [isScrollAllowed, position, ref]);
  
  return { updatePosition: setConfig };
};