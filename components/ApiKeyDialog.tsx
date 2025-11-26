/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { KeyIcon } from './icons';

interface ApiKeyDialogProps {
  onContinue: () => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Blackboard/Slate Style Modal */}
      <div className="bg-[#2f4f4f] border-[16px] border-[#5d4037] rounded-sm shadow-2xl max-w-lg w-full p-8 text-center flex flex-col items-center relative">
        {/* Wood grain effect on border via CSS box-shadow or simple solid color for now */}
        
        <div className="bg-white/10 p-4 rounded-full mb-6 border-2 border-white/20 border-dashed">
          <KeyIcon className="w-12 h-12 text-white" />
        </div>
        
        <h2 className="text-4xl font-bold text-[#f5f5f5] mb-4 tracking-wide" style={{ fontFamily: '"Patrick Hand", cursive' }}>
          Class Permission Slip
        </h2>
        
        <p className="text-[#e0f2f1] mb-6 text-xl leading-relaxed font-medium">
          Veo is a premium tool. To proceed with this lesson, you need an API key from a paid Google Cloud project.
        </p>
        
        <div className="w-full h-0.5 bg-white/20 mb-6"></div>

        <p className="text-[#b2dfdb] mb-8 text-lg w-full">
          Please read: {' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#ffd54f] hover:underline decoration-2 underline-offset-4"
          >
            enabling billing
          </a>{' '}
          & {' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/pricing#veo-3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#ffd54f] hover:underline decoration-2 underline-offset-4"
          >
            Veo pricing
          </a>.
        </p>
        
        <button
          onClick={onContinue}
          className="w-full px-6 py-4 bg-[#8d6e63] hover:bg-[#795548] text-white font-bold rounded-lg transition-all border-b-4 border-[#5d4037] active:border-b-0 active:translate-y-1 text-2xl tracking-wide shadow-lg"
        >
          I Have My Key!
        </button>
      </div>
    </div>
  );
};

export default ApiKeyDialog;