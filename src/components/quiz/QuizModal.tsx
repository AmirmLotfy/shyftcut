import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { QuestionCard } from './QuestionCard';
import { QuizResults } from './QuizResults';
import { useQuiz } from '@/hooks/useQuiz';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekId: string;
  weekTitle: string;
  skills: string[];
  onComplete: () => void;
}

export function QuizModal({ 
  isOpen, 
  onClose, 
  weekId, 
  weekTitle, 
  skills,
  onComplete 
}: QuizModalProps) {
  const { language, direction } = useLanguage();
  const {
    questions,
    currentQuestionIndex,
    currentQuestion,
    selectedAnswers,
    quizResult,
    isGenerating,
    generateError,
    generateQuiz,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    resetQuiz,
    isComplete,
  } = useQuiz();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate quiz when modal opens
  useEffect(() => {
    if (isOpen && questions.length === 0 && !isGenerating) {
      generateQuiz({ weekId, skills, weekTitle });
    }
  }, [isOpen, weekId, skills, weekTitle, questions.length, isGenerating, generateQuiz]);

  const handleClose = () => {
    resetQuiz();
    onClose();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitQuiz(weekId);
    setIsSubmitting(false);
  };

  const handleContinue = () => {
    if (quizResult?.passed) {
      onComplete();
    }
    handleClose();
  };

  const handleRetry = () => {
    resetQuiz();
    generateQuiz({ weekId, skills, weekTitle });
  };

  const progress = questions.length > 0 
    ? ((currentQuestionIndex + 1) / questions.length) * 100 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" aria-describedby="quiz-modal-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {language === 'ar' ? 'اختبار الأسبوع' : 'Weekly Quiz'}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {weekTitle}
              </span>
            </span>
          </DialogTitle>
          <DialogDescription id="quiz-modal-desc" className="sr-only">
            {language === 'ar' ? 'اختبار أسبوعي للمهارات' : 'Weekly skills quiz'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Loading State */}
          {isGenerating && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'جاري إنشاء الاختبار...'
                  : 'Generating your quiz...'}
              </p>
            </div>
          )}

          {/* Generate Error State */}
          {!isGenerating && generateError && questions.length === 0 && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 py-8">
              <p className="text-sm text-destructive text-center">
                {generateError instanceof Error ? generateError.message : (language === 'ar' ? 'فشل في إنشاء الاختبار' : 'Failed to generate quiz')}
              </p>
              <Button onClick={handleRetry} variant="outline">
                {language === 'ar' ? 'إعادة المحاولة' : 'Try again'}
              </Button>
            </div>
          )}

          {/* Quiz Content */}
          {!isGenerating && questions.length > 0 && !quizResult && (
            <div className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-center text-xs text-muted-foreground">
                  {language === 'ar'
                    ? `السؤال ${currentQuestionIndex + 1} من ${questions.length}`
                    : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                </p>
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                {currentQuestion && (
                  <QuestionCard
                    key={currentQuestionIndex}
                    question={currentQuestion.question}
                    options={currentQuestion.options}
                    selectedIndex={selectedAnswers[currentQuestionIndex]}
                    onSelect={(index) => selectAnswer(currentQuestionIndex, index)}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                  />
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={cn(direction === 'rtl' && 'flex-row-reverse')}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!isComplete || isSubmitting}
                    className="btn-glow min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      language === 'ar' ? 'إرسال' : 'Submit'
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={nextQuestion}
                    disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    className={cn(direction === 'rtl' && 'flex-row-reverse')}
                  >
                    {language === 'ar' ? 'التالي' : 'Next'}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {quizResult && (
            <QuizResults
              result={quizResult}
              questions={questions}
              onRetry={handleRetry}
              onContinue={handleContinue}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
