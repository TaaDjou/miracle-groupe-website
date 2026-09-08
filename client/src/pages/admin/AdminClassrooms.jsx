import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const emptyForm = { name: '', location: '', capacity: '', pricePerHour: '', amenities: '', description: '' };

function AdminClassrooms() {
  const { t } = useTranslation();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/classrooms')
      .then((res) => setClassrooms(res.data))
      .catch(() => setError(t('classrooms.couldNotLoadClassrooms')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateForm = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const startEdit = (classroom) => {
    setEditingId(classroom._id);
    setForm({
      name: classroom.name,
      location: classroom.location,
      capacity: classroom.capacity,
      pricePerHour: classroom.pricePerHour,
      amenities: classroom.amenities.join(', '),
      description: classroom.description,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        location: form.location,
        capacity: Number(form.capacity),
        pricePerHour: Number(form.pricePerHour),
        amenities: form.amenities
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        description: form.description,
      };
      if (editingId) {
        await api.put(`/classrooms/${editingId}`, payload);
      } else {
        await api.post('/classrooms', payload);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('admin.couldNotSaveClassroom'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (classroom) => {
    try {
      await api.put(`/classrooms/${classroom._id}`, { active: !classroom.active });
      load();
    } catch {
      setError(t('admin.couldNotUpdateClassroom'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDeleteClassroom'))) return;
    try {
      await api.delete(`/classrooms/${id}`);
      load();
    } catch {
      setError(t('admin.couldNotDeleteClassroom'));
    }
  };

  return (
    <section className="text-left">
      <div className="dashboard-item__row">
        <h1>{t('admin.manageClassrooms')}</h1>
        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)}>
            {t('admin.newClassroom')}
          </button>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="builder-section" style={{ maxWidth: 560, marginTop: 16 }}>
          <h2>{editingId ? t('admin.editClassroom') : t('admin.newClassroom')}</h2>
          <label>
            {t('admin.name')}
            <input name="name" value={form.name} onChange={updateForm} required />
          </label>
          <div className="form-row">
            <label>
              {t('admin.location')}
              <input name="location" value={form.location} onChange={updateForm} />
            </label>
            <label>
              {t('admin.capacityField')}
              <input type="number" name="capacity" min={1} value={form.capacity} onChange={updateForm} required />
            </label>
          </div>
          <label>
            {t('admin.pricePerHour')}
            <input type="number" name="pricePerHour" min={0} step="0.01" value={form.pricePerHour} onChange={updateForm} required />
          </label>
          <label>
            {t('admin.amenities')}
            <input name="amenities" value={form.amenities} onChange={updateForm} placeholder={t('admin.amenitiesPlaceholder')} />
          </label>
          <label>
            {t('admin.descriptionField')}
            <textarea name="description" value={form.description} onChange={updateForm} rows={2} />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving}>
              {saving ? t('courseBuilder.saving') : editingId ? t('admin.saveChanges') : t('admin.createClassroom')}
            </button>
            <button type="button" className="btn-secondary" onClick={cancelEdit}>
              {t('admin.cancel')}
            </button>
          </div>
        </form>
      )}

      <h2 style={{ marginTop: 28 }}>{t('admin.existingClassrooms')}</h2>
      {loading ? (
        <p>{t('classrooms.loadingClassrooms')}</p>
      ) : (
        <div className="dashboard-list" style={{ marginTop: 12 }}>
          {classrooms.map((c) => (
            <div key={c._id} className="dashboard-item">
              <div className="dashboard-item__row">
                <h3>{c.name}</h3>
                <span className="badge" data-status={c.active ? 'published' : 'draft'}>
                  {c.active ? t('admin.active') : t('admin.inactive')}
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {c.location} &middot; {t('classrooms.upToPeople', { count: c.capacity })} &middot;{' '}
                {t('classrooms.perHour', { price: c.pricePerHour })}
              </p>
              <div className="dashboard-item__row">
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn-secondary" onClick={() => startEdit(c)}>
                    {t('common.edit')}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => handleToggleActive(c)}>
                    {c.active ? t('admin.deactivate') : t('admin.activate')}
                  </button>
                </div>
                <button type="button" className="btn-danger" onClick={() => handleDelete(c._id)}>
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminClassrooms;
