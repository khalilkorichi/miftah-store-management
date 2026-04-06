import React, { useState, useEffect, useRef } from 'react';
import { PackageIcon, XIcon, CheckIcon, CheckCircleIcon, TagIcon, CalendarIcon, InfoIcon, ZapIcon, UserIcon, UsersIcon, ShieldCheckIcon } from './Icons';

function AddProductModal({ isOpen, onClose, onConfirm, durations, suppliers, allMethods = [] }) {
  const [name, setName] = useState('');
  const [selectedDurations, setSelectedDurations] = useState(['month_1', 'year_1']);
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [accountType, setAccountType] = useState('none');
  const [prices, setPrices] = useState({});
  const [warranties, setWarranties] = useState({});
  const [step, setStep] = useState(1);
  const [nameError, setNameError] = useState('');
  const nameInputRef = useRef(null);
  const overlayRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedDurations(['month_1', 'year_1']);
      setSelectedMethods([]);
      setAccountType('none');
      setPrices({});
      setWarranties({});
      setStep(1);
      setNameError('');
      setTimeout(() => nameInputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Init prices when durations/suppliers change
  useEffect(() => {
    const newPrices = {};
    selectedDurations.forEach((durId) => {
      newPrices[durId] = newPrices[durId] || {};
      suppliers.forEach((s) => {
        newPrices[durId][s.id] = prices[durId]?.[s.id] ?? '';
      });
    });
    setPrices(newPrices);
  }, [selectedDurations, suppliers]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  const toggleDuration = (durId) => {
    setSelectedDurations((prev) =>
      prev.includes(durId)
        ? prev.length > 1 ? prev.filter((d) => d !== durId) : prev
        : [...prev, durId]
    );
  };

  const toggleMethod = (methodId) => {
    setSelectedMethods((prev) =>
      prev.includes(methodId)
        ? prev.filter((id) => id !== methodId)
        : [...prev, methodId]
    );
  };

  const handlePriceChange = (durId, supplierId, val) => {
    setPrices((prev) => ({
      ...prev,
      [durId]: { ...prev[durId], [supplierId]: val },
    }));
  };

  const handleNextStep = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('الرجاء إدخال اسم المنتج');
      nameInputRef.current?.focus();
      return;
    }
    setNameError('');
    setStep(2);
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const plans = selectedDurations.map((durId, idx) => {
      const planPrices = {};
      suppliers.forEach((s) => {
        const val = parseFloat(prices[durId]?.[s.id]);
        planPrices[s.id] = isNaN(val) ? 0 : val;
      });
      const warrantyDays = Math.max(0, parseInt(warranties[durId]) || 0);
      return { id: idx + 1, durationId: durId, prices: planPrices, warrantyDays };
    });

    onConfirm({ name: trimmed, plans, activationMethods: selectedMethods, accountType });
    onClose();
  };

  const getDurationLabel = (id) => durations.find((d) => d.id === id)?.label || id;

  const totalFilledPrices = selectedDurations.reduce((sum, durId) => {
    return sum + suppliers.filter((s) => parseFloat(prices[durId]?.[s.id]) > 0).length;
  }, 0);

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="إضافة منتج جديد"
    >
      <div className="modal-box" dir="rtl">
        {/* Header */}
        <div className="modal-header modal-header-blue">
          <div className="modal-header-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PackageIcon /></div>
          <div className="modal-header-text">
            <h2>إضافة منتج جديد</h2>
            <p>{step === 1 ? 'أدخل اسم المنتج والخطط' : 'أدخل أسعار كل مورد (اختياري)'}</p>
          </div>
          <button className="modal-close-btn flex-row align-center justify-center" onClick={onClose} title="إغلاق"><XIcon className="icon-sm" /></button>
        </div>

        {/* Step indicator */}
        <div className="modal-steps">
          <div className={`modal-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
            <div className="step-circle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step > 1 ? <CheckIcon className="icon-xs" /> : '1'}</div>
            <span>اسم المنتج</span>
          </div>
          <div className="step-line" />
          <div className={`modal-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-circle">2</div>
            <span>الخطط والأسعار</span>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {step === 1 && (
            <div className="modal-step-content">
              {/* Product Name */}
              <div className="modal-field">
                <label className="modal-label">
                  <span className="label-icon" style={{ display: 'flex' }}><TagIcon className="icon-xs" /></span>
                  اسم المنتج
                  <span className="label-required">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  className={`modal-input ${nameError ? 'modal-input-error' : ''}`}
                  placeholder="مثال: ChatGPT Plus، Spotify Premium..."
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                  dir="rtl"
                  maxLength={100}
                />
                {nameError && <span className="modal-error">{nameError}</span>}
                <span className="modal-char-count">{name.length}/100</span>
              </div>

              {/* Account Type Selection */}
              <div className="modal-field">
                <label className="modal-label">
                  <span className="label-icon" style={{ display: 'flex' }}><UserIcon className="icon-xs" /></span>
                  نوع الحساب
                  <span className="modal-hint">هل الحساب فردي أم يتبع لمجموعة (فريق)؟</span>
                </label>
                <div className="duration-chips">
                  <button
                    type="button"
                    className={`duration-chip ${accountType === 'none' ? 'duration-chip-selected' : ''}`}
                    onClick={() => setAccountType('none')}
                  >
                    {accountType === 'none' && <span className="chip-check" style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>}
                    غير محدد
                  </button>
                  <button
                    type="button"
                    className={`duration-chip ${accountType === 'individual' ? 'duration-chip-selected' : ''}`}
                    onClick={() => setAccountType('individual')}
                  >
                    {accountType === 'individual' && <span className="chip-check" style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>}
                    👤 فردي
                  </button>
                  <button
                    type="button"
                    className={`duration-chip ${accountType === 'team' ? 'duration-chip-selected' : ''}`}
                    onClick={() => setAccountType('team')}
                  >
                    {accountType === 'team' && <span className="chip-check" style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>}
                    👥 فريق
                  </button>
                </div>
              </div>

              {/* Duration Selection */}
              <div className="modal-field">
                <label className="modal-label">
                  <span className="label-icon" style={{ display: 'flex' }}><CalendarIcon className="icon-xs" /></span>
                  خطط الاشتراك
                  <span className="modal-hint">اختر الخطط المتاحة لهذا المنتج</span>
                </label>
                <div className="duration-chips">
                  {durations.map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      className={`duration-chip ${selectedDurations.includes(dur.id) ? 'duration-chip-selected' : ''}`}
                      onClick={() => toggleDuration(dur.id)}
                    >
                      {selectedDurations.includes(dur.id) && <span className="chip-check" style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>}
                      {dur.label}
                    </button>
                  ))}
                </div>
                <p className="modal-notice">
                  <span className="flex-row align-center gap-1"><CheckCircleIcon className="icon-sm" style={{ color: 'var(--accent-green)' }} /> تم اختيار <strong>{selectedDurations.length}</strong> {selectedDurations.length === 1 ? 'خطة' : 'خطط'}</span>
                </p>
              </div>

              {/* Activation Methods Selection */}
              <div className="modal-field">
                <label className="modal-label">
                  <span className="label-icon" style={{ display: 'flex' }}><ZapIcon className="icon-xs" /></span>
                  طرق التفعيل للمنتج (اختياري)
                  <span className="modal-hint">اختر طرق التفعيل المتاحة لهذا المنتج</span>
                </label>
                <div className="duration-chips">
                  {allMethods.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>لا توجد طرق تفعيل مضافة في النظام.</span>
                  ) : (
                    allMethods.map((m) => {
                      const isSelected = selectedMethods.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`duration-chip ${isSelected ? 'duration-chip-selected' : ''}`}
                          onClick={() => toggleMethod(m.id)}
                          style={{
                            border: isSelected ? `1px solid ${m.color}` : undefined,
                            backgroundColor: isSelected ? `${m.color}15` : undefined,
                            color: isSelected ? m.color : undefined
                          }}
                        >
                          {isSelected && <span className="chip-check" style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>}
                          {m.icon} {m.label}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="modal-step-content">
              <div className="modal-product-preview">
                <span className="preview-icon" style={{ display: 'flex' }}><PackageIcon /></span>
                <span className="preview-name">{name}</span>
                <span className="preview-badge">{selectedDurations.length} {selectedDurations.length === 1 ? 'خطة' : 'خطط'}</span>
              </div>

              <p className="modal-prices-hint">
                <InfoIcon className="icon-sm" style={{ color: 'var(--accent-blue)' }} /> الأسعار اختيارية — يمكنك إدخالها لاحقاً من الجدول
              </p>

              {selectedDurations.map((durId) => (
                <div key={durId} className="modal-plan-section">
                  <div className="plan-section-header">
                    <span className="plan-duration-tag">{getDurationLabel(durId)}</span>
                    <div className="plan-warranty-input-wrap">
                      <ShieldCheckIcon className="icon-xs" />
                      <input
                        type="number"
                        className="modal-warranty-input"
                        placeholder="0"
                        value={warranties[durId] ?? ''}
                        onChange={(e) => setWarranties((prev) => ({ ...prev, [durId]: e.target.value }))}
                        min="0"
                        max="365"
                        dir="ltr"
                      />
                      <span className="warranty-input-label">يوم ضمان</span>
                    </div>
                  </div>
                  <div className="plan-prices-grid">
                    {suppliers.map((supplier) => (
                      <div key={supplier.id} className="plan-price-row">
                        <div className="supplier-label">
                          <span className="supplier-dot" />
                          {supplier.name}
                        </div>
                        <div className="price-input-wrap">
                          <span className="price-prefix">$</span>
                          <input
                            type="number"
                            className="modal-price-input"
                            placeholder="0.00"
                            value={prices[durId]?.[supplier.id] ?? ''}
                            onChange={(e) => handlePriceChange(durId, supplier.id, e.target.value)}
                            min="0"
                            step="0.01"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {totalFilledPrices > 0 && (
                <p className="modal-filled-count">
                  <span className="flex-row align-center gap-1"><CheckCircleIcon className="icon-sm" style={{ color: 'var(--accent-green)' }} /> تم إدخال <strong>{totalFilledPrices}</strong> سعر</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {step === 1 ? (
            <>
              <button className="modal-btn modal-btn-ghost" onClick={onClose}>إلغاء</button>
              <button className="modal-btn modal-btn-primary" onClick={handleNextStep}>
                التالي ←
              </button>
            </>
          ) : (
            <>
              <button className="modal-btn modal-btn-ghost" onClick={() => setStep(1)}>← رجوع</button>
              <button className="modal-btn modal-btn-success" onClick={handleSubmit}>
                <span style={{ display: 'flex' }}><CheckIcon className="icon-sm" /></span> إضافة المنتج
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddProductModal;
