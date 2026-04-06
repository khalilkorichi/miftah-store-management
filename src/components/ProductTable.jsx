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
  UserIcon, UsersIcon, CopyIcon, UploadIcon, ShieldCheckIcon
} from './Icons';

const fmtNum = (val) => {
  if (val === null || val === undefined) return '0';
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function SupplierManagerPanel({ suppliers, editingSupplierField, editSupplierValue, setEditSupplierValue, handleStartEditSupplier, handleSaveSupplier, onDeleteSupplier, onAddSupplier, requestConfirm, setShowAddSupplier }) {
  const [isOpen, setIsOpen] = useState(false);

  const renderContactLink = (supplier, type, icon, label, color) => {
    const isEditing = editingSupplierField === `${supplier.id}-${type}`;
    const value = supplier[type];

    if (isEditing) {
      const placeholder = type === 'whatsapp' ? 'رقم الهاتف' : type === 'telegram' ? 'اليوزرنيم' : 'رابط G2G';
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
      const safeUrl = type === 'whatsapp' ? `https://wa.me/${value.replace(/[^0-9]/g, '')}` : type === 'telegram' ? `https://t.me/${value.replace('@', '')}` : (/^https?:\/\//i.test(value) ? value : `https://${value}`);
      return (
        <div key={type} className={`supplier-contact-link ${type}`} style={{ '--chip-color': color }} title={`${label}: ${value}`}>
          <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="contact-link-inner">
            <span className="chip-icon">{icon}</span>
            <span>{label}</span>
          </a>
          <div className="supplier-contact-actions">
            <button className="chip-copy-btn" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(safeUrl); const btn = e.currentTarget; btn.classList.add('copied'); setTimeout(() => btn.classList.remove('copied'), 1200); }} title="نسخ الرابط">
              <CopyIcon className="icon-sm" />
            </button>
            <button className="chip-edit-btn" onClick={(e) => { e.stopPropagation(); handleStartEditSupplier(supplier.id, type, value); }} title="تعديل">
              <EditIcon className="icon-sm" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <button key={type} className="supplier-contact-link empty" onClick={() => handleStartEditSupplier(supplier.id, type, '')}>
        <span className="chip-icon">{icon}</span>
        <span>+ {label}</span>
      </button>
    );
  };

  return (
    <div className="supplier-manager-panel">
      <button className="supplier-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        <UsersIcon className="icon-sm" />
        <span>إدارة الموردين ({suppliers.length})</span>
        {isOpen ? <ChevronDownIcon className="icon-sm" /> : <ChevronLeftIcon className="icon-sm" />}
      </button>
      {isOpen && (
        <div className="supplier-panel-content">
          <div className="supplier-cards-grid">
            {suppliers.map((supplier) => {
              const isEditingName = editingSupplierField === `${supplier.id}-name`;
              return (
                <div key={supplier.id} className="supplier-mini-card">
                  <div className="supplier-mini-header">
                    {isEditingName ? (
                      <input type="text" value={editSupplierValue} onChange={(e) => setEditSupplierValue(e.target.value)} onBlur={() => handleSaveSupplier(supplier.id, 'name')} onKeyDown={(e) => e.key === 'Enter' && handleSaveSupplier(supplier.id, 'name')} autoFocus className="inline-edit-input" />
                    ) : (
                      <span className="supplier-mini-name" onClick={() => handleStartEditSupplier(supplier.id, 'name', supplier.name)} title="انقر للتعديل">{supplier.name}</span>
                    )}
                    <button className="btn-icon-danger" onClick={() => requestConfirm('حذف المورد', `هل أنت متأكد من رغبتك في حذف المورد "${supplier.name}"؟`, () => onDeleteSupplier(supplier.id))} title="حذف المورد">
                      <XIcon className="icon-sm" />
                    </button>
                  </div>
                  <div className="supplier-mini-contacts">
                    {renderContactLink(supplier, 'whatsapp', <MessageCircleIcon className="icon-sm" />, 'واتساب', '#25d366')}
                    {renderContactLink(supplier, 'telegram', <SendIcon className="icon-sm" />, 'تيليجرام', '#0088cc')}
                    {renderContactLink(supplier, 'g2g', <ShoppingCartIcon className="icon-sm" />, 'G2G', '#ff6600')}
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn-add-supplier-panel" onClick={() => setShowAddSupplier(true)}>
            <PlusIcon className="icon-sm" /> إضافة مورد جديد
          </button>
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product, index, suppliers, durations, exchangeRate, activationMethods,
  editingCell, setEditingCell, editValue, setEditValue,
  editingName, setEditingName, editNameValue, setEditNameValue,
  onUpdatePrice, onDeleteProduct, onDuplicateProduct, onUpdateProductName,
  onUpdateProductAccountType, onAddPlan, onDeletePlan, onUpdatePlanDuration,
  onToggleProductMethod, onUpdateOfficialPrice, onUpdateWarranty, requestConfirm,
  setActivationModalProduct, setCompetitorsModalProduct,
  getDurationLabel, getAvailableDurations
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [addingPlan, setAddingPlan] = useState(false);

  const assignedMethods = (product.activationMethods || [])
    .map((mId) => activationMethods.find((x) => x.id === mId))
    .filter(Boolean);

  const handleCycleAccountType = () => {
    const current = product.accountType || 'none';
    const next = current === 'none' ? 'individual' : current === 'individual' ? 'team' : 'none';
    if (onUpdateProductAccountType) onUpdateProductAccountType(product.id, next);
  };

  const handleStartEditName = () => {
    setEditingName(product.id);
    setEditNameValue(product.name);
  };

  const handleSaveName = () => {
    if (editNameValue.trim()) {
      onUpdateProductName(product.id, editNameValue.trim());
    }
    setEditingName(null);
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

  const availableDurations = getAvailableDurations(product);

  return (
    <div className="product-card">
      <div className="product-card-header">
        <div className="product-card-title-row">
          <span className="product-card-index">{index + 1}</span>
          <div className="product-card-name-area">
            {editingName === product.id ? (
              <input
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
                className="inline-edit-input product-card-name-input"
                dir="rtl"
              />
            ) : (
              <h3 className="product-card-name" onClick={handleStartEditName} title="انقر للتعديل">
                {product.name}
              </h3>
            )}
            <div className={`account-type-badge type-${product.accountType || 'none'}`} onClick={handleCycleAccountType} title={`نوع الحساب: ${product.accountType === 'individual' ? 'فردي' : product.accountType === 'team' ? 'فريق' : 'غير محدد'} (انقر للتغيير)`}>
              {(product.accountType || 'none') === 'none' && <UserIcon className="icon-xs" style={{ opacity: 0.5 }} />}
              {product.accountType === 'individual' && <><UserIcon className="icon-xs" /> <span>فردي</span></>}
              {product.accountType === 'team' && <><UsersIcon className="icon-xs" /> <span>فريق</span></>}
            </div>
          </div>
        </div>

        <div className="product-card-actions-top">
          <button className="btn-card-action" onClick={() => onDuplicateProduct(product.id)} title="تكرار المنتج">
            <CopyIcon className="icon-sm" />
          </button>
          <button className="btn-card-action danger" onClick={() => requestConfirm('حذف منتج', `هل أنت متأكد من رغبتك في حذف المنتج "${product.name}"؟ سيتم حذف جميع خططه أيضاً.`, () => onDeleteProduct(product.id))} title="حذف المنتج">
            <TrashIcon className="icon-sm" />
          </button>
        </div>
      </div>

      <div className="product-card-meta">
        {assignedMethods.length > 0 && (
          <div className="product-card-methods">
            {assignedMethods.map((m) => (
              <span key={m.id} className="act-chip" style={{ '--act-color': m.color }} title={m.description || m.label}>
                {m.icon} {m.label}
              </span>
            ))}
          </div>
        )}
        <div className="product-card-quick-actions">
          <button className="btn-chip-action" onClick={() => setActivationModalProduct(product)} title="إدارة طرق التفعيل">
            {assignedMethods.length === 0 ? <><PlusCircleIcon className="icon-xs" /> طريقة تفعيل</> : <><SettingsIcon className="icon-xs" /> التفعيل</>}
          </button>
          <button className="btn-chip-action competitors" onClick={() => setCompetitorsModalProduct(product)} title="مراقبة المنافسين">
            <EyeIcon className="icon-xs" /> المنافسين {product.competitors?.length > 0 ? `(${product.competitors.length})` : ''}
          </button>
        </div>
      </div>

      <div className="product-card-plans">
        <div className="plans-header-row">
          <span className="plans-label">
            <TagIcon className="icon-sm" /> الخطط ({product.plans.length})
          </span>
          <button className="btn-toggle-plans" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
            {isExpanded ? <ChevronDownIcon className="icon-sm" /> : <ChevronLeftIcon className="icon-sm" />}
          </button>
        </div>

        <div className="plans-summary">
          {product.plans.map((plan) => {
            const bestSupplierId = findBestPriceForPlan(plan);
            const bestPrice = bestSupplierId ? plan.prices[bestSupplierId] : null;
            return (
              <div key={plan.id} className="plan-summary-chip">
                <span className="plan-chip-duration">{getDurationLabel(plan.durationId)}</span>
                {bestPrice ? (
                  <span className="plan-chip-price best">${fmtNum(bestPrice)}</span>
                ) : (
                  <span className="plan-chip-price empty">غير مسعّر</span>
                )}
                {(plan.warrantyDays > 0) && (
                  <span className="plan-chip-warranty" title={`ضمان ${plan.warrantyDays} يوم`}>
                    <ShieldCheckIcon className="icon-xs" /> {plan.warrantyDays}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {isExpanded && (
          <div className="plans-detail-section">
            {product.plans.map((plan) => {
              const bestSupplierId = findBestPriceForPlan(plan);
              return (
                <div key={plan.id} className="plan-detail-card">
                  <div className="plan-detail-header">
                    <span className="plan-duration-tag">{getDurationLabel(plan.durationId)}</span>
                    {product.plans.length > 1 && (
                      <button className="btn-delete-plan" onClick={() => requestConfirm('حذف الخطة', `هل أنت متأكد من رغبتك في حذف خطة "${getDurationLabel(plan.durationId)}"؟`, () => onDeletePlan(product.id, plan.id))}>حذف</button>
                    )}
                  </div>

                  <div className="plan-warranty-row">
                    <span className="plan-warranty-label"><ShieldCheckIcon className="icon-xs" /> الضمان:</span>
                    {editingCell === `${product.id}-${plan.id}-warranty` ? (
                      <div className="warranty-edit-wrap">
                        <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => { onUpdateWarranty(product.id, plan.id, editValue); setEditingCell(null); }} onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateWarranty(product.id, plan.id, editValue); setEditingCell(null); } }} min="0" max="365" autoFocus className="warranty-edit-input" dir="ltr" />
                        <span className="warranty-unit">يوم</span>
                      </div>
                    ) : (
                      <button className="warranty-display" onClick={() => { setEditingCell(`${product.id}-${plan.id}-warranty`); setEditValue((plan.warrantyDays || 0).toString()); }}>
                        {plan.warrantyDays > 0 ? (
                          <span className="warranty-value active">{plan.warrantyDays} يوم</span>
                        ) : (
                          <span className="warranty-value empty">تحديد الضمان</span>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="plan-official-price">
                    <span className="plan-price-label">السعر الرسمي:</span>
                    <div className="plan-price-values">
                      {editingCell === `${product.id}-${plan.id}-official-usd` ? (
                        <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => { onUpdateOfficialPrice(product.id, plan.id, editValue); setEditingCell(null); }} onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateOfficialPrice(product.id, plan.id, editValue); setEditingCell(null); } }} step="0.01" min="0" autoFocus className="price-edit-input" dir="ltr" />
                      ) : (
                        <button className="price-display official" onClick={() => { setEditingCell(`${product.id}-${plan.id}-official-usd`); setEditValue((plan.officialPriceUsd || 0).toString()); }} dir="ltr">
                          {plan.officialPriceUsd ? `$${fmtNum(plan.officialPriceUsd)}` : <span className="price-not-set">تحديد السعر</span>}
                        </button>
                      )}
                      {plan.officialPriceUsd > 0 && (
                        <span className="official-sar">{fmtNum(plan.officialPriceUsd * exchangeRate)} ﷼</span>
                      )}
                    </div>
                  </div>

                  <div className="plan-suppliers-grid">
                    {suppliers.map((supplier) => {
                      const priceUsd = plan.prices[supplier.id] || 0;
                      const isBest = supplier.id === bestSupplierId;
                      const cellKey = `${product.id}-${plan.id}-${supplier.id}`;
                      return (
                        <div key={supplier.id} className={`supplier-price-row ${isBest ? 'best' : ''}`}>
                          <span className="supplier-price-name">{supplier.name}</span>
                          <div className="supplier-price-values">
                            {editingCell === cellKey ? (
                              <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => { onUpdatePrice(product.id, plan.id, supplier.id, editValue); setEditingCell(null); }} onKeyDown={(e) => { if (e.key === 'Enter') { onUpdatePrice(product.id, plan.id, supplier.id, editValue); setEditingCell(null); } }} step="0.01" min="0" autoFocus className="price-edit-input" dir="ltr" />
                            ) : (
                              <button className="price-display" onClick={() => { setEditingCell(cellKey); setEditValue(priceUsd.toString()); }} dir="ltr">
                                {priceUsd > 0 ? `$${fmtNum(priceUsd)}` : <span className="price-not-set">--</span>}
                                {isBest && <StarIcon className="icon-xs best-star" />}
                              </button>
                            )}
                            {priceUsd > 0 && (
                              <span className="supplier-sar">{fmtNum(priceUsd * exchangeRate)} ﷼</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {availableDurations.length > 0 && (
              <div className="add-plan-area">
                {addingPlan ? (
                  <select className="plan-duration-select" onChange={(e) => { if (e.target.value) { onAddPlan(product.id, e.target.value); setAddingPlan(false); } }} autoFocus onBlur={() => setAddingPlan(false)} dir="rtl">
                    <option value="">اختر المدة...</option>
                    {availableDurations.map((d) => (<option key={d.id} value={d.id}>{d.label}</option>))}
                  </select>
                ) : (
                  <button className="btn-add-plan" onClick={() => setAddingPlan(true)}>
                    <PlusIcon className="icon-sm" /> إضافة خطة
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductTable({
  products, suppliers, durations, exchangeRate, activationMethods = [],
  onUpdatePrice, onAddProduct, onDeleteProduct, onDuplicateProduct,
  onUpdateProductName, onUpdateProductAccountType, onAddPlan, onDeletePlan,
  onUpdatePlanDuration, onUpdateSupplier, onDeleteSupplier, onAddSupplier,
  onToggleProductMethod, onAddActivationMethodType, onDeleteActivationMethodType,
  onUpdateOfficialPrice, onUpdateWarranty, onAddCompetitor, onUpdateCompetitor, onDeleteCompetitor,
  onImportProducts,
}) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingName, setEditingName] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editingSupplierField, setEditingSupplierField] = useState(null);
  const [editSupplierValue, setEditSupplierValue] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [activationModalProduct, setActivationModalProduct] = useState(null);
  const [competitorsModalProduct, setCompetitorsModalProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImport, setShowImport] = useState(false);

  const filteredProducts = searchQuery.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const requestConfirm = (title, message, onConfirm) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm: () => { onConfirm(); setConfirmDialog((prev) => ({ ...prev, isOpen: false })); } });
  };
  const closeConfirm = () => setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

  const getDurationLabel = (durationId) => {
    const dur = durations.find((d) => d.id === durationId);
    return dur ? dur.label : durationId;
  };

  const getAvailableDurations = (product) => {
    const usedIds = product.plans.map((p) => p.durationId);
    return durations.filter((d) => !usedIds.includes(d.id));
  };

  const handleStartEditSupplier = (supplierId, field, currentVal) => {
    setEditingSupplierField(`${supplierId}-${field}`);
    setEditSupplierValue(currentVal);
  };

  const handleSaveSupplier = (supplierId, field) => {
    onUpdateSupplier(supplierId, field, editSupplierValue);
    setEditingSupplierField(null);
  };

  return (
    <div className="product-cards-container">
      <div className="cards-toolbar">
        <div className="toolbar-actions">
          <button className="btn-add-product" onClick={() => setShowAddProduct(true)}>
            <PlusIcon className="icon-sm" /> إضافة منتج
          </button>
          <button className="btn-import-salla" onClick={() => setShowImport(true)}>
            <UploadIcon className="icon-sm" /> استيراد من سلة
          </button>
        </div>
        <div className="toolbar-search">
          <SearchIcon className="search-icon icon-sm" />
          <input type="text" className="search-bar" placeholder="بحث عن منتج..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <XIcon className="icon-xs" />
            </button>
          )}
        </div>
      </div>

      <SupplierManagerPanel
        suppliers={suppliers}
        editingSupplierField={editingSupplierField}
        editSupplierValue={editSupplierValue}
        setEditSupplierValue={setEditSupplierValue}
        handleStartEditSupplier={handleStartEditSupplier}
        handleSaveSupplier={handleSaveSupplier}
        onDeleteSupplier={onDeleteSupplier}
        onAddSupplier={onAddSupplier}
        requestConfirm={requestConfirm}
        setShowAddSupplier={setShowAddSupplier}
      />

      {filteredProducts.length > 0 ? (
        <div className="products-grid">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              suppliers={suppliers}
              durations={durations}
              exchangeRate={exchangeRate}
              activationMethods={activationMethods}
              editingCell={editingCell}
              setEditingCell={setEditingCell}
              editValue={editValue}
              setEditValue={setEditValue}
              editingName={editingName}
              setEditingName={setEditingName}
              editNameValue={editNameValue}
              setEditNameValue={setEditNameValue}
              onUpdatePrice={onUpdatePrice}
              onDeleteProduct={onDeleteProduct}
              onDuplicateProduct={onDuplicateProduct}
              onUpdateProductName={onUpdateProductName}
              onUpdateProductAccountType={onUpdateProductAccountType}
              onAddPlan={onAddPlan}
              onDeletePlan={onDeletePlan}
              onUpdatePlanDuration={onUpdatePlanDuration}
              onToggleProductMethod={onToggleProductMethod}
              onUpdateOfficialPrice={onUpdateOfficialPrice}
              onUpdateWarranty={onUpdateWarranty}
              requestConfirm={requestConfirm}
              setActivationModalProduct={setActivationModalProduct}
              setCompetitorsModalProduct={setCompetitorsModalProduct}
              getDurationLabel={getDurationLabel}
              getAvailableDurations={getAvailableDurations}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <PackageIcon className="empty-icon icon-xl" />
          <p>{searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد منتجات حالياً. أضف منتجاً جديداً للبدء!'}</p>
        </div>
      )}

      <AddProductModal isOpen={showAddProduct} onClose={() => setShowAddProduct(false)} onConfirm={(productData) => onAddProduct(productData.name, productData.plans, productData.activationMethods, productData.accountType || 'none')} durations={durations} suppliers={suppliers} allMethods={activationMethods} />
      <AddSupplierModal isOpen={showAddSupplier} onClose={() => setShowAddSupplier(false)} onConfirm={(supplierData) => onAddSupplier(supplierData)} />
      <ActivationMethodsModal isOpen={!!activationModalProduct} product={activationModalProduct} onClose={() => setActivationModalProduct(null)} allMethods={activationMethods} onToggleMethod={onToggleProductMethod} onAddMethodType={onAddActivationMethodType} onDeleteMethodType={onDeleteActivationMethodType} />
      <CompetitorsModal isOpen={!!competitorsModalProduct} product={competitorsModalProduct} onClose={() => setCompetitorsModalProduct(null)} onAddCompetitor={onAddCompetitor} onUpdateCompetitor={onUpdateCompetitor} onDeleteCompetitor={onDeleteCompetitor} />
      <ConfirmModal isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={closeConfirm} />
      <ImportSallaModal isOpen={showImport} onClose={() => setShowImport(false)} onImport={(importedProducts) => { onImportProducts(importedProducts); setShowImport(false); }} existingProducts={products} durations={durations} suppliers={suppliers} />
    </div>
  );
}

export default ProductTable;
