'use client';
import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ExamFormat } from '@/api/tests';
import { TestRules } from './rules';
import { TestHeader } from './interface/header';
import { SectionNavigation, QuestionPalette } from './interface/sidebar';
import { QuestionDisplay, QuestionAreaEmpty } from './interface/question';
import { TabChangeWarning, EndTestConfirmation, TestResults } from './interface/modals';
import { useFullscreenTest } from './hooks/useFullscreenTest';
import InstructionsScreen from './interface/InstructionsScreen';

interface FullscreenTestInterfaceProps {
  exam: { id: number; name: string };
  format: ExamFormat;
  onExit: () => void;
}

function fullscreenOverlay(content: ReactNode): ReactNode {
  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}

export default function FullscreenTestInterface({ exam, format, onExit }: FullscreenTestInterfaceProps) {
  const api = useFullscreenTest({ examId: exam.id, format, onExit });
  const {
    currentSection,
    currentSubsection,
    currentQuestion,
    selectedOption,
    setSelectedOption,
    questionNumber,
    testAttemptId,
    timeRemaining,
    sectionProgress,
    loading,
    error,
    tabChangeWarning,
    setTabChangeWarning,
    isFullscreen,
    testCompleted,
    completingTest,
    showEndTestConfirm,
    setShowEndTestConfirm,
    testResults,
    totalQuestionsInSection,
    currentSectionMap,
    totalForHeader,
    startTest,
    loadQuestionForNumber,
    handleSubmitAnswer,
    handleSkip,
    handleSectionChange,
    handleSubsectionChange,
    handleCompleteTest,
    handleBackToExams,
    enterFullscreen,
    getQuestionStatuses,
  } = api;

  if (tabChangeWarning) {
    return fullscreenOverlay(<TabChangeWarning onContinue={() => setTabChangeWarning(false)} />);
  }

  if (!testAttemptId) {
    const formatRules = {
      format,
      rules: format.rules || [],
      marking_scheme: format.marking_scheme || { correct: 4, incorrect: -1, unattempted: 0 },
      sections: format.sections || {},
    };
    const handleBackFromInstructions = () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      onExit();
    };
    return fullscreenOverlay(
      <InstructionsScreen
        examName={exam.name}
        formatRules={formatRules}
        onStartTest={startTest}
        onBack={handleBackFromInstructions}
        loading={loading}
        error={error}
      />
    );
  }

  if (testCompleted && testResults) {
    return fullscreenOverlay(
      <TestResults
        examName={exam.name}
        summary={testResults.summary}
        questionAttempts={testResults.question_attempts}
        onExit={onExit}
      />
    );
  }

  if (showEndTestConfirm) {
    return fullscreenOverlay(
      <EndTestConfirmation
        completingTest={completingTest}
        error={error}
        onCancel={() => setShowEndTestConfirm(false)}
        onConfirm={handleCompleteTest}
      />
    );
  }

  return fullscreenOverlay(
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col">
      <TestHeader
        examName={exam.name}
        formatName={format.name}
        questionNumber={questionNumber}
        totalQuestions={totalForHeader}
        timeRemaining={timeRemaining}
        isFullscreen={isFullscreen}
        completingTest={completingTest}
        error={error}
        onEnterFullscreen={enterFullscreen}
        onSubmitTest={() => setShowEndTestConfirm(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <SectionNavigation
          sections={format.sections}
          currentSection={currentSection}
          sectionProgress={sectionProgress}
          currentSubsection={currentSubsection}
          onSectionChange={handleSectionChange}
          onSubsectionChange={handleSubsectionChange}
        />
        <div className="flex-1 flex flex-col min-w-0">
          {currentQuestion ? (
            <QuestionDisplay
              question={currentQuestion}
              selectedOption={selectedOption}
              questionStatus={currentSectionMap[questionNumber]?.status || 'not_visited'}
              loading={loading}
              showPrevButton={questionNumber > 1}
              onOptionSelect={setSelectedOption}
              onSubmit={handleSubmitAnswer}
              onSkip={handleSkip}
              onPrev={() => loadQuestionForNumber(questionNumber - 1)}
            />
          ) : (
            <QuestionAreaEmpty
              loading={loading}
              error={error}
              onRetry={() => loadQuestionForNumber(questionNumber || 1)}
            />
          )}
        </div>
        <QuestionPalette
          totalQuestions={totalQuestionsInSection}
          currentQuestionNumber={questionNumber}
          questionStatuses={getQuestionStatuses()}
          loading={loading}
          onQuestionSelect={loadQuestionForNumber}
        />
      </div>
    </div>
  );
}
