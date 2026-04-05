import { useState, useRef } from 'react';
import { 
  SettingsIcon, GlobeIcon, ClockIcon, PaletteIcon, 
  MoonIcon, SunIcon, DatabaseIcon, UploadIcon, 
  DownloadIcon, RefreshIcon, InfoIcon, XIcon, PlusIcon
} from './Icons';

function SettingsPage({
  exchangeRate,
  onRateChange,
  onResetData,
  onExportJson,
  onImportData,
  darkMode,
  onToggleDarkMode,
  durations,
  onAddDuration,
  onDeleteDuration,
}) {
  const [tempRate, setTempRate] = useState(exchangeRate);
  const [newDurationLabel, setNewDurationLabel] = useState('');
  const [newDurationMonths, setNewDurationMonths] = useState('');
  const fileInputRef = useRef(null);

  const handleSaveRate = () => {
    const rate = parseFloat(tempRate);
    if (rate > 0) {
      onRateChange(rate);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        onImportData(data);
        alert('تم استيراد البيانات بنجاح!');
      } catch {
        alert('خطأ: الملف غير صالح');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddDuration = () => {
    const label = newDurationLabel.trim();
    const months = parseInt(newDurationMonths);
    if (!label) {
      alert('الرجاء إدخال اسم المدة');
      return;
    }
    if (!months || months <= 0) {
      alert('الرجاء إدخال عدد أشهر صحيح');
      return;
    }
    onAddDuration(label, months);
    setNewDurationLabel('');
    setNewDurationMonths('');
  };

  return (
    <div className="settings-page">
      <h2 className="settings-title">
        <SettingsIcon className="icon-md" /> إعدادات البرنامج
      </h2>

      {/* Exchange Rate Setting */}
      <div className="settings-card">
        <h3><GlobeIcon className="icon-sm" /> سعر الصرف</h3>
        <p className="settings-desc">تعيين سعر صرف الدولار مقابل الريال السعودي</p>
        <div className="settings-row">
          <label>1 دولار أمريكي =</label>
          <input
            type="number"
            value={tempRate}
            onChange={(e) => setTempRate(e.target.value)}
            step="0.01"
            min="0"
            className="settings-input"
          />
          <span>ريال سعودي</span>
          <button className="btn-primary" onClick={handleSaveRate}>حفظ</button>
        </div>
      </div>

      {/* Duration Management */}
      <div className="settings-card">
        <h3><ClockIcon className="icon-sm" /> مدد الاشتراك</h3>
        <p className="settings-desc">إدارة مدد الاشتراك المتاحة (شهري، سنوي، إلخ)</p>
        
        <div className="durations-list">
          {durations.map((dur) => (
            <div key={dur.id} className="duration-item">
              <div className="duration-info">
                <span className="duration-label">{dur.label}</span>
                <span className="duration-months">{dur.months} {dur.months === 1 ? 'شهر' : 'أشهر'}</span>
              </div>
              <button
                className="btn-delete-duration flex-center"
                onClick={() => {
                  if (confirm(`هل تريد حذف المدة "${dur.label}"؟`)) {
                    onDeleteDuration(dur.id);
                  }
                }}
                title="حذف المدة"
              >
                <XIcon className="icon-sm" />
              </button>
            </div>
          ))}
        </div>

        <div className="add-duration-form">
          <input
            type="text"
            placeholder="اسم المدة (مثال: سنتين)"
            value={newDurationLabel}
            onChange={(e) => setNewDurationLabel(e.target.value)}
            className="duration-input"
          />
          <input
            type="number"
            placeholder="عدد الأشهر"
            value={newDurationMonths}
            onChange={(e) => setNewDurationMonths(e.target.value)}
            min="1"
            className="duration-months-input"
          />
          <button className="btn-add-duration flex-row gap-2 align-center" onClick={handleAddDuration}>
            <PlusIcon className="icon-sm" /> إضافة مدة
          </button>
        </div>
      </div>

      {/* Theme Setting */}
      <div className="settings-card">
        <h3><PaletteIcon className="icon-sm" /> المظهر</h3>
        <p className="settings-desc">التبديل بين الوضع الداكن والفاتح</p>
        <div className="settings-row">
          <span className="flex-row gap-2 align-center">
            {darkMode ? <MoonIcon className="icon-sm" /> : <SunIcon className="icon-sm" />} 
            {darkMode ? 'الوضع الداكن' : 'الوضع الفاتح'}
          </span>
          <button className="btn-toggle" onClick={onToggleDarkMode}>
            {darkMode ? 'تحويل للوضع الفاتح' : 'تحويل للوضع الداكن'}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="settings-card">
        <h3><DatabaseIcon className="icon-sm" /> إدارة البيانات</h3>
        <p className="settings-desc">تصدير واستيراد البيانات بصيغة JSON أو إعادة ضبط البيانات</p>
        <div className="settings-actions">
          <button className="btn-export" onClick={onExportJson}>
            <UploadIcon className="icon-sm" /> تصدير البيانات (JSON)
          </button>
          <button className="btn-import" onClick={() => fileInputRef.current?.click()}>
            <DownloadIcon className="icon-sm" /> استيراد البيانات (JSON)
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            style={{ display: 'none' }}
          />
          <button
            className="btn-danger"
            onClick={() => {
              if (confirm('هل أنت متأكد من إعادة ضبط جميع البيانات؟ سيتم حذف جميع التعديلات.')) {
                onResetData();
              }
            }}
          >
            <RefreshIcon className="icon-sm" /> إعادة ضبط البيانات
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="settings-card info-card">
        <h3><InfoIcon className="icon-sm" /> معلومات</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">الإصدار</span>
            <span className="info-value">2.0.0</span>
          </div>
          <div className="info-item">
            <span className="info-label">الحفظ</span>
            <span className="info-value">تلقائي (متصفح محلي)</span>
          </div>
          <div className="info-item">
            <span className="info-label">اللغة</span>
            <span className="info-value">العربية</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
