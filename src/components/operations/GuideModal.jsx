import React, { useState, useEffect, useRef } from 'react';
import {
  XIcon, CheckIcon, BookOpenIcon, PlusIcon, TrashIcon, GripIcon, TagIcon
} from '../Icons';

function StepRow({ step, index, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="guide-step-row">
      <span className="guide-step-num">{index + 1}</span>
      <input
        type="text"
        className="ops-form-input guide-step-input"
        placeholder={`الخطوة ${index + 1}...`}
        value={step.text}
        onChange={e => onChange(step.id, e.target.value)}
      />
      <div className="guide-step-controls">
        <button type="button" className="guide-step-ctrl" onClick={() => onMoveUp(step.id)} disabled={isFirst} title="أعلى">▲</button>
        <button type="button" className="guide-step-ctrl" onClick={() => onMoveDown(step.id)} disabled={isLast} title="أسفل">▼</button>
        <button type="button" className="guide-step-ctrl guide-step-del" onClick={() => onDelete(step.id)} title="حذف">
          <TrashIcon className="icon-xs" />
        </button>
      </div>
    </div>
  );
}

export default function GuideModal({ guide, products, onSave, onClose }) {
  const isEdit = !!guide;
  const overlayRef = useRef(null);
  const firstInputRef = useRef(null);

  const makeStep = (text = '') => ({ id: `step_${Date.now()}_${Math.random().toString(36).slice(2)}`, text });

  const [form, setForm] = useState({
    title: guide?.title || '',
    steps: guide?.steps?.length ? guide.steps : [makeStep()],
    productTag: guide?.productTag || '',
    customTags: guide?.customTags || '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    firstInputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addStep = () => {
    setForm(f => ({ ...f, steps: [...f.steps, makeStep()] }));
  };

  const updateStep = (id, text) => {
    setForm(f => ({ ...f, steps: f.steps.map(s => s.id === id ? { ...s, text } : s) }));
  };

  const deleteStep = (id) => {
    setForm(f => ({ ...f, steps: f.steps.filter(s => s.id !== id) }));
  };

  const moveStep = (id, dir) => {
    setForm(f => {
      const idx = f.steps.findIndex(s => s.id === id);
      if (idx < 0) return f;
      const next = [...f.steps];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return f;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...f, steps: next };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'العنوان مطلوب';
    const filledSteps = form.steps.filter(s => s.text.trim());
    if (!filledSteps.length) e.steps = 'أضف خطوة واحدة على الأقل';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const now = new Date().toISOString();
    onSave({
      id: guide?.id || `guide_${Date.now()}`,
      title: form.title.trim(),
      steps: form.steps.filter(s => s.text.trim()),
      productTag: form.productTag,
      customTags: form.customTags.trim(),
      createdAt: guide?.createdAt || now,
      updatedAt: now,
    });
    onClose();
  };

  return (
    <div
      className="ops-modal-overlay"
      ref={overlayRef}
      onMouseDown={e => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="ops-modal ops-modal-lg">
        <div className="ops-modal-header">
          <h2 className="ops-modal-title">
            <BookOpenIcon className="icon-sm" />
            {isEdit ? 'تعديل الدليل' : 'دليل تفعيل جديد'}
          </h2>
          <button className="ops-modal-close" onClick={onClose} aria-label="إغلاق">
            <XIcon className="icon-sm" />
          </button>
        </div>

        <form className="ops-modal-body" onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="ops-form-group">
            <label className="ops-form-label">عنوان الدليل <span className="ops-required">*</span></label>
            <input
              ref={firstInputRef}
              type="text"
              className={`ops-form-input ${errors.title ? 'input-error' : ''}`}
              placeholder="مثال: طريقة تفعيل ChatGPT بالحساب الشخصي..."
              value={form.title}
              onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(v => ({ ...v, title: '' })); }}
            />
            {errors.title && <span className="ops-form-error">{errors.title}</span>}
          </div>

          {/* Steps */}
          <div className="ops-form-group">
            <label className="ops-form-label">
              خطوات التفعيل <span className="ops-required">*</span>
              <span className="ops-form-hint">ترتّب الخطوات بالسهمين</span>
            </label>
            {errors.steps && <span className="ops-form-error">{errors.steps}</span>}
            <div className="guide-steps-list">
              {form.steps.map((step, i) => (
                <StepRow
                  key={step.id}
                  step={step}
                  index={i}
                  onChange={updateStep}
                  onDelete={deleteStep}
                  onMoveUp={id => moveStep(id, -1)}
                  onMoveDown={id => moveStep(id, 1)}
                  isFirst={i === 0}
                  isLast={i === form.steps.length - 1}
                />
              ))}
            </div>
            <button type="button" className="ops-btn ops-btn-ghost ops-add-step-btn" onClick={addStep}>
              <PlusIcon className="icon-sm" /> إضافة خطوة
            </button>
          </div>

          <div className="ops-form-row">
            {/* Product tag */}
            <div className="ops-form-group ops-form-half">
              <label className="ops-form-label"><TagIcon className="icon-xs" /> ربط بمنتج</label>
              <select
                className="ops-form-select"
                value={form.productTag}
                onChange={e => setForm(f => ({ ...f, productTag: e.target.value }))}
              >
                <option value="">— بدون ربط —</option>
                {products.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
              </select>
            </div>

            {/* Custom tags */}
            <div className="ops-form-group ops-form-half">
              <label className="ops-form-label">وسوم مخصصة</label>
              <input
                type="text"
                className="ops-form-input"
                placeholder="مثال: VPN, شهري, جاهز"
                value={form.customTags}
                onChange={e => setForm(f => ({ ...f, customTags: e.target.value }))}
              />
              <span className="ops-form-hint">افصل بفاصلة</span>
            </div>
          </div>

          <div className="ops-modal-footer">
            <button type="button" className="ops-btn ops-btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="ops-btn ops-btn-primary">
              <CheckIcon className="icon-sm" /> {isEdit ? 'حفظ التعديلات' : 'حفظ الدليل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
