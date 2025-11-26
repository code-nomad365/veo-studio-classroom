/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  AspectRatio,
  GenerateVideoParams,
  GenerationMode,
  ImageFile,
  Resolution,
  VeoModel,
  VideoFile,
} from '../types';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  FilmIcon,
  FramesModeIcon,
  PlusIcon,
  RectangleStackIcon,
  ReferencesModeIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TextModeIcon,
  TvIcon,
  XMarkIcon,
} from './icons';

const aspectRatioDisplayNames: Record<AspectRatio, string> = {
  [AspectRatio.LANDSCAPE]: 'Landscape (16:9)',
  [AspectRatio.PORTRAIT]: 'Portrait (9:16)',
};

const modeIcons: Record<GenerationMode, React.ReactNode> = {
  [GenerationMode.TEXT_TO_VIDEO]: <TextModeIcon className="w-5 h-5" />,
  [GenerationMode.FRAMES_TO_VIDEO]: <FramesModeIcon className="w-5 h-5" />,
  [GenerationMode.REFERENCES_TO_VIDEO]: (
    <ReferencesModeIcon className="w-5 h-5" />
  ),
  [GenerationMode.EXTEND_VIDEO]: <FilmIcon className="w-5 h-5" />,
};

const fileToBase64 = <T extends {file: File; base64: string}>(
  file: File,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (base64) {
        resolve({file, base64} as T);
      } else {
        reject(new Error('Failed to read file as base64.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
const fileToImageFile = (file: File): Promise<ImageFile> =>
  fileToBase64<ImageFile>(file);
const fileToVideoFile = (file: File): Promise<VideoFile> =>
  fileToBase64<VideoFile>(file);

const CustomSelect: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({label, value, onChange, icon, children, disabled = false}) => (
  <div className={`p-2 rounded-lg border-2 ${disabled ? 'bg-gray-100 border-gray-200 opacity-50' : 'bg-[#fffdf0] border-[#d7ccc8]'} shadow-sm`}>
    <label
      className={`text-sm block mb-1 font-bold tracking-wide ${
        disabled ? 'text-gray-400' : 'text-[#5d4037]'
      }`}>
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-[#8d6e63]">
        {icon}
      </div>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-transparent border-b-2 border-dashed border-[#a1887f] rounded-none pl-9 pr-8 py-2 appearance-none focus:ring-0 focus:border-[#5d4037] text-[#3e2723] font-bold text-lg disabled:cursor-not-allowed cursor-pointer">
        {children}
      </select>
      <ChevronDownIcon
        className={`w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
          disabled ? 'text-gray-300' : 'text-[#8d6e63]'
        }`}
      />
    </div>
  </div>
);

const ImageUpload: React.FC<{
  onSelect: (image: ImageFile) => void;
  onRemove?: () => void;
  image?: ImageFile | null;
  label: React.ReactNode;
}> = ({onSelect, onRemove, image, label}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageFile = await fileToImageFile(file);
        onSelect(imageFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  if (image) {
    return (
      <div className="relative w-32 h-28 group shadow-md rotate-1 bg-white p-2 rounded-sm border border-gray-200">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#e0e0e0]/50 rounded-full z-10"></div>
        <img
          src={URL.createObjectURL(image.file)}
          alt="preview"
          className="w-full h-full object-cover border border-gray-100"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-red-600 border-2 border-white"
          aria-label="Remove image">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="w-32 h-28 bg-[#fffdf0] hover:bg-[#fff9c4] border-2 border-dashed border-[#8d6e63] rounded-lg flex flex-col items-center justify-center text-[#8d6e63] hover:text-[#5d4037] transition-all shadow-sm group">
      <div className="bg-[#efebe9] p-2 rounded-full mb-1 group-hover:scale-110 transition-transform">
         <PlusIcon className="w-6 h-6" />
      </div>
      <span className="text-sm font-bold leading-tight px-1">{label}</span>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </button>
  );
};

const VideoUpload: React.FC<{
  onSelect: (video: VideoFile) => void;
  onRemove?: () => void;
  video?: VideoFile | null;
  label: React.ReactNode;
}> = ({onSelect, onRemove, video, label}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const videoFile = await fileToVideoFile(file);
        onSelect(videoFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
  };

  if (video) {
    return (
      <div className="relative w-48 h-28 group shadow-lg -rotate-1 bg-white p-2 rounded-sm border border-gray-200">
        <video
          src={URL.createObjectURL(video.file)}
          muted
          loop
          className="w-full h-full object-cover bg-black"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-red-600 border-2 border-white"
          aria-label="Remove video">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="w-48 h-28 bg-[#fffdf0] hover:bg-[#fff9c4] border-2 border-dashed border-[#8d6e63] rounded-lg flex flex-col items-center justify-center text-[#8d6e63] hover:text-[#5d4037] transition-all shadow-sm group">
      <div className="bg-[#efebe9] p-2 rounded-full mb-1 group-hover:scale-110 transition-transform">
        <PlusIcon className="w-6 h-6" />
      </div>
      <span className="text-sm font-bold mt-1 px-2">{label}</span>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />
    </button>
  );
};

interface PromptFormProps {
  onGenerate: (params: GenerateVideoParams) => void;
  initialValues?: GenerateVideoParams | null;
}

const PromptForm: React.FC<PromptFormProps> = ({
  onGenerate,
  initialValues,
}) => {
  const [prompt, setPrompt] = useState(initialValues?.prompt ?? '');
  const [model, setModel] = useState<VeoModel>(
    initialValues?.model ?? VeoModel.VEO_FAST,
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    initialValues?.aspectRatio ?? AspectRatio.LANDSCAPE,
  );
  const [resolution, setResolution] = useState<Resolution>(
    initialValues?.resolution ?? Resolution.P720,
  );
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    initialValues?.mode ?? GenerationMode.TEXT_TO_VIDEO,
  );
  const [startFrame, setStartFrame] = useState<ImageFile | null>(
    initialValues?.startFrame ?? null,
  );
  const [endFrame, setEndFrame] = useState<ImageFile | null>(
    initialValues?.endFrame ?? null,
  );
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>(
    initialValues?.referenceImages ?? [],
  );
  const [styleImage, setStyleImage] = useState<ImageFile | null>(
    initialValues?.styleImage ?? null,
  );
  const [inputVideo, setInputVideo] = useState<VideoFile | null>(
    initialValues?.inputVideo ?? null,
  );
  const [inputVideoObject, setInputVideoObject] = useState<Video | null>(
    initialValues?.inputVideoObject ?? null,
  );
  const [isLooping, setIsLooping] = useState(initialValues?.isLooping ?? false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialValues) {
      setPrompt(initialValues.prompt ?? '');
      setModel(initialValues.model ?? VeoModel.VEO_FAST);
      setAspectRatio(initialValues.aspectRatio ?? AspectRatio.LANDSCAPE);
      setResolution(initialValues.resolution ?? Resolution.P720);
      setGenerationMode(initialValues.mode ?? GenerationMode.TEXT_TO_VIDEO);
      setStartFrame(initialValues.startFrame ?? null);
      setEndFrame(initialValues.endFrame ?? null);
      setReferenceImages(initialValues.referenceImages ?? []);
      setStyleImage(initialValues.styleImage ?? null);
      setInputVideo(initialValues.inputVideo ?? null);
      setInputVideoObject(initialValues.inputVideoObject ?? null);
      setIsLooping(initialValues.isLooping ?? false);
    }
  }, [initialValues]);

  useEffect(() => {
    if (generationMode === GenerationMode.REFERENCES_TO_VIDEO) {
      setModel(VeoModel.VEO);
      setAspectRatio(AspectRatio.LANDSCAPE);
      setResolution(Resolution.P720);
    } else if (generationMode === GenerationMode.EXTEND_VIDEO) {
      setResolution(Resolution.P720);
    }
  }, [generationMode]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modeSelectorRef.current &&
        !modeSelectorRef.current.contains(event.target as Node)
      ) {
        setIsModeSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onGenerate({
        prompt,
        model,
        aspectRatio,
        resolution,
        mode: generationMode,
        startFrame,
        endFrame,
        referenceImages,
        styleImage,
        inputVideo,
        inputVideoObject,
        isLooping,
      });
    },
    [
      prompt,
      model,
      aspectRatio,
      resolution,
      generationMode,
      startFrame,
      endFrame,
      referenceImages,
      styleImage,
      inputVideo,
      inputVideoObject,
      onGenerate,
      isLooping,
    ],
  );

  const handleSelectMode = (mode: GenerationMode) => {
    setGenerationMode(mode);
    setIsModeSelectorOpen(false);
    setStartFrame(null);
    setEndFrame(null);
    setReferenceImages([]);
    setStyleImage(null);
    setInputVideo(null);
    setInputVideoObject(null);
    setIsLooping(false);
  };

  const promptPlaceholder = {
    [GenerationMode.TEXT_TO_VIDEO]: 'Write your story here...',
    [GenerationMode.FRAMES_TO_VIDEO]:
      'Describe movement between start/end frames...',
    [GenerationMode.REFERENCES_TO_VIDEO]:
      'Describe video based on the reference images...',
    [GenerationMode.EXTEND_VIDEO]: 'And then what happened?',
  }[generationMode];

  const selectableModes = [
    GenerationMode.TEXT_TO_VIDEO,
    GenerationMode.FRAMES_TO_VIDEO,
    GenerationMode.REFERENCES_TO_VIDEO,
  ];

  const renderMediaUploads = () => {
    if (generationMode === GenerationMode.FRAMES_TO_VIDEO) {
      return (
        <div className="mb-4 p-4 bg-[#8d6e63]/20 rounded-xl border-2 border-dashed border-[#8d6e63] flex flex-col items-center justify-center gap-4">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <ImageUpload
              label="Start Frame"
              image={startFrame}
              onSelect={setStartFrame}
              onRemove={() => {
                setStartFrame(null);
                setIsLooping(false);
              }}
            />
            {!isLooping && (
              <ImageUpload
                label="End Frame"
                image={endFrame}
                onSelect={setEndFrame}
                onRemove={() => setEndFrame(null)}
              />
            )}
          </div>
          {startFrame && !endFrame && (
            <div className="mt-2 flex items-center bg-[#fffdf0] px-3 py-1 rounded-full border border-[#d7ccc8]">
              <input
                id="loop-video-checkbox"
                type="checkbox"
                checked={isLooping}
                onChange={(e) => setIsLooping(e.target.checked)}
                className="w-5 h-5 text-[#5d4037] bg-white border-[#8d6e63] rounded focus:ring-[#5d4037] cursor-pointer"
              />
              <label
                htmlFor="loop-video-checkbox"
                className="ml-2 text-md font-bold text-[#3e2723] cursor-pointer">
                Loop it!
              </label>
            </div>
          )}
        </div>
      );
    }
    if (generationMode === GenerationMode.REFERENCES_TO_VIDEO) {
      return (
        <div className="mb-4 p-4 bg-[#8d6e63]/20 rounded-xl border-2 border-dashed border-[#8d6e63] flex flex-wrap items-center justify-center gap-3">
          {referenceImages.map((img, index) => (
            <ImageUpload
              key={index}
              image={img}
              label=""
              onSelect={() => {}}
              onRemove={() =>
                setReferenceImages((imgs) => imgs.filter((_, i) => i !== index))
              }
            />
          ))}
          {referenceImages.length < 3 && (
            <ImageUpload
              label="Add Reference"
              onSelect={(img) => setReferenceImages((imgs) => [...imgs, img])}
            />
          )}
        </div>
      );
    }
    if (generationMode === GenerationMode.EXTEND_VIDEO) {
      return (
        <div className="mb-4 p-4 bg-[#8d6e63]/20 rounded-xl border-2 border-dashed border-[#8d6e63] flex items-center justify-center gap-4">
          <VideoUpload
            label={
              <>
                Input Video
                <br />
                (720p veo only)
              </>
            }
            video={inputVideo}
            onSelect={setInputVideo}
            onRemove={() => {
              setInputVideo(null);
              setInputVideoObject(null);
            }}
          />
        </div>
      );
    }
    return null;
  };

  const isRefMode = generationMode === GenerationMode.REFERENCES_TO_VIDEO;
  const isExtendMode = generationMode === GenerationMode.EXTEND_VIDEO;

  let isSubmitDisabled = false;
  let tooltipText = '';

  switch (generationMode) {
    case GenerationMode.TEXT_TO_VIDEO:
      isSubmitDisabled = !prompt.trim();
      if (isSubmitDisabled) {
        tooltipText = 'Please enter a prompt.';
      }
      break;
    case GenerationMode.FRAMES_TO_VIDEO:
      isSubmitDisabled = !startFrame;
      if (isSubmitDisabled) {
        tooltipText = 'A start frame is required.';
      }
      break;
    case GenerationMode.REFERENCES_TO_VIDEO:
      const hasNoRefs = referenceImages.length === 0;
      const hasNoPrompt = !prompt.trim();
      isSubmitDisabled = hasNoRefs || hasNoPrompt;
      if (hasNoRefs && hasNoPrompt) {
        tooltipText = 'Please add reference image(s) and enter a prompt.';
      } else if (hasNoRefs) {
        tooltipText = 'At least one reference image is required.';
      } else if (hasNoPrompt) {
        tooltipText = 'Please enter a prompt.';
      }
      break;
    case GenerationMode.EXTEND_VIDEO:
      isSubmitDisabled = !inputVideoObject;
      if (isSubmitDisabled) {
        tooltipText =
          'An input video from a previous generation is required to extend.';
      }
      break;
  }

  return (
    <div className="relative w-full">
      {isSettingsOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-4 p-6 bg-[#fffdf0] rounded-xl border-2 border-[#d7ccc8] shadow-xl rotate-1 z-30">
          <h3 className="text-xl font-bold text-[#5d4037] mb-4 border-b border-[#a1887f] pb-2">Project Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CustomSelect
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value as VeoModel)}
              icon={<SparklesIcon className="w-5 h-5" />}
              disabled={isRefMode}>
              {Object.values(VeoModel).map((modelValue) => (
                <option key={modelValue} value={modelValue}>
                  {modelValue}
                </option>
              ))}
            </CustomSelect>
            <CustomSelect
              label="Aspect Ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              icon={<RectangleStackIcon className="w-5 h-5" />}
              disabled={isRefMode || isExtendMode}>
              {Object.entries(aspectRatioDisplayNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </CustomSelect>
            <div>
              <CustomSelect
                label="Resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as Resolution)}
                icon={<TvIcon className="w-5 h-5" />}
                disabled={isRefMode || isExtendMode}>
                <option value={Resolution.P720}>720p</option>
                <option value={Resolution.P1080}>1080p</option>
              </CustomSelect>
              {resolution === Resolution.P1080 && (
                <p className="text-xs text-orange-800 font-bold mt-1">
                  * 1080p cannot be extended later.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="w-full">
        {renderMediaUploads()}
        <div className="flex items-end gap-3 bg-[#fffdf0] border-2 border-[#d7ccc8] rounded-xl p-3 shadow-sm relative">
          <div className="relative" ref={modeSelectorRef}>
            <button
              type="button"
              onClick={() => setIsModeSelectorOpen((prev) => !prev)}
              className="flex shrink-0 items-center gap-2 px-3 py-3 rounded-lg bg-[#efebe9] hover:bg-[#d7ccc8] text-[#5d4037] transition-colors border-b-2 border-[#a1887f]"
              aria-label="Select generation mode">
              {modeIcons[generationMode]}
              <span className="font-bold text-lg whitespace-nowrap">
                {generationMode.split(' ')[0]}...
              </span>
            </button>
            {isModeSelectorOpen && (
              <div className="absolute bottom-full mb-2 w-64 bg-[#fffdf0] border-2 border-[#d7ccc8] rounded-lg shadow-xl overflow-hidden z-30">
                {selectableModes.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleSelectMode(mode)}
                    className={`w-full text-left flex items-center gap-3 p-4 hover:bg-[#efebe9] ${generationMode === mode ? 'bg-[#d7ccc8]/30 font-bold text-[#3e2723]' : 'text-[#5d4037]'}`}>
                    {modeIcons[mode]}
                    <span>{mode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={promptPlaceholder}
            className="flex-grow bg-transparent focus:outline-none resize-none text-xl text-[#3e2723] placeholder-[#a1887f]/70 max-h-48 py-3 leading-relaxed font-medium"
            rows={1}
            style={{ minHeight: '52px' }}
          />
          <button
            type="button"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            className={`p-3 rounded-full hover:bg-[#d7ccc8] transition-colors ${isSettingsOpen ? 'bg-[#d7ccc8] text-[#3e2723]' : 'text-[#8d6e63]'}`}
            aria-label="Toggle settings">
            <SlidersHorizontalIcon className="w-6 h-6" />
          </button>
          <div className="relative group">
            <button
              type="submit"
              className="btn-wood p-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Generate video"
              disabled={isSubmitDisabled}>
              <ArrowRightIcon className="w-6 h-6" />
            </button>
            {isSubmitDisabled && tooltipText && (
              <div
                role="tooltip"
                className="absolute bottom-full right-0 mb-3 w-max max-w-xs px-4 py-2 bg-[#3e2723] text-[#fffdf0] text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                {tooltipText}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-3 px-2">
           <p className="text-xs text-[#5d4037] opacity-60 font-bold">
            * Handwritten notes are best for prompts.
           </p>
           <p className="text-xs text-[#3e2723] font-bold opacity-60">
            See{' '}
            <a
              href="https://ai.google.dev/gemini-api/docs/pricing#veo-3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#264653] hover:underline"
            >
              class pricing
            </a>
            .
          </p>
        </div>
      </form>
    </div>
  );
};

export default PromptForm;