import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, apiPath, apiHeaders, extractApiErrorMessage } from '@/lib/api';
import { debugLog, debugError } from '@/lib/debug';
import { captureException } from '@/lib/error-tracking';

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface QuizResult {
  weekId: string;
  score: number;
  totalQuestions: number;
  answers: { questionIndex: number; selectedIndex: number; isCorrect: boolean }[];
  passed: boolean;
}

export function useQuiz() {
  const { user, getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const generateQuizMutation = useMutation({
    mutationFn: async ({ weekId, skills, weekTitle }: { weekId: string; skills: string[]; weekTitle: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(apiPath('/api/quiz/generate'), {
        method: 'POST',
        headers: apiHeaders('/api/quiz/generate', token),
        body: JSON.stringify({ weekId, skills, weekTitle }),
      });
      const text = await res.text();
      if (!res.ok) {
        let data: Record<string, unknown> = {};
        try {
          if (text.trim()) data = JSON.parse(text) as Record<string, unknown>;
        } catch {
          debugLog('useQuiz', 'quiz/generate non-JSON error body', res.status);
        }
        let msg = extractApiErrorMessage(data, res.status === 500 ? 'Quiz generation failed. Please try again.' : res.statusText);
        if (typeof msg !== 'string') msg = res.status === 500 ? 'Quiz generation failed. Please try again.' : res.statusText;
        if (res.status === 429) msg = 'Rate limit exceeded. Please try later.';
        else if (res.status === 402) msg = 'Quiz limit reached. Upgrade to Premium for unlimited quizzes.';
        throw new Error(msg);
      }
      try {
        const data = text.trim() ? (JSON.parse(text) as { questions?: QuizQuestion[] }) : { questions: [] };
        return data;
      } catch (_e) {
        debugError('useQuiz', 'quiz/generate invalid JSON', text.slice(0, 200));
        throw new Error('Invalid response from server.');
      }
    },
    onSuccess: (data) => {
      setQuestions(data.questions ?? []);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setQuizResult(null);
    },
    onError: (error) => {
      debugError('useQuiz', 'generateQuiz failed', error);
      captureException(error);
    },
  });

  const selectAnswer = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async (weekId: string) => {
    const answers = questions.map((q, index) => ({
      questionIndex: index,
      selectedIndex: selectedAnswers[index] ?? -1,
      isCorrect: selectedAnswers[index] === q.correct_index,
    }));

    const score = answers.filter(a => a.isCorrect).length;
    const passed = questions.length > 0 && (score / questions.length) >= 0.7;

    const result: QuizResult = {
      weekId,
      score,
      totalQuestions: questions.length,
      answers,
      passed,
    };

    if (user) {
      try {
        const token = await getAccessToken();
        if (token) {
          await apiFetch('/api/quiz/results', {
            method: 'POST',
            token,
            body: JSON.stringify({
            roadmap_week_id: weekId,
            score,
            total_questions: questions.length,
            answers,
            feedback: passed ? 'Great job! You passed the quiz.' : 'Keep studying and try again.',
          }),
          });
        }
      } catch (err) {
        debugLog('useQuiz', 'submit quiz results failed (best-effort)', err);
      }
    }

    setQuizResult(result);
    queryClient.invalidateQueries({ queryKey: ['roadmap'] });
    queryClient.invalidateQueries({ queryKey: ['activeRoadmap'] });

    return result;
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizResult(null);
  };

  return {
    questions,
    currentQuestionIndex,
    currentQuestion: questions[currentQuestionIndex],
    selectedAnswers,
    quizResult,
    isGenerating: generateQuizMutation.isPending,
    generateError: generateQuizMutation.error,
    generateQuiz: generateQuizMutation.mutate,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    resetQuiz,
    isComplete: Object.keys(selectedAnswers).length === questions.length,
  };
}
