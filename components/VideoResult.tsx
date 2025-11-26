/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {ArrowPathIcon, PlusIcon, SparklesIcon} from './icons';

interface VideoResultProps {
  videoUrl: string;
  onRetry: () => void;
  onNewVideo: () => void;
  onExtend: () => void;
  canExtend: boolean;
}

const VideoResult: React.FC<VideoResultProps> = ({
  videoUrl,
  onRetry,
  onNewVideo,
  onExtend,
  canExtend,
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-10">
      
      {/* Projector Screen Container */}
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Pull string visual (top center) */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center z-0">
           <div className="w-2 h-16 bg-gray-300"></div>
           <div className="w-64 h-4 bg-gray-200 rounded-full shadow-md border border-gray-300"></div>
        </div>

        {/* The Screen Frame */}
        <div className="relative bg-white p-4 pb-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-[12px] border-gray-200 rounded-sm z-10">
           
           <div className="w-full aspect-video bg-black shadow-inner border-2 border-gray-100 overflow-hidden relative">
             <video
               src={videoUrl}
               controls
               autoPlay
               loop
               className="w-full h-full object-contain"
             />
           </div>

           {/* Screen bottom weight bar */}
           <div className="absolute bottom-2 left-4 right-4 h-2 bg-gray-100 rounded-full shadow-inner opacity-50"></div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-6 z-20">
        <button
          onClick={onRetry}
          className="btn-wood flex items-center gap-2 px-6 py-3 rounded-lg text-lg font-bold">
          <ArrowPathIcon className="w-5 h-5" />
          Re-Do Assignment
        </button>
        {canExtend && (
          <button
            onClick={onExtend}
            className="flex items-center gap-2 px-6 py-3 bg-[#2f4f4f] hover:bg-[#1a3c34] text-white font-bold rounded-lg transition-all border-b-4 border-[#14262d] active:border-b-0 active:translate-y-1 text-lg">
            <SparklesIcon className="w-5 h-5" />
            Extend Scene
          </button>
        )}
        <button
          onClick={onNewVideo}
          className="btn-wood flex items-center gap-2 px-6 py-3 rounded-lg text-lg font-bold">
          <PlusIcon className="w-5 h-5" />
          New Project
        </button>
      </div>
    </div>
  );
};

export default VideoResult;