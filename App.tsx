/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useState} from 'react';
import ApiKeyDialog from './components/ApiKeyDialog';
import HistoryDialog from './components/HistoryDialog';
import {BookOpenIcon, CurvedArrowDownIcon} from './components/icons';
import LoadingIndicator from './components/LoadingIndicator';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import {generateVideo} from './services/geminiService';
import {
  getLastVideoId,
  getVideo,
  saveVideo,
  StoredVideo,
  clearLastVideoId
} from './services/videoStorageService';
import {
  AppState,
  GenerateVideoParams,
  GenerationMode,
  Resolution,
  VideoFile,
} from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(
    null,
  );
  const [lastVideoObject, setLastVideoObject] = useState<Video | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const [initialFormValues, setInitialFormValues] =
    useState<GenerateVideoParams | null>(null);

  // Restore session from localStorage/IndexedDB
  useEffect(() => {
    const restoreSession = async () => {
      const lastId = getLastVideoId();
      if (lastId) {
        try {
          const storedVideo = await getVideo(lastId);
          if (storedVideo) {
            console.log('Restoring last session video:', storedVideo.id);
            const newObjectUrl = URL.createObjectURL(storedVideo.blob);
            setVideoUrl(newObjectUrl);
            setLastVideoBlob(storedVideo.blob);
            setLastConfig(storedVideo.params);
            setLastVideoObject(storedVideo.videoObject || null);
            setAppState(AppState.SUCCESS);
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          clearLastVideoId();
        }
      }
      setIsRestoringSession(false);
    };

    restoreSession();
  }, []);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          if (!(await window.aistudio.hasSelectedApiKey())) {
            setShowApiKeyDialog(true);
          }
        } catch (error) {
          console.warn(
            'aistudio.hasSelectedApiKey check failed, assuming no key selected.',
            error,
          );
          setShowApiKeyDialog(true);
        }
      }
    };
    checkApiKey();
  }, []);

  const showStatusError = (message: string) => {
    setErrorMessage(message);
    setAppState(AppState.ERROR);
  };

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    if (window.aistudio) {
      try {
        if (!(await window.aistudio.hasSelectedApiKey())) {
          setShowApiKeyDialog(true);
          return;
        }
      } catch (error) {
        console.warn(
          'aistudio.hasSelectedApiKey check failed, assuming no key selected.',
          error,
        );
        setShowApiKeyDialog(true);
        return;
      }
    }

    setAppState(AppState.LOADING);
    setErrorMessage(null);
    setLastConfig(params);
    setInitialFormValues(null);

    try {
      const {objectUrl, blob, video} = await generateVideo(params);
      
      // Auto-save to history and localStorage session
      await saveVideo(params, blob, video);

      setVideoUrl(objectUrl);
      setLastVideoBlob(blob);
      setLastVideoObject(video);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error('Video generation failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';

      let userFriendlyMessage = `Video generation failed: ${errorMessage}`;
      let shouldOpenDialog = false;

      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('Requested entity was not found.')) {
          userFriendlyMessage =
            'Model not found. Please check your API key.';
          shouldOpenDialog = true;
        } else if (
          errorMessage.includes('API_KEY_INVALID') ||
          errorMessage.toLowerCase().includes('permission denied')
        ) {
          userFriendlyMessage =
            'Your API key is invalid or lacks permissions.';
          shouldOpenDialog = true;
        }
      }

      setErrorMessage(userFriendlyMessage);
      setAppState(AppState.ERROR);

      if (shouldOpenDialog) {
        setShowApiKeyDialog(true);
      }
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastConfig) {
      handleGenerate(lastConfig);
    }
  }, [lastConfig, handleGenerate]);

  const handleApiKeyDialogContinue = async () => {
    setShowApiKeyDialog(false);
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
    if (appState === AppState.ERROR && lastConfig) {
      handleRetry();
    }
  };

  const handleNewVideo = useCallback(() => {
    // Cleanup old URL to avoid memory leaks
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    clearLastVideoId(); // Clear session
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setErrorMessage(null);
    setLastConfig(null);
    setLastVideoObject(null);
    setLastVideoBlob(null);
    setInitialFormValues(null);
  }, [videoUrl]);

  const handleTryAgainFromError = useCallback(() => {
    if (lastConfig) {
      setInitialFormValues(lastConfig);
      setAppState(AppState.IDLE);
      setErrorMessage(null);
    } else {
      handleNewVideo();
    }
  }, [lastConfig, handleNewVideo]);

  const handleExtend = useCallback(async () => {
    if (lastConfig && lastVideoBlob && lastVideoObject) {
      try {
        const file = new File([lastVideoBlob], 'last_video.mp4', {
          type: lastVideoBlob.type,
        });
        const videoFile: VideoFile = {file, base64: ''};

        setInitialFormValues({
          ...lastConfig,
          mode: GenerationMode.EXTEND_VIDEO,
          prompt: '',
          inputVideo: videoFile,
          inputVideoObject: lastVideoObject,
          resolution: Resolution.P720,
          startFrame: null,
          endFrame: null,
          referenceImages: [],
          styleImage: null,
          isLooping: false,
        });

        setAppState(AppState.IDLE);
        setVideoUrl(null);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to process video for extension:', error);
        showStatusError(`Failed to prepare video extension: ${error}`);
      }
    }
  }, [lastConfig, lastVideoBlob, lastVideoObject]);

  const handleLoadFromHistory = useCallback((storedVideo: StoredVideo) => {
    // Cleanup previous
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    const newObjectUrl = URL.createObjectURL(storedVideo.blob);
    setVideoUrl(newObjectUrl);
    setLastVideoBlob(storedVideo.blob);
    setLastConfig(storedVideo.params);
    setLastVideoObject(storedVideo.videoObject || null);
    
    // Update pointer to this video
    try {
      localStorage.setItem('veo_last_video_id', storedVideo.id);
    } catch (e) {}

    setShowHistoryDialog(false);
    setAppState(AppState.SUCCESS);
  }, [videoUrl]);

  const renderError = (message: string) => (
    <div className="text-center bg-[#fffdf0] border-4 border-red-300 p-8 rounded-lg shadow-[0_4px_0_rgb(252,165,165)] rotate-1 max-w-lg mx-auto mt-8">
      <h2 className="text-3xl font-bold text-red-700 mb-4">Correction Needed!</h2>
      <p className="text-[#5d4037] text-xl font-medium mb-6">{message}</p>
      <button
        onClick={handleTryAgainFromError}
        className="btn-wood px-6 py-3 rounded-lg text-lg">
        Try Again
      </button>
    </div>
  );

  if (isRestoringSession) {
    return <LoadingIndicator />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden relative">
      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />
      )}
      
      {showHistoryDialog && (
        <HistoryDialog 
          onClose={() => setShowHistoryDialog(false)} 
          onSelect={handleLoadFromHistory}
        />
      )}
      
      {/* Blackboard Header */}
      <header className="relative z-20 bg-[#2f4f4f] border-b-[12px] border-[#5d4037] shadow-lg pt-8 pb-6 px-4">
        {/* Chalk tray effect */}
        <div className="max-w-4xl mx-auto flex flex-col items-center relative">
          
          <div className="border-b-2 border-dashed border-white/30 pb-2 mb-2 w-full max-w-md text-center">
             <h1 className="text-5xl md:text-7xl font-bold text-[#f5f5f5] tracking-widest drop-shadow-md" style={{ fontFamily: '"Patrick Hand", cursive' }}>
              Veo Studio
            </h1>
          </div>
          <p className="text-[#a5d6a7] text-xl font-medium tracking-wide">Classroom Edition</p>

          {/* History Button (Absolute positioned on desktop, static on mobile) */}
          <button 
            onClick={() => setShowHistoryDialog(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 md:translate-y-0 hidden md:flex flex-col items-center gap-1 group"
            aria-label="Class Records"
          >
             <div className="bg-[#5d4037] p-2 rounded-lg border-2 border-[#8d6e63] shadow-md group-hover:scale-105 transition-transform">
               <BookOpenIcon className="w-8 h-8 text-[#fff9c4]" />
             </div>
             <span className="text-[#a5d6a7] text-sm font-bold opacity-80 group-hover:opacity-100">Records</span>
          </button>
        </div>
      </header>

      {/* Mobile History Button (Floating) */}
      <button 
          onClick={() => setShowHistoryDialog(true)}
          className="md:hidden fixed bottom-6 right-6 z-50 bg-[#5d4037] text-[#fff9c4] p-4 rounded-full shadow-xl border-4 border-[#8d6e63] hover:scale-110 transition-transform"
          aria-label="Open History"
      >
        <BookOpenIcon className="w-6 h-6" />
      </button>

      <main className="w-full max-w-5xl mx-auto flex-grow flex flex-col p-4 md:p-8 relative z-10">
        
        {/* IDLE STATE: The Podium Form */}
        {appState === AppState.IDLE && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="relative text-center mb-6 group">
                <h2 className="text-3xl md:text-4xl text-[#5d4037] font-bold rotate-1">
                  Today's Assignment
                </h2>
                <CurvedArrowDownIcon className="hidden md:block absolute top-full left-1/2 -translate-x-1/2 mt-1 w-12 h-12 text-[#8d6e63] opacity-60" />
              </div>

             {/* The Podium / Desk */}
             <div className="w-full max-w-4xl">
               {/* Desk Top Surface */}
               <div className="bg-[#8d6e63] rounded-t-2xl p-3 md:p-4 shadow-xl border-b-0 border-[#5d4037]">
                 <div className="bg-[#a1887f] rounded-xl p-6 border-2 border-[#795548] shadow-inner">
                    <PromptForm
                      onGenerate={handleGenerate}
                      initialValues={initialFormValues}
                    />
                 </div>
               </div>
               {/* Desk Body/Legs implication */}
               <div className="h-4 bg-[#5d4037] rounded-b-lg shadow-lg mx-4"></div>
             </div>
          </div>
        )}

        {/* LOADING STATE */}
        {appState === AppState.LOADING && (
          <div className="flex-grow flex flex-col items-center justify-center py-12">
            <LoadingIndicator />
          </div>
        )}

        {/* SUCCESS STATE: Projector Screen */}
        {appState === AppState.SUCCESS && (
          <div className="flex-grow flex flex-col items-center justify-center py-8 animate-in zoom-in-95 duration-500">
             {videoUrl ? (
               <VideoResult
                 videoUrl={videoUrl}
                 onRetry={handleRetry}
                 onNewVideo={handleNewVideo}
                 onExtend={handleExtend}
                 canExtend={lastConfig?.resolution === Resolution.P720}
               />
             ) : (
                renderError('Video generated, but the reel is missing!')
             )}
          </div>
        )}

        {/* ERROR STATE */}
        {appState === AppState.ERROR && errorMessage && (
          <div className="flex-grow flex flex-col items-center justify-center py-12">
            {renderError(errorMessage)}
          </div>
        )}

      </main>
      
      {/* Floor / Footer */}
      <footer className="mt-auto py-6 text-center text-[#5d4037] opacity-60 text-lg">
        <p>Keep the classroom clean &bull; Powered by Google Veo</p>
      </footer>
    </div>
  );
};

export default App;