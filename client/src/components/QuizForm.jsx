import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

function QuizForm({ questions, submitUrl, onPassed, passedMessage }) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectAnswer = (questionIndex, optionIndex) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (answers.some((a) => a === null)) {
      setError(t('quiz.answerAllQuestions'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post(submitUrl, { answers });
      setResult(res.data);
      if (res.data.passed) onPassed?.();
    } catch (err) {
      setError(err.response?.data?.message || t('quiz.couldNotSubmitQuiz'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="quiz-question">
          <p>
            <strong>
              {qIndex + 1}. {q.questionText}
            </strong>
          </p>
          {q.options.map((option, oIndex) => (
            <label key={oIndex} className="quiz-option">
              <input
                type="radio"
                name={`question-${qIndex}`}
                checked={answers[qIndex] === oIndex}
                onChange={() => selectAnswer(qIndex, oIndex)}
              />
              {option}
            </label>
          ))}
        </div>
      ))}

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? t('courses.submitting') : t('quiz.submitQuiz')}
      </button>

      {result && (
        <div className={`quiz-result ${result.passed ? 'passed' : 'failed'}`}>
          <p>
            {t('quiz.score', { score: result.score, correct: result.correctCount, total: result.totalQuestions })}
          </p>
          <p>
            {result.passed
              ? t('quiz.passedMessage', { message: passedMessage || t('quiz.lessonMarkedComplete') })
              : t('quiz.failedMessage')}
          </p>
        </div>
      )}
    </form>
  );
}

export default QuizForm;
