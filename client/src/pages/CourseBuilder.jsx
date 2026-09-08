import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import QuizEditor, { emptyQuestion } from '../components/QuizEditor';

const emptyLesson = () => ({ title: '', type: 'text', content: '', videoUrl: '', order: 0, quiz: null });
const emptySection = () => ({ title: '', order: 0, lessons: [] });
const emptyExam = () => ({ questions: [emptyQuestion()], passingScore: 70 });

function CourseBuilder() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'General',
    level: 'beginner',
    thumbnail: '',
    price: 0,
  });
  const [sections, setSections] = useState([]);
  const [finalExam, setFinalExam] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    api
      .get(`/courses/${id}`)
      .then((res) => {
        const c = res.data;
        setForm({
          title: c.title,
          description: c.description,
          category: c.category,
          level: c.level,
          thumbnail: c.thumbnail,
          price: c.price || 0,
        });
        setSections(c.sections);
        setFinalExam(c.finalExam || null);
      })
      .catch(() => setError(t('courseBuilder.couldNotLoadCourse')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  const updateForm = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addSection = () => setSections((prev) => [...prev, { ...emptySection(), order: prev.length }]);
  const removeSection = (sIndex) => setSections((prev) => prev.filter((_, i) => i !== sIndex));
  const updateSectionTitle = (sIndex, title) =>
    setSections((prev) => prev.map((s, i) => (i === sIndex ? { ...s, title } : s)));

  const addLesson = (sIndex) =>
    setSections((prev) =>
      prev.map((s, i) =>
        i === sIndex ? { ...s, lessons: [...s.lessons, { ...emptyLesson(), order: s.lessons.length }] } : s
      )
    );

  const removeLesson = (sIndex, lIndex) =>
    setSections((prev) =>
      prev.map((s, i) => (i === sIndex ? { ...s, lessons: s.lessons.filter((_, li) => li !== lIndex) } : s))
    );

  const updateLesson = (sIndex, lIndex, field, value) =>
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sIndex) return s;
        return {
          ...s,
          lessons: s.lessons.map((l, li) => {
            if (li !== lIndex) return l;
            const updated = { ...l, [field]: value };
            if (field === 'type') {
              updated.quiz = value === 'quiz' ? { questions: [emptyQuestion()], passingScore: 70 } : null;
            }
            return updated;
          }),
        };
      })
    );

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price) || 0, sections, finalExam };
      if (isEditing) {
        await api.put(`/courses/${id}`, payload);
      } else {
        const res = await api.post('/courses', payload);
        navigate(`/instructor/courses/${res.data._id}/edit`, { replace: true });
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('courseBuilder.couldNotSaveCourse'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>{t('courseBuilder.loadingCourse')}</p>;

  return (
    <section className="text-left">
      <h1>{isEditing ? t('courseBuilder.editTitle') : t('courseBuilder.createTitle')}</h1>
      {error && <p className="form-error">{error}</p>}

      <form onSubmit={handleSave}>
        <label>
          {t('courseBuilder.title')}
          <input name="title" value={form.title} onChange={updateForm} required />
        </label>
        <label>
          {t('courseBuilder.description')}
          <textarea name="description" value={form.description} onChange={updateForm} rows={3} />
        </label>
        <div className="form-row">
          <label>
            {t('courseBuilder.category')}
            <input name="category" value={form.category} onChange={updateForm} />
          </label>
          <label>
            {t('courseBuilder.level')}
            <select name="level" value={form.level} onChange={updateForm}>
              <option value="beginner">{t('courses.beginner')}</option>
              <option value="intermediate">{t('courses.intermediate')}</option>
              <option value="advanced">{t('courses.advanced')}</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            {t('courseBuilder.thumbnailUrl')}
            <input name="thumbnail" value={form.thumbnail} onChange={updateForm} />
          </label>
          <label>
            {t('courseBuilder.price')}
            <input type="number" name="price" min={0} step="0.01" value={form.price} onChange={updateForm} />
          </label>
        </div>

        <h2>{t('courseBuilder.sections')}</h2>
        {sections.map((section, sIndex) => (
          <div key={section._id || sIndex} className="builder-section">
            <div className="form-row">
              <label>
                {t('courseBuilder.sectionTitle')}
                <input value={section.title} onChange={(e) => updateSectionTitle(sIndex, e.target.value)} />
              </label>
              <button type="button" className="btn-danger" onClick={() => removeSection(sIndex)}>
                {t('courseBuilder.removeSection')}
              </button>
            </div>

            {section.lessons.map((lesson, lIndex) => (
              <div key={lesson._id || lIndex} className="builder-lesson">
                <div className="form-row">
                  <label>
                    {t('courseBuilder.lessonTitle')}
                    <input
                      value={lesson.title}
                      onChange={(e) => updateLesson(sIndex, lIndex, 'title', e.target.value)}
                    />
                  </label>
                  <label>
                    {t('courseBuilder.type')}
                    <select
                      value={lesson.type}
                      onChange={(e) => updateLesson(sIndex, lIndex, 'type', e.target.value)}
                    >
                      <option value="text">{t('courseBuilder.text')}</option>
                      <option value="video">{t('courseBuilder.video')}</option>
                      <option value="quiz">{t('courseBuilder.quiz')}</option>
                    </select>
                  </label>
                  <button type="button" className="btn-danger" onClick={() => removeLesson(sIndex, lIndex)}>
                    {t('courseBuilder.remove')}
                  </button>
                </div>

                {lesson.type === 'video' && (
                  <label>
                    {t('courseBuilder.videoUrlHint')}
                    <input
                      value={lesson.videoUrl}
                      onChange={(e) => updateLesson(sIndex, lIndex, 'videoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </label>
                )}

                {lesson.type !== 'quiz' && (
                  <label>
                    {t('courseBuilder.content')}
                    <textarea
                      value={lesson.content}
                      onChange={(e) => updateLesson(sIndex, lIndex, 'content', e.target.value)}
                      rows={3}
                    />
                  </label>
                )}

                {lesson.type === 'quiz' && lesson.quiz && (
                  <QuizEditor
                    quiz={lesson.quiz}
                    idPrefix={`lesson-${sIndex}-${lIndex}`}
                    onChange={(updatedQuiz) => updateLesson(sIndex, lIndex, 'quiz', updatedQuiz)}
                  />
                )}
              </div>
            ))}

            <button type="button" className="btn-secondary" onClick={() => addLesson(sIndex)} style={{ marginTop: 10 }}>
              {t('courseBuilder.addLesson')}
            </button>
          </div>
        ))}

        <button type="button" className="btn-secondary" onClick={addSection}>
          {t('courseBuilder.addSection')}
        </button>

        <h2 style={{ marginTop: 24 }}>{t('courseBuilder.finalExamTitle')}</h2>
        <p style={{ color: 'var(--text-muted)' }}>{t('courseBuilder.finalExamHint')}</p>
        {finalExam ? (
          <div className="builder-section">
            <QuizEditor quiz={finalExam} idPrefix="final-exam" onChange={setFinalExam} />
            <button type="button" className="btn-danger" onClick={() => setFinalExam(null)} style={{ marginTop: 10 }}>
              {t('courseBuilder.removeFinalExam')}
            </button>
          </div>
        ) : (
          <button type="button" className="btn-secondary" onClick={() => setFinalExam(emptyExam())}>
            {t('courseBuilder.addFinalExam')}
          </button>
        )}

        <div style={{ marginTop: 20 }}>
          <button type="submit" disabled={saving}>
            {saving ? t('courseBuilder.saving') : t('courseBuilder.saveCourse')}
          </button>
        </div>
      </form>
    </section>
  );
}

export default CourseBuilder;
