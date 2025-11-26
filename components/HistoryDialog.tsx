/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import { getAllVideos, StoredVideo } from '../services/videoStorageService';
import { FilmIcon, XMarkIcon } from './icons';

interface HistoryDialogProps {
  onClose: () => void;
  onSelect: (video: StoredVideo) => void;
}

const HistoryDialog: React.FC<HistoryDialogProps> = ({ onClose, onSelect }) => {
  const [videos, setVideos] = useState<StoredVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const data = await getAllVideos();
        setVideos(data);
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadVideos();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#fff9c4] w-full max-w-3xl h-[80vh] flex flex-col rounded-lg shadow-2xl border-4 border-[#5d4037] relative overflow-hidden">
        {/* Header - Gradebook style */}
        <div className="bg-[#5d4037] p-4 flex items-center justify-between text-[#fffdf0] border-b-4 border-[#3e2723]">
          <h2 className="text-3xl font-bold tracking-wide" style={{ fontFamily: '"Patrick Hand", cursive' }}>
            Class Records
          </h2>
          <button onClick={onClose} className="hover:bg-[#3e2723] p-1 rounded-full transition-colors">
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-grow overflow-y-auto p-6 bg-[linear-gradient(transparent_23px,#e0e0e0_24px)] bg-[length:100%_24px]">
          {isLoading ? (
            <div className="text-center p-8 text-xl text-[#5d4037]">Loading records...</div>
          ) : videos.length === 0 ? (
            <div className="text-center p-12 opacity-60">
              <div className="text-6xl mb-4">📓</div>
              <p className="text-2xl font-bold text-[#5d4037]">No assignments yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div 
                  key={video.id} 
                  onClick={() => onSelect(video)}
                  className="group flex items-start gap-4 p-4 bg-white/60 hover:bg-white border-2 border-transparent hover:border-[#8d6e63] rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-md"
                >
                  <div className="bg-[#d7ccc8] p-3 rounded-md group-hover:bg-[#bcaaa4] transition-colors">
                    <FilmIcon className="w-8 h-8 text-[#5d4037]" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8d6e63]">
                        {new Date(video.timestamp).toLocaleString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <span className="text-xs font-mono bg-[#efebe9] px-2 py-0.5 rounded text-[#5d4037] border border-[#d7ccc8]">
                        {video.params.mode}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-[#3e2723] leading-tight line-clamp-2">
                       {video.prompt || "Untitled Video"}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryDialog;
