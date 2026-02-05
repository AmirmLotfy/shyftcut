import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuestionCardProps {
  question: string;
  options: string[];
  selectedIndex: number | undefined;
  correctIndex?: number;
  showResult?: boolean;
  onSelect: (index: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionCard({
  question,
  options,
  selectedIndex,
  correctIndex,
  showResult = false,
  onSelect,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const { language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full"
    >
      {/* Question Header */}
      <div className="mb-6">
        <span className="text-sm font-medium text-muted-foreground">
          {language === 'ar' 
            ? `السؤال ${questionNumber} من ${totalQuestions}`
            : `Question ${questionNumber} of ${totalQuestions}`}
        </span>
        <h3 className="mt-2 text-xl font-semibold leading-relaxed">{question}</h3>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = correctIndex === index;
          const isWrong = showResult && isSelected && !isCorrect;

          return (
            <motion.button
              key={index}
              whileHover={!showResult ? { scale: 1.01 } : undefined}
              whileTap={!showResult ? { scale: 0.99 } : undefined}
              onClick={() => !showResult && onSelect(index)}
              disabled={showResult}
              className={cn(
                'w-full rounded-xl border-2 p-4 text-left transition-all',
                'flex items-center gap-4',
                !showResult && !isSelected && 'border-border hover:border-primary/50 hover:bg-muted/50',
                !showResult && isSelected && 'border-primary bg-primary/10',
                showResult && isCorrect && 'border-green-500 bg-green-500/10',
                showResult && isWrong && 'border-destructive bg-destructive/10',
                showResult && !isCorrect && !isWrong && 'border-border opacity-60'
              )}
            >
              {/* Option Letter */}
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                !showResult && !isSelected && 'border-muted-foreground/30 text-muted-foreground',
                !showResult && isSelected && 'border-primary bg-primary text-primary-foreground',
                showResult && isCorrect && 'border-green-500 bg-green-500 text-white',
                showResult && isWrong && 'border-destructive bg-destructive text-white'
              )}>
                {showResult && isCorrect ? (
                  <Check className="h-4 w-4" />
                ) : showResult && isWrong ? (
                  <X className="h-4 w-4" />
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </div>

              {/* Option Text */}
              <span className={cn(
                'flex-1 text-base',
                showResult && isCorrect && 'font-medium text-green-700 dark:text-green-400',
                showResult && isWrong && 'text-destructive'
              )}>
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
