import React, { useState } from 'react';
import { EyeIcon, XIcon, TagIcon, GlobeIcon, PlusIcon, TargetIcon, TrashIcon } from './Icons';

function CompetitorsModal({
  isOpen,
  onClose,
  product,
  onAddCompetitor,
  onUpdateCompetitor,
  onDeleteCompetitor,
}) {
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  if (!isOpen || !product) return null;

  const competitors = product.competitors || [];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;
    
    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    onAddCompetitor(product.id, newName.trim(), formattedUrl);
    setNewName('');
    setNewUrl('');
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box competitors-modal" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="modal-header">
          <div className="modal-header-text">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)', fontSize: '18px' }}>
              <EyeIcon className="icon-md" style={{ color: 'var(--accent-blue)' }} />
              مراقبة المنافسين: {product.name}
            </h2>
          </div>
          <button className="modal-close-btn flex-row align-center justify-center" onClick={onClose} title="إغلاق" aria-label="إغلاق" style={{ padding: 0 }}>
            <XIcon className="icon-sm" />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p className="modal-subtitle" style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.6' }}>
            أضف روابط سريعة لصفحات نفس المنتج عند المنافسين لتسهيل مراقبة أسعارهم وتفاصيلهم.
          </p>
          
          <form className="competitor-add-form" onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '160px', position: 'relative' }}>
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none', display: 'flex' }}><TagIcon className="icon-xs" /></div>
              <input
                type="text"
                placeholder="اسم المتجر"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="competitor-input focus-ring"
                style={{ width: '100%', padding: '12px 12px 12px 36px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13.5px', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              />
            </div>
            
            <div style={{ flex: '2', minWidth: '220px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none', display: 'flex' }}><GlobeIcon className="icon-xs" /></div>
              <input
                type="url"
                placeholder="رابط صفحة المنتج (https://...)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
                className="competitor-input focus-ring"
                style={{ width: '100%', padding: '12px 36px 12px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13.5px', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                dir="ltr"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn-save hover-lift" 
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-blue), #4535b8)', 
                color: 'var(--text-primary)', 
                border: 'none', 
                borderRadius: '8px', 
                height: '42px',
                padding: '0 24px', 
                fontWeight: '700', 
                cursor: 'pointer', 
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(94, 79, 222, 0.25)',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <PlusIcon className="icon-sm" /> إضافة
            </button>
          </form>

          <div className="competitors-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '2px' }}>
            {competitors.length === 0 ? (
              <div className="empty-competitors" style={{ textAlign: 'center', padding: '30px 10px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--text-muted)', opacity: 0.5 }}><TargetIcon style={{ width: '32px', height: '32px' }} /></div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>لا يوجد منافسين مضافين لهذا المنتج بعد.</p>
              </div>
            ) : (
              competitors.map((comp) => (
                <div key={comp.id} className="competitor-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
                  <div className="comp-info" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span className="comp-name" style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14.5px' }}>{comp.name}</span>
                    <a href={comp.url} target="_blank" rel="noopener noreferrer" className="comp-link flex-row align-center gap-1" title="تصفح صفحة المنافس" style={{ fontSize: '12.5px', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '600' }}>
                      عرض الصفحة <GlobeIcon className="icon-xs" />
                    </a>
                  </div>
                  <button
                    className="btn-delete-comp"
                    onClick={() => onDeleteCompetitor(product.id, comp.id)}
                    title="حذف المنافس"
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: 'none', width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <TrashIcon className="icon-sm" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompetitorsModal;
