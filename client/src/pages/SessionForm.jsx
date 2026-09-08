import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SessionForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    type: 'live',
    title: '',
    description: '',
    scheduledAt: '',
    durationMinutes: 60,
    capacity: '',
    discordInviteUrl: '',
    location: '',
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    api
      .get(`/sessions/${id}`)
      .then((res) => {
        const s = res.data;
        setForm({
          type: s.type,
          title: s.title,
          description: s.description,
          scheduledAt: toLocalInputValue(s.scheduledAt),
          durationMinutes: s.durationMinutes,
          capacity: s.capacity || '',
          discordInviteUrl: s.discordInviteUrl || '',
          location: s.location || '',
        });
      })
      .catch(() => setError(t('sessions.couldNotLoadSession')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  const updateForm = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        durationMinutes: Number(form.durationMinutes),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      };

      if (isEditing) {
        await api.put(`/sessions/${id}`, payload);
      } else {
        await api.post('/sessions', payload);
      }
      navigate('/instructor');
    } catch (err) {
      setError(err.response?.data?.message || t('sessions.couldNotSaveSession'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>{t('sessions.loadingSession')}</p>;

  return (
    <section className="text-left">
      <h1>{isEditing ? t('sessions.editSessionTitle') : t('sessions.newSessionTitle')}</h1>
      {error && <p className="form-error">{error}</p>}

      <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
        {!isEditing && (
          <label>
            {t('sessions.sessionType')}
            <select name="type" value={form.type} onChange={updateForm}>
              <option value="live">{t('sessions.onlineOption')}</option>
              <option value="in_person">{t('sessions.inPersonOption')}</option>
            </select>
          </label>
        )}

        <label>
          {t('sessions.title')}
          <input name="title" value={form.title} onChange={updateForm} required />
        </label>

        <label>
          {t('sessions.description')}
          <textarea name="description" value={form.description} onChange={updateForm} rows={3} />
        </label>

        <div className="form-row">
          <label>
            {t('sessions.dateTime')}
            <input type="datetime-local" name="scheduledAt" value={form.scheduledAt} onChange={updateForm} required />
          </label>
          <label>
            {t('sessions.duration')}
            <input type="number" name="durationMinutes" min={5} value={form.durationMinutes} onChange={updateForm} />
          </label>
        </div>

        <label>
          {t('sessions.capacity')}
          <input type="number" name="capacity" min={1} value={form.capacity} onChange={updateForm} />
        </label>

        {form.type === 'live' ? (
          <label>
            {t('sessions.discordLink')}
            <input
              name="discordInviteUrl"
              value={form.discordInviteUrl}
              onChange={updateForm}
              placeholder="https://discord.gg/..."
              required
            />
          </label>
        ) : (
          <label>
            {t('sessions.locationField')}
            <input
              name="location"
              value={form.location}
              onChange={updateForm}
              placeholder={t('sessions.locationPlaceholder')}
              required
            />
          </label>
        )}

        <button type="submit" disabled={saving}>
          {saving ? t('courses.saving') : t('sessions.saveSession')}
        </button>
      </form>
    </section>
  );
}

export default SessionForm;
