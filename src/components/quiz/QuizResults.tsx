import { motion } from 'framer-motion';
import { Trophy, Target, RotateCcw, ArrowRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Confetti } from '@/components/common/Confetti';
import { useLanguage } from '@/contexts/LanguageContext';
import type { QuizQuestion, QuizResult } from '@/hooks/useQuiz';
import { cn } from '@/lib/utils';

interface QuizResultsProps {
  result: QuizResult;
  questions: QuizQuestion[];
  onRetry: () => void;
  onContinue: () => void;
}

export function QuizResults({ result, questions, onRetry, onContinue }: QuizResultsProps) {
  const { language, t } = useLanguage();
  const percentage = Math.round((result.score / result.totalQuestions) * 100);

  return (
    <div className="relative">
      <Confetti isActive={result.passed} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        {/* Score Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className={cn(
              'mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full',
              result.passed 
                ? 'bg-green-500/20 text-green-500' 
                : 'bg-destructive/20 text-destructive'
            )}
          >
            {result.passed ? (
              <Trophy className="h-12 w-12" />
            ) : (
              <Target className="h-12 w-12" />
            )}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-2 text-2xl font-bold"
          >
            {result.passed 
              ? (language === 'ar' ? 'أحسنت! 🎉' : 'Great Job! 🎉')
              : (language === 'ar' ? 'استمر في المحاولة!' : 'Keep Trying!')}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground"
          >
            {result.passed
              ? (language === 'ar' 
                  ? 'لقد اجتزت الاختبار بنجاح'
                  : 'You passed the quiz successfully')
              : (language === 'ar'
                  ? 'تحتاج إلى 70% للنجاح. راجع المادة وحاول مرة أخرى.'
                  : 'You need 70% to pass. Review the material and try again.')}
          </motion.p>
        </div>

        {/* Score Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {language === 'ar' ? 'النتيجة' : 'Score'}
                </span>
                <span className="text-3xl font-bold">{percentage}%</span>
              </div>
              <Progress 
                value={percentage} 
                className={cn(
                  'h-3',
                  result.passed ? '[&>div]:bg-green-500' : '[&>div]:bg-destructive'
                )} 
              />
              <p className="mt-3 text-center text-sm text-muted-foreground">
                {language === 'ar'
                  ? `${result.score} من ${result.totalQuestions} إجابات صحيحة`
                  : `${result.score} of ${result.totalQuestions} correct answers`}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Answer Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold">
            {language === 'ar' ? 'مراجعة الإجابات' : 'Answer Review'}
          </h3>
          
          <div className="space-y-3">
            {questions.map((question, index) => {
              const answer = result.answers[index];
              return (
                <Card key={index} className={cn(
                  'border-l-4',
                  answer.isCorrect ? 'border-l-green-500' : 'border-l-destructive'
                )}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start gap-3">
                      <div className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                        answer.isCorrect ? 'bg-green-500' : 'bg-destructive'
                      )}>
                        {answer.isCorrect ? (
                          <Check className="h-3 w-3 text-white" />
                        ) : (
                          <X className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <p className="text-sm font-medium">{question.question}</p>
                    </div>
                    
                    {!answer.isCorrect && (
                      <div className="ml-8 mt-2 rounded-lg bg-muted p-3">
                        <p className="text-xs text-muted-foreground">
                          {language === 'ar' ? 'الإجابة الصحيحة:' : 'Correct answer:'}{' '}
                          <span className="font-medium text-foreground">
                            {question.options[question.correct_index]}
                          </span>
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                    {answer.isCorrect && question.explanation && (
                      <div className="ml-8 mt-2 rounded-lg bg-muted/70 p-3">
                        <p className="text-xs text-muted-foreground">
                          {language === 'ar' ? 'شرح:' : 'Explanation:'}{' '}
                          <span className="text-foreground">{question.explanation}</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4"
        >
          {!result.passed && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onRetry}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
            </Button>
          )}
          <Button
            className={cn('flex-1', result.passed && 'btn-glow')}
            onClick={onContinue}
          >
            {result.passed ? (
              <>
                {language === 'ar' ? 'إكمال الأسبوع' : 'Complete Week'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              language === 'ar' ? 'إغلاق' : 'Close'
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
