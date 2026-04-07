import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  FileTextIcon, PackageIcon, SearchIcon, PlusIcon, TrashIcon,
  CheckCircleIcon, AlertTriangleIcon, CopyIcon,
  ArrowUpIcon, ArrowDownIcon, DownloadIcon, ListIcon,
  BoldIcon, ItalicIcon, MinusIcon,
  ChevronDownIcon, TagIcon, XIcon
} from './Icons';
import { FEATURE_ICONS, FEATURE_BADGES, PRODUCT_TEMPLATES } from '../data/productTemplates';

const MAX_DESC_CHARS = 500;

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

function IconPicker({ currentIcon, onSelect, onClose }) {
  const ref = useRef(null);
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

  useClickOutside(ref, onClose);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  const filtered = useMemo(() =>
    search.trim()
      ? FEATURE_ICONS.filter(ic => ic.label.includes(search) || ic.id.includes(search.toLowerCase()))
      : FEATURE_ICONS,
    [search]
  );

  return (
    <div className="pf-icon-picker" ref={ref}>
      <div className="pf-icon-picker-header">
        <div className="pf-icon-search-wrap">
          <SearchIcon className="icon-xs" />
          <input
            ref={searchRef}
            type="text"
            placeholder="بحث عن أيقونة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pf-icon-search-input"
          />
          {search && (
            <button className="pf-icon-search-clear" onClick={() => setSearch('')}>
              <XIcon className="icon-xs" />
            </button>
          )}
        </div>
        <button className="pf-picker-close-btn" onClick={onClose} title="إغلاق">
          <XIcon className="icon-xs" />
        </button>
      </div>
      <div className="pf-icon-grid">
        {filtered.length === 0 ? (
          <div className="pf-icon-empty">لا نتائج</div>
        ) : (
          filtered.map(ic => (
            <button
              key={ic.id}
              className={`pf-icon-option ${currentIcon === ic.id ? 'active' : ''}`}
              onClick={() => onSelect(ic.id)}
              title={ic.label}
            >
              <span className="pf-icon-emoji">{ic.emoji}</span>
              <span className="pf-icon-label">{ic.label}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function BadgePicker({ currentBadge, onSelect, onClose }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="pf-badge-picker" ref={ref}>
      <div className="pf-badge-picker-title">اختر وسماً</div>
      <button
        className={`pf-badge-option pf-badge-none ${!currentBadge ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        بدون وسم
      </button>
      <div className="pf-badge-divider" />
      {FEATURE_BADGES.map(b => (
        <button
          key={b.id}
          className={`pf-badge-option ${currentBadge === b.id ? 'active' : ''}`}
          style={{
            color: b.color,
            background: currentBadge === b.id ? `${b.color}18` : undefined,
            borderRight: currentBadge === b.id ? `3px solid ${b.color}` : '3px solid transparent',
          }}
          onClick={() => onSelect(b.id)}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

function ProductFeatures({ products, setProducts, durations, suppliers, exchangeRate }) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [featureSearch, setFeatureSearch] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(null);
  const [showBadgePicker, setShowBadgePicker] = useState(null);
  const [copyFromPlan, setCopyFromPlan] = useState(null);
  const featureInputRefs = useRef({});

  const product = products.find(p => p.id === parseInt(selectedProductId));

  const updateProduct = useCallback((productId, updater) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      return typeof updater === 'function' ? updater(p) : { ...p, ...updater };
    }));
  }, [setProducts]);

  const handleDescriptionChange = useCallback((text) => {
    if (!product) return;
    updateProduct(product.id, { description: text.slice(0, MAX_DESC_CHARS) });
  }, [product, updateProduct]);

  const handleDescStyleChange = useCallback((key, value) => {
    if (!product) return;
    const styles = product.descriptionStyles || {};
    updateProduct(product.id, { descriptionStyles: { ...styles, [key]: value } });
  }, [product, updateProduct]);

  const addFeature = useCallback((planId, focusNew = false) => {
    if (!product) return;
    const newId = `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    updateProduct(product.id, (p) => ({
      ...p,
      plans: p.plans.map(plan => {
        if (plan.id !== planId) return plan;
        const features = plan.features || [];
        const maxOrder = features.reduce((max, f) => Math.max(max, f.order || 0), 0);
        return {
          ...plan,
          features: [...features, { text: '', icon: 'check', badge: null, order: maxOrder + 1, id: newId }]
        };
      })
    }));
    if (focusNew) {
      setTimeout(() => featureInputRefs.current[newId]?.focus(), 60);
    }
  }, [product, updateProduct]);

  const updateFeature = useCallback((planId, featureId, updates) => {
    if (!product) return;
    updateProduct(product.id, (p) => ({
      ...p,
      plans: p.plans.map(plan => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          features: (plan.features || []).map(f => f.id === featureId ? { ...f, ...updates } : f)
        };
      })
    }));
  }, [product, updateProduct]);

  const removeFeature = useCallback((planId, featureId) => {
    if (!product) return;
    updateProduct(product.id, (p) => ({
      ...p,
      plans: p.plans.map(plan => {
        if (plan.id !== planId) return plan;
        return { ...plan, features: (plan.features || []).filter(f => f.id !== featureId) };
      })
    }));
  }, [product, updateProduct]);

  const moveFeature = useCallback((planId, featureId, direction) => {
    if (!product) return;
    updateProduct(product.id, (p) => ({
      ...p,
      plans: p.plans.map(plan => {
        if (plan.id !== planId) return plan;
        const features = [...(plan.features || [])];
        const idx = features.findIndex(f => f.id === featureId);
        if (idx < 0) return plan;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= features.length) return plan;
        [features[idx], features[newIdx]] = [features[newIdx], features[idx]];
        return { ...plan, features: features.map((f, i) => ({ ...f, order: i + 1 })) };
      })
    }));
  }, [product, updateProduct]);

  const addSeparator = useCallback((planId) => {
    if (!product) return;
    updateProduct(product.id, (p) => ({
      ...p,
      plans: p.plans.map(plan => {
        if (plan.id !== planId) return plan;
        const features = plan.features || [];
        return {
          ...plan,
          features: [...features, {
            text: '---', icon: 'none', badge: null, isSeparator: true,
            order: features.reduce((max, f) => Math.max(max, f.order || 0), 0) + 1,
            id: `sep_${Date.now()}`
          }]
        };
      })
    }));
  }, [product, updateProduct]);

  const copyFeatures = useCallback((fromPlanId, toPlanId) => {
    if (!product) return;
    updateProduct(product.id, (p) => {
      const fromPlan = p.plans.find(pl => pl.id === fromPlanId);
      if (!fromPlan?.features) return p;
      const existingCount = (p.plans.find(pl => pl.id === toPlanId)?.features || []).length;
      const copiedFeatures = fromPlan.features.map((f, i) => ({
        ...f, order: existingCount + i + 1,
        id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      }));
      return {
        ...p,
        plans: p.plans.map(plan => {
          if (plan.id !== toPlanId) return plan;
          return { ...plan, features: [...(plan.features || []), ...copiedFeatures] };
        })
      };
    });
    setCopyFromPlan(null);
  }, [product, updateProduct]);

  const loadTemplate = useCallback((template) => {
    if (!product) return;
    updateProduct(product.id, (p) => ({
      ...p,
      description: template.description,
      plans: p.plans.map((plan, idx) => ({
        ...plan,
        features: template.features.map((f, fi) => ({
          ...f, order: fi + 1,
          id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${idx}`
        }))
      }))
    }));
    setShowTemplates(false);
  }, [product, updateProduct]);

  const stats = useMemo(() => {
    let withDesc = 0, totalFeatures = 0;
    products.forEach(p => {
      if (p.description?.trim()) withDesc++;
      (p.plans || []).forEach(plan => {
        totalFeatures += (plan.features || []).filter(f => !f.isSeparator).length;
      });
    });
    return { withDesc, totalFeatures, total: products.length };
  }, [products]);

  const getProductStatus = (p) => {
    const hasDesc = p.description?.trim();
    const hasFeatures = p.plans?.some(plan => plan.features?.some(f => !f.isSeparator && f.text.trim()));
    return hasDesc && hasFeatures;
  };

  const getDurationLabel = (durationId) => {
    const d = durations.find(dur => dur.id === durationId);
    return d ? d.label : durationId;
  };

  const getIconEmoji = (iconId) => {
    const icon = FEATURE_ICONS.find(i => i.id === iconId);
    return icon ? icon.emoji : '✅';
  };

  const getBadgeInfo = (badgeId) => FEATURE_BADGES.find(b => b.id === badgeId);

  const descStyles = product?.descriptionStyles || {};

  const closeAllPickers = () => {
    setShowIconPicker(null);
    setShowBadgePicker(null);
  };

  const handleFeatureKeyDown = (e, planId, featureId, features) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature(planId, true);
    } else if (e.key === 'Escape') {
      closeAllPickers();
      e.target.blur();
    } else if (e.key === 'Backspace' && e.target.value === '') {
      const idx = features.findIndex(f => f.id === featureId);
      removeFeature(planId, featureId);
      if (idx > 0) {
        const prevId = features[idx - 1]?.id;
        if (prevId) setTimeout(() => featureInputRefs.current[prevId]?.focus(), 30);
      }
    }
  };

  return (
    <div className="pf-container">
      <div className="pf-page-header">
        <div className="pf-header-content">
          <div className="pf-header-icon-wrap">
            <FileTextIcon className="icon-xl" />
          </div>
          <div>
            <h1 className="pf-page-title">وصف المنتجات والمزايا</h1>
            <p className="pf-page-subtitle">أضف أوصاف تفصيلية ومزايا لكل منتج وخططه لعرضها في التقارير والمتجر</p>
          </div>
        </div>
      </div>

      <div className="pf-stats-grid">
        <div className="pf-stat-card pf-stat-blue">
          <div className="pf-stat-icon"><PackageIcon className="icon-lg" /></div>
          <div className="pf-stat-data">
            <span className="pf-stat-value">{stats.total}</span>
            <span className="pf-stat-label">إجمالي المنتجات</span>
          </div>
        </div>
        <div className="pf-stat-card pf-stat-green">
          <div className="pf-stat-icon"><CheckCircleIcon className="icon-lg" /></div>
          <div className="pf-stat-data">
            <span className="pf-stat-value">{stats.withDesc}</span>
            <span className="pf-stat-label">منتجات لها أوصاف</span>
          </div>
        </div>
        <div className="pf-stat-card pf-stat-purple">
          <div className="pf-stat-icon"><ListIcon className="icon-lg" /></div>
          <div className="pf-stat-data">
            <span className="pf-stat-value">{stats.totalFeatures}</span>
            <span className="pf-stat-label">إجمالي المزايا</span>
          </div>
        </div>
      </div>

      <div className="pf-selector-card">
        <div className="pf-selector-icon"><PackageIcon className="icon-lg" /></div>
        <div className="pf-selector-content">
          <h3>اختر المنتج لتحرير الوصف والمزايا</h3>
          <p>حدد المنتج من القائمة ثم أضف الوصف والمزايا لكل خطة</p>
        </div>
        <select
          className="pf-product-select"
          value={selectedProductId}
          onChange={(e) => { setSelectedProductId(e.target.value); setFeatureSearch(''); closeAllPickers(); }}
        >
          <option value="">-- اختر منتج --</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {getProductStatus(p) ? '✓' : '⚠️'} {p.name}
            </option>
          ))}
        </select>
      </div>

      {!product ? (
        <div className="pf-empty-state">
          <div className="pf-empty-icon"><FileTextIcon className="icon-xl" /></div>
          <h3>يرجى اختيار منتج للبدء</h3>
          <p>اختر منتجاً من القائمة أعلاه لإضافة الوصف والمزايا لخططه</p>
        </div>
      ) : (
        <div className="pf-editor-area">
          <div className="pf-editor-header">
            <div className="pf-editor-title-row">
              <h2>{product.name}</h2>
              {getProductStatus(product) ? (
                <span className="pf-status-complete"><CheckCircleIcon className="icon-sm" /> مكتمل</span>
              ) : (
                <span className="pf-status-incomplete"><AlertTriangleIcon className="icon-sm" /> ناقص</span>
              )}
            </div>
            <div className="pf-editor-actions">
              <button className="pf-template-btn" onClick={() => setShowTemplates(!showTemplates)}>
                <DownloadIcon className="icon-sm" />
                تحميل قالب جاهز
                <ChevronDownIcon className="icon-xs" style={{ transform: showTemplates ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>
          </div>

          {showTemplates && (
            <div className="pf-templates-panel">
              <h4>قوالب جاهزة للمنتجات الشائعة</h4>
              <p className="pf-templates-note">اختر قالباً لتحميل الوصف والمزايا تلقائياً (سيحل محل المحتوى الحالي)</p>
              <div className="pf-templates-grid">
                {PRODUCT_TEMPLATES.map(t => (
                  <button key={t.id} className="pf-template-item" onClick={() => loadTemplate(t)}>
                    <span className="pf-template-name">{t.name}</span>
                    <span className="pf-template-count">{t.features.length} ميزة</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pf-desc-card">
            <div className="pf-desc-header">
              <span className="pf-desc-icon"><FileTextIcon className="icon-sm" /></span>
              <div>
                <h3>وصف المنتج</h3>
                <p>أضف وصفاً تعريفياً شاملاً عن المنتج</p>
              </div>
            </div>
            <div className="pf-toolbar">
              <div className="pf-toolbar-group">
                <label className="pf-toolbar-label">الحجم</label>
                <select value={descStyles.fontSize || '14'} onChange={(e) => handleDescStyleChange('fontSize', e.target.value)} className="pf-toolbar-select">
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="16">16</option>
                  <option value="18">18</option>
                  <option value="20">20</option>
                </select>
              </div>
              <div className="pf-toolbar-group">
                <label className="pf-toolbar-label">النوع</label>
                <select value={descStyles.elementType || 'paragraph'} onChange={(e) => handleDescStyleChange('elementType', e.target.value)} className="pf-toolbar-select">
                  <option value="paragraph">فقرة</option>
                  <option value="heading">عنوان</option>
                  <option value="subheading">عنوان فرعي</option>
                  <option value="caption">تعليق</option>
                </select>
              </div>
              <div className="pf-toolbar-group">
                <button className={`pf-toolbar-btn ${descStyles.bold ? 'active' : ''}`} onClick={() => handleDescStyleChange('bold', !descStyles.bold)} title="تغميق">
                  <BoldIcon className="icon-sm" />
                </button>
                <button className={`pf-toolbar-btn ${descStyles.italic ? 'active' : ''}`} onClick={() => handleDescStyleChange('italic', !descStyles.italic)} title="مائل">
                  <ItalicIcon className="icon-sm" />
                </button>
              </div>
              <div className="pf-toolbar-group">
                <label className="pf-toolbar-label">اللون</label>
                <input type="color" value={descStyles.color || '#ffffff'} onChange={(e) => handleDescStyleChange('color', e.target.value)} className="pf-color-picker" />
              </div>
            </div>
            <textarea
              className="pf-desc-textarea"
              value={product.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="اكتب وصفاً تفصيلياً للمنتج... مثال: اشتراك ChatGPT Plus يمنحك وصولاً إلى نموذج GPT-4o المتقدم..."
              rows={4}
              style={{
                fontSize: `${descStyles.elementType === 'heading' ? Math.max(Number(descStyles.fontSize || 14), 18) : descStyles.elementType === 'subheading' ? Math.max(Number(descStyles.fontSize || 14), 16) : descStyles.elementType === 'caption' ? Math.min(Number(descStyles.fontSize || 14), 13) : (descStyles.fontSize || 14)}px`,
                fontWeight: descStyles.bold || descStyles.elementType === 'heading' ? '700' : descStyles.elementType === 'subheading' ? '600' : '400',
                fontStyle: descStyles.italic ? 'italic' : 'normal',
                color: descStyles.color || undefined,
                lineHeight: descStyles.elementType === 'heading' ? '1.4' : descStyles.elementType === 'caption' ? '1.5' : '1.7',
              }}
            />
            <div className="pf-char-counter">
              <span className={(product.description || '').length >= MAX_DESC_CHARS ? 'pf-char-limit' : ''}>
                {(product.description || '').length} / {MAX_DESC_CHARS}
              </span>
            </div>
          </div>

          {(product.plans.length > 1 || product.plans.some(pl => (pl.features || []).length > 5)) && (
            <div className="pf-search-bar">
              <SearchIcon className="icon-sm" />
              <input
                type="text"
                placeholder="بحث في المزايا..."
                value={featureSearch}
                onChange={(e) => setFeatureSearch(e.target.value)}
              />
              {featureSearch && (
                <button className="pf-search-clear" onClick={() => setFeatureSearch('')} title="مسح البحث">
                  <XIcon className="icon-xs" />
                </button>
              )}
            </div>
          )}

          <div className="pf-plans-grid">
            {product.plans.map((plan) => {
              const features = plan.features || [];
              const filteredFeatures = featureSearch
                ? features.filter(f => f.isSeparator || f.text.toLowerCase().includes(featureSearch.toLowerCase()))
                : features;
              const prices = Object.values(plan.prices || {}).filter(v => v > 0);
              const bestPrice = prices.length ? Math.min(...prices.map(v => v * exchangeRate)) : 0;

              return (
                <div key={plan.id} className="pf-plan-card">
                  <div className="pf-plan-header">
                    <div className="pf-plan-info">
                      <h3 className="pf-plan-name">{getDurationLabel(plan.durationId)}</h3>
                      {bestPrice > 0 && (
                        <span className="pf-plan-price">{Number(bestPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
                      )}
                    </div>
                    <div className="pf-plan-actions">
                      <span className="pf-features-count">{features.filter(f => !f.isSeparator).length} ميزة</span>
                      <div className="pf-plan-btns">
                        <button className="pf-plan-action-btn" onClick={() => setCopyFromPlan(copyFromPlan === plan.id ? null : plan.id)} title="نسخ المزايا">
                          <CopyIcon className="icon-sm" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {copyFromPlan === plan.id && product.plans.length > 1 && (
                    <div className="pf-copy-panel">
                      <span>نسخ مزايا هذه الخطة إلى:</span>
                      <div className="pf-copy-targets">
                        {product.plans.filter(pl => pl.id !== plan.id).map(pl => (
                          <button key={pl.id} className="pf-copy-target-btn" onClick={() => copyFeatures(plan.id, pl.id)}>
                            {getDurationLabel(pl.durationId)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pf-features-list">
                    {filteredFeatures.length === 0 && !featureSearch && (
                      <div className="pf-features-empty">
                        <span>لا توجد مزايا بعد</span>
                        <button className="pf-features-empty-btn" onClick={() => addFeature(plan.id, true)}>
                          <PlusIcon className="icon-xs" /> أضف أول ميزة
                        </button>
                      </div>
                    )}
                    {filteredFeatures.map((feature, idx) => {
                      if (feature.isSeparator) {
                        return (
                          <div key={feature.id} className="pf-separator-row">
                            <div className="pf-separator-line" />
                            <button className="pf-remove-btn" onClick={() => removeFeature(plan.id, feature.id)} title="حذف الفاصل">
                              <TrashIcon className="icon-xs" />
                            </button>
                          </div>
                        );
                      }
                      const badgeInfo = feature.badge ? getBadgeInfo(feature.badge) : null;
                      const isIconOpen = showIconPicker === feature.id;
                      const isBadgeOpen = showBadgePicker === feature.id;

                      return (
                        <div key={feature.id} className={`pf-feature-row ${isIconOpen || isBadgeOpen ? 'pf-feature-row--active' : ''}`}>
                          <div className="pf-feature-icon-wrap">
                            <button
                              className={`pf-feature-icon-btn ${isIconOpen ? 'open' : ''}`}
                              onClick={() => {
                                setShowBadgePicker(null);
                                setShowIconPicker(isIconOpen ? null : feature.id);
                              }}
                              title="تغيير الأيقونة"
                              type="button"
                            >
                              {getIconEmoji(feature.icon)}
                            </button>
                            {isIconOpen && (
                              <IconPicker
                                currentIcon={feature.icon}
                                onSelect={(iconId) => {
                                  updateFeature(plan.id, feature.id, { icon: iconId });
                                  setShowIconPicker(null);
                                  featureInputRefs.current[feature.id]?.focus();
                                }}
                                onClose={() => setShowIconPicker(null)}
                              />
                            )}
                          </div>

                          <input
                            ref={el => featureInputRefs.current[feature.id] = el}
                            type="text"
                            className="pf-feature-input"
                            value={feature.text}
                            onChange={(e) => updateFeature(plan.id, feature.id, { text: e.target.value })}
                            onKeyDown={(e) => handleFeatureKeyDown(e, plan.id, feature.id, features)}
                            placeholder="اكتب الميزة... (Enter لإضافة أخرى)"
                          />

                          <div className="pf-feature-badge-wrap">
                            <button
                              className={`pf-badge-btn ${isBadgeOpen ? 'open' : ''} ${badgeInfo ? 'has-badge' : ''}`}
                              onClick={() => {
                                setShowIconPicker(null);
                                setShowBadgePicker(isBadgeOpen ? null : feature.id);
                              }}
                              style={badgeInfo ? {
                                background: `${badgeInfo.color}18`,
                                color: badgeInfo.color,
                                borderColor: `${badgeInfo.color}50`,
                              } : {}}
                              title="إضافة وسم"
                              type="button"
                            >
                              {badgeInfo ? badgeInfo.label : <TagIcon className="icon-xs" />}
                            </button>
                            {isBadgeOpen && (
                              <BadgePicker
                                currentBadge={feature.badge}
                                onSelect={(badgeId) => {
                                  updateFeature(plan.id, feature.id, { badge: badgeId });
                                  setShowBadgePicker(null);
                                  featureInputRefs.current[feature.id]?.focus();
                                }}
                                onClose={() => setShowBadgePicker(null)}
                              />
                            )}
                          </div>

                          <div className="pf-feature-controls">
                            <button className="pf-move-btn" onClick={() => moveFeature(plan.id, feature.id, 'up')} disabled={idx === 0} title="نقل لأعلى">
                              <ArrowUpIcon className="icon-xs" />
                            </button>
                            <button className="pf-move-btn" onClick={() => moveFeature(plan.id, feature.id, 'down')} disabled={idx === filteredFeatures.length - 1} title="نقل لأسفل">
                              <ArrowDownIcon className="icon-xs" />
                            </button>
                            <button className="pf-remove-btn" onClick={() => removeFeature(plan.id, feature.id)} title="حذف">
                              <TrashIcon className="icon-xs" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pf-plan-footer">
                    <button className="pf-add-feature-btn" onClick={() => addFeature(plan.id, true)}>
                      <PlusIcon className="icon-sm" />
                      إضافة ميزة
                    </button>
                    <button className="pf-add-separator-btn" onClick={() => addSeparator(plan.id)}>
                      <MinusIcon className="icon-sm" />
                      فاصل
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductFeatures;
