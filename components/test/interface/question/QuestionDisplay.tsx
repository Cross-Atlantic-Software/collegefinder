'use client';
import { useState } from 'react';
import { Button } from '@/components/shared';
import type { Question, QuestionStatus } from '../types';

interface QuestionDisplayProps {
  question: Question;
  selectedOption: string | string[];
  questionStatus: QuestionStatus;
  loading: boolean;
  showPrevButton: boolean;
  onOptionSelect: (option: string | string[]) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onPrev: () => void;
}

export default function QuestionDisplay({
  question,
  selectedOption,
  questionStatus,
  loading,
  showPrevButton,
  onOptionSelect,
  onSubmit,
  onSkip,
  onPrev,
}: QuestionDisplayProps) {
  const [matchAnswers, setMatchAnswers] = useState<Record<string, string>>({});

  const isAnswered = selectedOption && (
    Array.isArray(selectedOption) ? selectedOption.length > 0 : selectedOption !== ''
  );

  const renderQuestionByType = () => {
    switch (question.question_type) {
      case 'mcq_single':
        return renderMCQSingle();
      case 'mcq_multiple':
        return renderMCQMultiple();
      case 'numerical':
        return renderNumerical();
      case 'paragraph':
        return renderParagraph();
      case 'assertion_reason':
        return renderAssertionReason();
      case 'match_following':
        return renderMatchFollowing();
      case 'true_false':
        return renderTrueFalse();
      case 'fill_blank':
        return renderFillBlank();
      default:
        return <div className="text-red-400">Unknown question type: {question.question_type}</div>;
    }
  };

  const renderMCQSingle = () => (
    <div className="space-y-2.5">
      {question.options.map((option) => (
        <label
          key={option.key}
          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition select-none ${
            selectedOption === option.key
              ? 'border-pink-500 bg-pink-500/10'
              : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
          }`}
        >
          <input
            type="radio"
            name="answer"
            value={option.key}
            checked={selectedOption === option.key}
            onChange={(e) => onOptionSelect(e.target.value)}
            className="sr-only"
          />
          <div
            className={`w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
              selectedOption === option.key
                ? 'border-pink-500 bg-pink-500 text-white'
                : 'border-slate-500 text-slate-400'
            }`}
          >
            {option.key}
          </div>
          <span className="text-white text-sm leading-relaxed">{option.text}</span>
        </label>
      ))}
    </div>
  );

  const renderMCQMultiple = () => {
    const selected = Array.isArray(selectedOption) ? selectedOption : [];
    const toggleOption = (key: string) => {
      if (selected.includes(key)) {
        onOptionSelect(selected.filter((k) => k !== key));
      } else {
        onOptionSelect([...selected, key]);
      }
    };

    return (
      <div className="space-y-3">
        <p className="text-sm text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">
          ℹ️ Select all correct options (one or more may be correct)
        </p>
        <div className="space-y-2.5">
          {question.options.map((option) => {
            const isSelected = selected.includes(option.key);
            return (
              <label
                key={option.key}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition select-none ${
                  isSelected
                    ? 'border-pink-500 bg-pink-500/10'
                    : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
                }`}
              >
                <input
                  type="checkbox"
                  value={option.key}
                  checked={isSelected}
                  onChange={() => toggleOption(option.key)}
                  className="sr-only"
                />
                <div
                  className={`w-8 h-8 shrink-0 rounded border-2 flex items-center justify-center font-bold text-sm ${
                    isSelected
                      ? 'border-pink-500 bg-pink-500 text-white'
                      : 'border-slate-500 text-slate-400'
                  }`}
                >
                  {isSelected ? '✓' : option.key}
                </div>
                <span className="text-white text-sm leading-relaxed">{option.text}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNumerical = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        Enter numerical answer (0–9999):
      </label>
      <input
        type="number"
        min="0"
        max="9999"
        value={selectedOption as string}
        onChange={(e) => onOptionSelect(e.target.value)}
        className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
        placeholder="Enter answer..."
      />
    </div>
  );

  const renderParagraph = () => (
    <div className="space-y-4">
      {question.paragraph_context && (
        <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700">
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
            {question.paragraph_context}
          </p>
        </div>
      )}
      {renderMCQSingle()}
    </div>
  );

  const renderAssertionReason = () => (
    <div className="space-y-4">
      <div className="bg-blue-900/20 rounded-xl p-5 border border-blue-700/50">
        <p className="text-xs font-semibold text-blue-300 uppercase mb-2">Assertion</p>
        <p className="text-white text-sm leading-relaxed">{question.assertion}</p>
      </div>
      <div className="bg-purple-900/20 rounded-xl p-5 border border-purple-700/50">
        <p className="text-xs font-semibold text-purple-300 uppercase mb-2">Reason</p>
        <p className="text-white text-sm leading-relaxed">{question.reason}</p>
      </div>
      <div className="space-y-2.5">
        {[
          { key: 'A', text: 'Both Assertion and Reason are true, and Reason is the correct explanation of Assertion' },
          { key: 'B', text: 'Both Assertion and Reason are true, but Reason is not the correct explanation of Assertion' },
          { key: 'C', text: 'Assertion is true, but Reason is false' },
          { key: 'D', text: 'Assertion is false, but Reason is true' },
          { key: 'E', text: 'Both Assertion and Reason are false' },
        ].map((option) => (
          <label
            key={option.key}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition select-none ${
              selectedOption === option.key
                ? 'border-pink-500 bg-pink-500/10'
                : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
            }`}
          >
            <input
              type="radio"
              name="answer"
              value={option.key}
              checked={selectedOption === option.key}
              onChange={(e) => onOptionSelect(e.target.value)}
              className="sr-only"
            />
            <div
              className={`w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                selectedOption === option.key
                  ? 'border-pink-500 bg-pink-500 text-white'
                  : 'border-slate-500 text-slate-400'
              }`}
            >
              {option.key}
            </div>
            <span className="text-white text-sm leading-relaxed">{option.text}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderMatchFollowing = () => {
    if (!question.match_pairs || question.match_pairs.length === 0) {
      return <div className="text-red-400">No match pairs available</div>;
    }

    return (
      <div className="space-y-4">
        {question.paragraph_context && (
          <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700 mb-4">
            <p className="text-slate-300 text-sm leading-relaxed">{question.paragraph_context}</p>
          </div>
        )}
        <p className="text-sm text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">
          ℹ️ Match items from Column A with Column B
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase">Column A</h4>
            {question.match_pairs.map((pair, idx) => (
              <div
                key={idx}
                className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-white text-sm"
              >
                {pair.left}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase">Column B</h4>
            {question.match_pairs.map((pair, idx) => (
              <select
                key={idx}
                value={matchAnswers[pair.left] || ''}
                onChange={(e) => {
                  const newAnswers = { ...matchAnswers, [pair.left]: e.target.value };
                  setMatchAnswers(newAnswers);
                  onOptionSelect(JSON.stringify(newAnswers));
                }}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              >
                <option value="">Select match...</option>
                {question.match_pairs.map((p) => (
                  <option key={p.right} value={p.right}>
                    {p.right}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTrueFalse = () => (
    <div className="space-y-2.5">
      {[
        { key: 'True', text: 'True' },
        { key: 'False', text: 'False' },
      ].map((option) => (
        <label
          key={option.key}
          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition select-none ${
            selectedOption === option.key
              ? 'border-pink-500 bg-pink-500/10'
              : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
          }`}
        >
          <input
            type="radio"
            name="answer"
            value={option.key}
            checked={selectedOption === option.key}
            onChange={(e) => onOptionSelect(e.target.value)}
            className="sr-only"
          />
          <div
            className={`w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
              selectedOption === option.key
                ? 'border-pink-500 bg-pink-500 text-white'
                : 'border-slate-500 text-slate-400'
            }`}
          >
            {option.key[0]}
          </div>
          <span className="text-white text-sm leading-relaxed font-medium">{option.text}</span>
        </label>
      ))}
    </div>
  );

  const renderFillBlank = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">Fill in the blank:</label>
      <input
        type="text"
        value={selectedOption as string}
        onChange={(e) => onOptionSelect(e.target.value)}
        className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
        placeholder="Enter your answer..."
      />
    </div>
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Question meta */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold bg-pink-600/20 text-pink-300 px-2.5 py-1 rounded-full">
            {question.subject}
          </span>
          <span className="text-xs bg-blue-600/20 text-blue-300 px-2.5 py-1 rounded-full capitalize">
            {question.difficulty}
          </span>
          <span className="text-xs bg-purple-600/20 text-purple-300 px-2.5 py-1 rounded-full capitalize">
            {question.question_type.replace('_', ' ')}
          </span>
          <span className="text-xs text-slate-400">
            +{question.marks} marks · -{question.negative_marks} neg
          </span>
          {questionStatus === 'answered' && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">
              ✓ Answered
            </span>
          )}
          {questionStatus === 'not_answered' && (
            <span className="text-xs text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full">
              Skipped
            </span>
          )}
        </div>

        {/* Diagram image */}
        {question.image_url && (
          <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
            <img
              src={question.image_url}
              alt="Question diagram"
              className="w-full max-h-72 object-contain"
            />
          </div>
        )}

        {/* Question text */}
        {question.question_type !== 'assertion_reason' && (
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
              {question.question_text}
            </p>
          </div>
        )}

        {/* Render question type specific UI */}
        {renderQuestionByType()}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="flex gap-2">
            {showPrevButton && (
              <Button onClick={onPrev} variant="themeButtonOutline" disabled={loading} size="sm">
                ← Prev
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={onSkip} variant="themeButtonOutline" disabled={loading} size="sm">
              Skip →
            </Button>
            <Button
              onClick={onSubmit}
              variant="themeButton"
              disabled={!isAnswered || loading || questionStatus === 'answered'}
              size="sm"
            >
              {loading
                ? 'Saving…'
                : questionStatus === 'answered'
                  ? 'Answered ✓'
                  : 'Save & Next →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
