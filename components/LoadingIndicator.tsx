/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Warming up the projector...",
  "Gathering chalk and pixels...",
  "Writing the script on the blackboard...",
  "Consulting the school librarian...",
  "Drawing the first frame...",
  "Applying artistic filters...",
  "This might take a recess break...",
  "Adding a touch of classroom magic...",
  "Composing the final scene...",
  "Polishing the lens...",
  "Grading the pixels...",
  "Checking for gum under the desk...",
  "Calibrating the creativity sensors...",
  "Untangling the film reel...",
  "Enhancing to honor roll standards...",
  "Don't worry, homework is optional.",
  "Harvesting inspiration...",
  "Asking the teacher for help...",
  "Starting a draft for the science fair..."
];

const LoadingIndicator: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 3000); 

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-[#fffdf0] rounded-xl border-4 border-[#d7ccc8] shadow-[10px_10px_0_rgba(93,64,55,0.2)] rotate-1">
      <div className="w-16 h-16 border-4 border-t-transparent border-[#5d4037] rounded-full animate-spin"></div>
      <h2 className="text-3xl font-bold mt-8 text-[#3e2723]">Generating Your Video</h2>
      <p className="mt-4 text-[#5d4037] text-2xl text-center transition-opacity duration-500 font-bold font-hand">
        {loadingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default LoadingIndicator;