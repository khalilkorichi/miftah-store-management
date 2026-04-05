import React, { useState } from 'react';
import AddProductModal from './AddProductModal';
import AddSupplierModal from './AddSupplierModal';
import ActivationMethodsModal from './ActivationMethodsModal';
import ImportSallaModal from './ImportSallaModal';
import ConfirmModal from './ConfirmModal';
import CompetitorsModal from './CompetitorsModal';
import {
  MessageCircleIcon, SendIcon, ShoppingCartIcon, EditIcon, XIcon,
  TagIcon, ChevronDownIcon, ChevronLeftIcon, TrashIcon, PlusCircleIcon,
  EyeIcon, StarIcon, PackageIcon, SearchIcon, PlusIcon, SettingsIcon,
  UserIcon, UsersIcon, CopyIcon, UploadIcon
} from './Icons';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format USD price with LTR isolation */
const fmtUsd = (val) => {
  if (!val || val === 0 || val === '0.00') return <span className="price-not-available">غير متوفر</span>;
  return (
    <span className="price-number" dir="ltr">
      ${Number(val).toFixed(2)}
    </span>
  );
};

/** Format SAR price with LTR isolation */
const fmtSar = (val) => {
  if (!val || val === 0 || val === '0.00') return <span className="price-not-available" style={{opacity: 0.5}}>-</span>;
  return (
    <span className="price-number" dir="ltr">
      {Number(val).toFixed(2)} <span className="currency-sym">﷼</span>
    </span>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** Single price cell (USD or SAR) */
function PriceCell({ value, isBest, isUsd, children }) {
  const isEmpty = value === 0 || value === '0.00' || value === 0.00;
  return (
    <td className={`td-price${isUsd ? ' td-usd' : ' td-sar'}${isBest ? ' best-price' : ''}${isEmpty ? ' price-empty' : ''}`}>
      {children}
    </td>
  );
}

/** Supplier column header */
function SupplierHeader({
  supplier,
  editingSupplierField,
  editSupplierValue,
  setEditSupplierValue,
  handleStartEditSupplier,
  handleSaveSupplier,
  onDeleteSupplier,
  requestConfirm,
}) {
  const isEditingName = editingSupplierField === `${supplier.id}-name`;

  const renderContactChip = (type, icon, label, href, color) => {
    const isEditing = editingSupplierField === `${supplier.id}-${type}`;
    const value = supplier[type];

    if (isEditing) {
      const placeholder =
        type === 'whatsapp'
          ? 'رقم الهاتف (مثال: 966500000000)'
          : type === 'telegram'
          ? 'اليوزرنيم (بدون @)'
          : 'رابط G2G الكامل';
      return (
        <input
          key={type}
          type="text"
          value={editSupplierValue}
          onChange={(e) => setEditSupplierValue(e.target.value)}
          onBlur={() => handleSaveSupplier(supplier.id, type)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveSupplier(supplier.id, type)}
          placeholder={placeholder}
          autoFocus
          className="contact-input"
          dir="ltr"
        />
      );
    }

    if (value) {
      const chipHref =
        type === 'whatsapp'
          ? `https://wa.me/${value.replace(/[^0-9]/g, '')}`
          : type === 'telegram'
          ? `https://t.me/${value.replace('@', '')}`
          : value;

      return (
        <a
          key={type}
          href={chipHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`contact-chip ${type}-chip`}
          title={`${label}: ${value}`}
          style={{ '--chip-color': color }}
        >
          <span className="chip-icon">{icon}</span>
          <span className="chip-label">{label}</span>
          <button
            className="chip-edit-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleStartEditSupplier(supplier.id, type, value);
            }}
            title="تعديل"
          >
            <EditIcon className="icon-sm" />
          </button>
        </a>
      );
    }

    return (
      <button
        key={type}
        className="contact-chip contact-chip-empty"
        onClick={() => handleStartEditSupplier(supplier.id, type, '')}
      >
        <span className="chip-icon">{icon}</span>
        <span className="chip-label">+ {label}</span>
      </button>
    );
  };

  return (
    <div className="supplier-header">
      {/* Name row */}
      <div className="supplier-name-row">
        {isEditingName ? (
          <input
            type="text"
            value={editSupplierValue}
            onChange={(e) => setEditSupplierValue(e.target.value)}
            onBlur={() => handleSaveSupplier(supplier.id, 'name')}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveSupplier(supplier.id, 'name')}
            autoFocus
            className="inline-edit-input supplier-name-input"
          />
        ) : (
          <span
            className="supplier-name"
            onClick={() => handleStartEditSupplier(supplier.id, 'name', supplier.name)}
            title="انقر للتعديل"
          >
            {supplier.name}
          </span>
        )}
      </div>

      {/* Contact buttons */}
      <div className="supplier-contacts-grid">
        {renderContactChip('whatsapp', <MessageCircleIcon className="icon-sm" />, 'واتساب', null, '#25d366')}
        {renderContactChip('telegram', <SendIcon className="icon-sm" />, 'تيليجرام', null, '#0088cc')}
        {renderContactChip('g2g', <ShoppingCartIcon className="icon-sm" />, 'G2G', null, '#ff6600')}
      </div>

      {/* Delete button — absolutely positioned */}
      <button
        className="btn-delete-supplier"
        onClick={() => {
          requestConfirm(
            'حذف المورد',
            `هل أنت متأكد من رغبتك في حذف المورد "${supplier.name}"؟`,
            () => onDeleteSupplier(supplier.id)
          );
        }}
        title="حذف المورد"
        aria-label={`حذف ${supplier.name}`}
      >
        <XIcon className="icon-sm" />
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

function ProductTable({
  products,
  suppliers,
  durations,
  exchangeRate,
  activationMethods = [],
  onUpdatePrice,
  onAddProduct,
  onDeleteProduct,
  onDuplicateProduct,
  onUpdateProductName,
  onUpdateProductAccountType,
  onAddPlan,
  onDeletePlan,
  onUpdatePlanDuration,
  onUpdateSupplier,
  onDeleteSupplier,
  onAddSupplier,
  onToggleProductMethod,
  onAddActivationMethodType,
  onDeleteActivationMethodType,
  onUpdateOfficialPrice,
  onAddCompetitor,
  onUpdateCompetitor,
  onDeleteCompetitor,
  onImportProducts,
}) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingName, setEditingName] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editingSupplierField, setEditingSupplierField] = useState(null);
  const [editSupplierValue, setEditSupplierValue] = useState('');
  const [expandedProducts, setExpandedProducts] = useState({});
  const [addingPlanFor, setAddingPlanFor] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [activationModalProduct, setActivationModalProduct] = useState(null);
  const [competitorsModalProduct, setCompetitorsModalProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImport, setShowImport] = useState(false);

  // Filter products by search query
  const filteredProducts = searchQuery.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  const handleCycleAccountType = (product) => {
    const current = product.accountType || 'none';
    const next = current === 'none' ? 'individual' : current === 'individual' ? 'team' : 'none';
    if (onUpdateProductAccountType) onUpdateProductAccountType(product.id, next);
  };

  // Custom Confirm Modal State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestConfirm = (title, message, onConfirm) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const closeConfirm = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };


  const getDurationLabel = (durationId) => {
    const dur = durations.find((d) => d.id === durationId);
    return dur ? dur.label : durationId;
  };

  const toggleExpand = (productId) => {
    setExpandedProducts((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleStartEditPrice = (productId, planId, supplierId, currentPrice) => {
    setEditingCell(`${productId}-${planId}-${supplierId}`);
    setEditValue(currentPrice.toString());
  };

  const handleSavePrice = (productId, planId, supplierId) => {
    onUpdatePrice(productId, planId, supplierId, editValue);
    setEditingCell(null);
  };

  const handleStartEditName = (productId, currentName) => {
    setEditingName(productId);
    setEditNameValue(currentName);
  };

  const handleSaveName = (productId) => {
    if (editNameValue.trim()) {
      onUpdateProductName(productId, editNameValue.trim());
    }
    setEditingName(null);
  };

  const handleStartEditSupplier = (supplierId, field, currentVal) => {
    setEditingSupplierField(`${supplierId}-${field}`);
    setEditSupplierValue(currentVal);
  };

  const handleSaveSupplier = (supplierId, field) => {
    onUpdateSupplier(supplierId, field, editSupplierValue);
    setEditingSupplierField(null);
  };

  const findBestPriceForPlan = (plan) => {
    let min = Infinity;
    let bestSupplierId = null;
    for (const [sid, price] of Object.entries(plan.prices)) {
      if (price > 0 && price < min) {
        min = price;
        bestSupplierId = parseInt(sid);
      }
    }
    return bestSupplierId;
  };

  const getAvailableDurations = (product) => {
    const usedIds = product.plans.map((p) => p.durationId);
    return durations.filter((d) => !usedIds.includes(d.id));
  };

  return (
    <div className="product-table-container">
      {/* ── Add Product Bar + Search ── */}
      <div className="add-product-bar">
        <button className="btn-add-product" onClick={() => setShowAddProduct(true)}>
          <PlusIcon className="icon-sm" /> إضافة منتج
        </button>
        <button className="btn-add-supplier" onClick={() => setShowAddSupplier(true)}>
          <PlusIcon className="icon-sm" /> إضافة مورد
        </button>
        <button className="btn-import-salla" onClick={() => setShowImport(true)}>
          <UploadIcon className="icon-sm" /> استيراد من سلة
        </button>
        <div className="search-bar-wrapper">
          <SearchIcon className="search-icon icon-sm" aria-hidden="true" />
          <input
            type="text"
            className="search-bar"
            placeholder="بحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="بحث عن منتج"
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="مسح البحث"
            >
              <XIcon className="icon-xs" />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="table-wrapper" dir="rtl">
        <table className="products-table" role="table" aria-label="جدول مقارنة أسعار الموردين">
          <thead>
            {/* Row 1: Column group headers */}
            <tr>
              <th className="th-num th-sticky th-sticky-1" scope="col">#</th>
              <th className="th-product th-sticky th-sticky-2" scope="col">المنتج</th>
              <th className="th-plan th-sticky th-sticky-3" scope="col">الخطة</th>
              {/* Official Price Header */}
              <th className="th-official-price" colSpan="2" scope="col" title="سعر الاشتراك الرسمي للمنتج">
                <div className="official-price-header">
                  <TagIcon className="icon-sm" style={{ opacity: 0.8 }} />
                  <span>السعر الرسمي</span>
                </div>
              </th>
              {/* Suppliers */}
              {suppliers.map((supplier) => (
                <th key={supplier.id} className="th-supplier" colSpan="2" scope="col">
                  <SupplierHeader
                    supplier={supplier}
                    editingSupplierField={editingSupplierField}
                    editSupplierValue={editSupplierValue}
                    setEditSupplierValue={setEditSupplierValue}
                    handleStartEditSupplier={handleStartEditSupplier}
                    handleSaveSupplier={handleSaveSupplier}
                    onDeleteSupplier={onDeleteSupplier}
                    requestConfirm={requestConfirm}
                  />
                </th>
              ))}
              <th className="th-actions" scope="col">إجراءات</th>
            </tr>

            {/* Row 2: USD / SAR sub-headers */}
            <tr className="sub-header">
              <th className="th-sticky th-sticky-1" />
              <th className="th-sticky th-sticky-2" />
              <th className="th-sticky th-sticky-3" />
              {/* Official Price Subheaders */}
              <th className="th-price-usd" scope="col" dir="ltr">
                <span>$ دولار</span>
              </th>
              <th className="th-price-sar" scope="col" dir="ltr">
                <span>﷼ ريال</span>
              </th>
              {/* Suppliers Subheaders */}
              {suppliers.map((supplier) => (
                <React.Fragment key={`sub-${supplier.id}`}>
                  <th className="th-price-usd" scope="col" dir="ltr">
                    <span>$ دولار</span>
                  </th>
                  <th className="th-price-sar" scope="col" dir="ltr">
                    <span>﷼</span>
                  </th>
                </React.Fragment>
              ))}
              <th />
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product, index) => {
              const isExpanded = !!expandedProducts[product.id];
              const plansToShow = isExpanded ? product.plans : [];
              const availableDurations = getAvailableDurations(product);
              const planRowCount = plansToShow.length;
              const assignedMethods = (product.activationMethods || [])
                .map((mId) => activationMethods.find((x) => x.id === mId))
                .filter(Boolean);

              return (
                <React.Fragment key={product.id}>
                  {/* ── Product header row ── */}
                  <tr className="product-header-row">
                    {/* Index */}
                    <td
                      className="td-num td-sticky td-sticky-1"
                      rowSpan={isExpanded ? planRowCount + 1 : 1}
                    >
                      <span className="row-index">{index + 1}</span>
                    </td>

                    {/* Product name spans only its own column */}
                    <td
                      className="td-product td-sticky td-sticky-2"
                      style={{ paddingRight: 0, cursor: 'pointer' }}
                      onClick={() => toggleExpand(product.id)}
                    >
                      <div className="product-name-row">
                        <button
                          className="btn-expand"
                          style={{ pointerEvents: 'none' }}
                          title={isExpanded ? 'طي الخطط' : 'عرض الخطط'}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? <ChevronDownIcon className="icon-sm" /> : <ChevronLeftIcon className="icon-sm" />}
                        </button>

                        {editingName === product.id ? (
                          <input
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onBlur={() => handleSaveName(product.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName(product.id)}
                            autoFocus
                            className="inline-edit-input product-name-input"
                            dir="rtl"
                          />
                        ) : (
                          <span
                            className="product-name"
                            onClick={(e) => { e.stopPropagation(); handleStartEditName(product.id, product.name); }}
                            title="انقر للتعديل"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { e.stopPropagation(); e.key === 'Enter' && handleStartEditName(product.id, product.name); }}
                          >
                            {product.name}
                          </span>
                        )}
                        {/* Account Type Chip */}
                        <div 
                          className={`account-type-badge type-${product.accountType || 'none'}`}
                          onClick={(e) => { e.stopPropagation(); handleCycleAccountType(product); }}
                          title={`نوع الحساب: ${(product.accountType === 'individual' ? 'فردي' : product.accountType === 'team' ? 'فريق' : 'غير محدد')} (انقر للتغيير)`}
                        >
                          {(product.accountType || 'none') === 'none' && <UserIcon className="icon-xs" style={{ opacity: 0.5 }} />}
                          {product.accountType === 'individual' && <><UserIcon className="icon-xs" /> <span>فردي</span></>}
                          {product.accountType === 'team' && <><UsersIcon className="icon-xs" /> <span>فريق</span></>}
                        </div>
                      </div>
                    </td>

                    {/* Plan column for the badge securely aligned */}
                    <td 
                      className="td-plan td-sticky td-sticky-3"
                      style={{ cursor: 'pointer', textAlign: 'center', verticalAlign: 'middle' }}
                      onClick={() => toggleExpand(product.id)}
                    >
                      <span className="plan-count-badge" style={{ margin: '0 auto' }}>
                        {product.plans.length} {product.plans.length === 1 ? 'خطة' : 'خطط'}
                      </span>
                    </td>

                    {/* Suppliers columns spanned for activation methods */}
                    <td 
                      colSpan={2 + (suppliers.length > 0 ? suppliers.length * 2 : 0)}
                      style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                      onClick={() => toggleExpand(product.id)}
                    >
                      {/* ── Activation method chips ── */}
                      <div className="act-chips-row" style={{ margin: 0, justifyContent: 'flex-start', padding: '0 10px' }}>
                        {assignedMethods.map((m) => (
                          <span
                            key={m.id}
                            className="act-chip"
                            style={{ '--act-color': m.color }}
                            title={m.description || m.label}
                          >
                            {m.icon} {m.label}
                          </span>
                        ))}
                        <button
                          className="act-chip-add"
                          onClick={(e) => { e.stopPropagation(); setActivationModalProduct(product); }}
                          title="إدارة طرق التفعيل"
                        >
                          {assignedMethods.length === 0 ? <><PlusCircleIcon className="icon-xs" /> طريقة تفعيل</> : <><SettingsIcon className="icon-xs" /> تعديل</>}
                        </button>
                        
                        <button
                          className="competitors-chip"
                          onClick={(e) => { e.stopPropagation(); setCompetitorsModalProduct(product); }}
                          title="مراقبة المنافسين"
                        >
                          <EyeIcon className="icon-sm" /> المنافسين {(product.competitors && product.competitors.length > 0) ? `(${product.competitors.length})` : ''}
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="td-actions" style={{ verticalAlign: 'middle', borderTop: '8px solid var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                      <div className="actions-group">
                        {isExpanded && availableDurations.length > 0 && (
                          addingPlanFor === product.id ? (
                            <div className="add-plan-inline">
                              <select
                                className="plan-duration-select"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    onAddPlan(product.id, e.target.value);
                                    setAddingPlanFor(null);
                                  }
                                }}
                                autoFocus
                                onBlur={() => setAddingPlanFor(null)}
                                dir="rtl"
                              >
                                <option value="">اختر المدة...</option>
                                {availableDurations.map((d) => (
                                  <option key={d.id} value={d.id}>{d.label}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <button
                              className="btn-add-plan"
                              onClick={() => setAddingPlanFor(product.id)}
                              title="إضافة خطة"
                            >
                              <PlusIcon className="icon-sm" /> خطة
                            </button>
                          )
                        )}
                        <button
                          className="btn-delete-product"
                          onClick={() => {
                            requestConfirm(
                              'حذف منتج',
                              `هل أنت متأكد من رغبتك في حذف المنتج "${product.name}"؟ سيتم حذف جميع خططه أيضاً.`,
                              () => onDeleteProduct(product.id)
                            );
                          }}
                          title="حذف المنتج"
                          aria-label={`حذف ${product.name}`}
                        >
                          <TrashIcon className="icon-sm" />
                        </button>
                        <button
                          className="btn-duplicate-product"
                          onClick={() => onDuplicateProduct(product.id)}
                          title="تكرار المنتج"
                          aria-label={`تكرار ${product.name}`}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            padding: '6px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            marginLeft: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--primary-color)';
                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                            e.currentTarget.style.background = 'rgba(26, 81, 244, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.background = 'none';
                          }}
                        >
                          <CopyIcon className="icon-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ── Plan rows ── */}
                  {plansToShow.map((plan, planIdx) => {
                    const bestSupplierId = findBestPriceForPlan(plan);
                    const isLastPlan = planIdx === plansToShow.length - 1;
                    return (
                      <tr
                        key={`${product.id}-${plan.id}`}
                        className={`plan-row${isLastPlan ? ' plan-row-last' : ''}`}
                      >
                        {/* Empty cell under product column (sticky) */}
                        <td className="td-product-empty td-sticky td-sticky-2" />

                        {/* Plan duration tag */}
                        <td className="td-plan-name td-sticky td-sticky-3">
                          <div className="plan-info">
                            <span className="plan-duration-tag">
                              {getDurationLabel(plan.durationId)}
                            </span>
                          </div>
                        </td>

                        {/* Official Price Cells */}
                        <React.Fragment key={`${product.id}-${plan.id}-official`}>
                          {/* Official Price USD */}
                          <td className="td-price td-usd official-price-cell">
                            {editingCell === `${product.id}-${plan.id}-official-usd` ? (
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => {
                                  onUpdateOfficialPrice(product.id, plan.id, editValue);
                                  setEditingCell(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    onUpdateOfficialPrice(product.id, plan.id, editValue);
                                    setEditingCell(null);
                                  }
                                }}
                                step="0.01"
                                min="0"
                                autoFocus
                                className="price-edit-input"
                                dir="ltr"
                              />
                            ) : (
                              <button
                                className="price-display official-price-btn"
                                onClick={() => {
                                  setEditingCell(`${product.id}-${plan.id}-official-usd`);
                                  setEditValue((plan.officialPriceUsd || 0).toString());
                                }}
                                title="تعديل السعر الرسمي بالدولار"
                                dir="ltr"
                              >
                                {fmtUsd(plan.officialPriceUsd || 0)}
                              </button>
                            )}
                          </td>
                          {/* Official Price SAR */}
                          <td className="td-price td-sar official-price-cell-sar">
                            {editingCell === `${product.id}-${plan.id}-official-sar` ? (
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => {
                                  // Convert SAR to USD before saving
                                  const sarVal = parseFloat(editValue) || 0;
                                  const usdVal = sarVal / exchangeRate;
                                  onUpdateOfficialPrice(product.id, plan.id, usdVal);
                                  setEditingCell(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const sarVal = parseFloat(editValue) || 0;
                                    const usdVal = sarVal / exchangeRate;
                                    onUpdateOfficialPrice(product.id, plan.id, usdVal);
                                    setEditingCell(null);
                                  }
                                }}
                                step="any"
                                min="0"
                                autoFocus
                                className="price-edit-input"
                                dir="ltr"
                              />
                            ) : (
                              <button
                                className="price-display official-price-btn"
                                onClick={() => {
                                  setEditingCell(`${product.id}-${plan.id}-official-sar`);
                                  const sarVal = (plan.officialPriceUsd || 0) * exchangeRate;
                                  // Fix SAR value to 2 decimals for editing friendliness
                                  setEditValue(sarVal.toFixed(2));
                                }}
                                title="تعديل السعر الرسمي بالريال"
                                dir="ltr"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {fmtSar((plan.officialPriceUsd || 0) * exchangeRate)}
                              </button>
                            )}
                          </td>
                        </React.Fragment>

                        {/* Price cells per supplier */}
                        {suppliers.map((supplier) => {
                          const priceUsd = plan.prices[supplier.id] || 0;
                          const priceSar = (priceUsd * exchangeRate);
                          const isBest = supplier.id === bestSupplierId;
                          const cellKey = `${product.id}-${plan.id}-${supplier.id}`;

                          return (
                            <React.Fragment key={cellKey}>
                              {/* USD cell */}
                              <PriceCell value={priceUsd} isBest={isBest} isUsd>
                                {editingCell === cellKey ? (
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => handleSavePrice(product.id, plan.id, supplier.id)}
                                    onKeyDown={(e) =>
                                      e.key === 'Enter' &&
                                      handleSavePrice(product.id, plan.id, supplier.id)
                                    }
                                    step="0.01"
                                    min="0"
                                    autoFocus
                                    className="price-edit-input"
                                    dir="ltr"
                                  />
                                ) : (
                                  <button
                                    className="price-display"
                                    onClick={() =>
                                      handleStartEditPrice(product.id, plan.id, supplier.id, priceUsd)
                                    }
                                    title="انقر للتعديل"
                                    dir="ltr"
                                  >
                                    {fmtUsd(priceUsd)}
                                    {isBest && <span className="best-badge flex-center" aria-label="أفضل سعر"><StarIcon className="icon-xs" /></span>}
                                  </button>
                                )}
                              </PriceCell>

                              {/* SAR cell */}
                              <PriceCell value={priceSar} isBest={isBest} isUsd={false}>
                                <span className="price-sar-display" dir="ltr">
                                  {fmtSar(priceSar)}
                                </span>
                              </PriceCell>
                            </React.Fragment>
                          );
                        })}

                        {/* Actions */}
                        <td className="td-actions" style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          {product.plans.length > 1 && (
                            <button
                              className="btn-delete-plan"
                              onClick={() => {
                                requestConfirm(
                                  'حذف الخطة',
                                  `هل أنت متأكد من رغبتك في حذف خطة "${getDurationLabel(plan.durationId)}"؟`,
                                  () => onDeletePlan(product.id, plan.id)
                                );
                              }}
                              title="حذف الخطة"
                              aria-label={`حذف خطة ${getDurationLabel(plan.durationId)}`}
                            >
                              حذف
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* "Show more" indicator */}
                  {!isExpanded && product.plans.length > 1 && (
                    <tr className="show-more-row">
                      <td colSpan={5 + suppliers.length * 2}>
                        <button className="btn-show-more flex-row justify-center gap-2 align-center" onClick={() => toggleExpand(product.id)}>
                          عرض {product.plans.length - 1} خطط أخرى <ChevronLeftIcon className="icon-sm" />
                        </button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="empty-state" role="status">
          <PackageIcon className="empty-icon icon-xl" aria-hidden="true" />
          <p>لا توجد منتجات حالياً. أضف منتجاً جديداً للبدء!</p>
        </div>
      )}

      {/* ── Modals ── */}
      <AddProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onConfirm={(productData) => onAddProduct(productData.name, productData.plans, productData.activationMethods)}
        durations={durations}
        suppliers={suppliers}
        allMethods={activationMethods}
      />
      <AddSupplierModal
        isOpen={showAddSupplier}
        onClose={() => setShowAddSupplier(false)}
        onConfirm={(supplierData) => onAddSupplier(supplierData)}
      />
      <ActivationMethodsModal
        isOpen={!!activationModalProduct}
        product={activationModalProduct}
        onClose={() => setActivationModalProduct(null)}
        allMethods={activationMethods}
        onToggleMethod={onToggleProductMethod}
        onAddMethodType={onAddActivationMethodType}
        onDeleteMethodType={onDeleteActivationMethodType}
      />

      <CompetitorsModal
        isOpen={!!competitorsModalProduct}
        product={competitorsModalProduct}
        onClose={() => setCompetitorsModalProduct(null)}
        onAddCompetitor={onAddCompetitor}
        onUpdateCompetitor={onUpdateCompetitor}
        onDeleteCompetitor={onDeleteCompetitor}
      />

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />

      <ImportSallaModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={(importedProducts) => {
          onImportProducts(importedProducts);
          setShowImport(false);
        }}
        existingProducts={products}
        durations={durations}
        suppliers={suppliers}
      />
    </div>
  );
}

export default ProductTable;
