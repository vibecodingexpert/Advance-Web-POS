import { useState, useEffect } from 'react';
import { FiSave, FiUpload, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const fields = [
    { key: 'businessName', label: 'Business Name', type: 'text' },
    { key: 'ownerName', label: 'Owner Name', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'address', label: 'Address', type: 'textarea' },
    { key: 'taxNumber', label: 'Tax Number', type: 'text' },
    { key: 'invoiceFooter', label: 'Invoice Footer', type: 'textarea' },
    { key: 'receiptSize', label: 'Receipt Size', type: 'select', options: ['80mm', '58mm', 'A4', 'Letter'] },
    { key: 'currency', label: 'Currency', type: 'text' },
    { key: 'dateFormat', label: 'Date Format', type: 'select', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] },
  ];

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/api/settings');
      const settingsMap = {};
      (data.data || []).forEach((s) => {
        settingsMap[s.key] = s.value;
      });
      setSettings(settingsMap);
      if (settingsMap.logo) setLogoPreview(settingsMap.logo);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (key) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('value', settings[key] || '');
      if (key === 'logo' && logoFile) {
        formData.append('logo', logoFile);
      }
      await api.put(`/api/settings/${key}`, formData, {
        headers: key === 'logo' ? { 'Content-Type': 'multipart/form-data' } : {},
      });
      toast.success(`${fields.find((f) => f.key === key)?.label || key} saved`);
    } catch (error) {
      toast.error('Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const promises = fields.map((field) => {
        const formData = new FormData();
        formData.append('value', settings[field.key] || '');
        return api.put(`/api/settings/${field.key}`, formData);
      });
      if (logoFile) {
        const logoForm = new FormData();
        logoForm.append('logo', logoFile);
        promises.push(api.put('/api/settings/logo', logoForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }));
      }
      await Promise.all(promises);
      toast.success('All settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
        <button onClick={handleSaveAll} disabled={saving} className="btn-primary flex items-center gap-2">
          <FiSave size={16} /> {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      <div className="card">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Logo</label>
          <div className="flex items-center gap-4">
            <label className="btn-secondary cursor-pointer flex items-center gap-2">
              <FiUpload size={16} /> Upload Logo
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
            {logoPreview && (
              <div className="relative">
                <img src={logoPreview} alt="Logo" className="h-16 object-contain rounded" />
                <button
                  onClick={() => { setLogoPreview(''); setLogoFile(null); setSettings({ ...settings, logo: '' }); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                >
                  <FiX size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {field.label}
              </label>
              <div className="flex gap-2">
                {field.type === 'textarea' ? (
                  <textarea
                    className="input-field"
                    rows="2"
                    value={settings[field.key] || ''}
                    onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                  />
                ) : field.type === 'select' ? (
                  <select
                    className="input-field"
                    value={settings[field.key] || ''}
                    onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                  >
                    <option value="">Select</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    className="input-field"
                    value={settings[field.key] || ''}
                    onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                  />
                )}
                <button
                  onClick={() => handleSave(field.key)}
                  disabled={saving}
                  className="btn-primary text-sm py-1 px-3 whitespace-nowrap"
                >
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
