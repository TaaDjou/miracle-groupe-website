import { useTranslation } from 'react-i18next';

export const emptyQuestion = () => ({ questionText: '', options: ['', ''], correctOptionIndex: 0 });

// Reusable question/option editor for a { questions, passingScore } quiz object.
// Used both for a lesson's quiz and a course's final exam.
// idPrefix must be unique per QuizEditor instance on the page - it namespaces the
// "correct answer" radio groups so multiple editors (e.g. one per lesson) don't
// interfere with each other's selections.
function QuizEditor({ quiz, onChange, idPrefix = 'quiz' }) {
  const { t } = useTranslation();
  const addQuestion = () => onChange({ ...quiz, questions: [...quiz.questions, emptyQuestion()] });

  const removeQuestion = (qIndex) =>
    onChange({ ...quiz, questions: quiz.questions.filter((_, i) => i !== qIndex) });

  const updateQuestion = (qIndex, field, value) =>
    onChange({
      ...quiz,
      questions: quiz.questions.map((q, i) => (i === qIndex ? { ...q, [field]: value } : q)),
    });

  const updateOption = (qIndex, oIndex, value) =>
    onChange({
      ...quiz,
      questions: quiz.questions.map((q, i) => {
        if (i !== qIndex) return q;
        const options = [...q.options];
        options[oIndex] = value;
        return { ...q, options };
      }),
    });

  const addOption = (qIndex) =>
    onChange({
      ...quiz,
      questions: quiz.questions.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, ''] } : q)),
    });

  return (
    <div>
      {quiz.questions.map((q, qIndex) => (
        <div key={qIndex} className="quiz-question">
          <div className="form-row">
            <label>
              {t('courseBuilder.question')}
              <input value={q.questionText} onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)} />
            </label>
            <button type="button" className="btn-danger" onClick={() => removeQuestion(qIndex)}>
              {t('courseBuilder.removeQuestion')}
            </button>
          </div>
          {q.options.map((option, oIndex) => (
            <div key={oIndex} className="quiz-option">
              <input
                type="radio"
                name={`correct-${idPrefix}-${qIndex}`}
                checked={q.correctOptionIndex === oIndex}
                onChange={() => updateQuestion(qIndex, 'correctOptionIndex', oIndex)}
                title={t('courseBuilder.markCorrectAnswer')}
              />
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                placeholder={t('courseBuilder.optionPlaceholder', { number: oIndex + 1 })}
              />
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={() => addOption(qIndex)}>
            {t('courseBuilder.addOption')}
          </button>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={addQuestion}>
        {t('courseBuilder.addQuestion')}
      </button>
    </div>
  );
}

export default QuizEditor;
