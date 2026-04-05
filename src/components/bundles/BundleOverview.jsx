import React, { useState } from 'react';
import { BarChartIcon, TrendingUpIcon, TrendingDownIcon, CheckCircleIcon, PackageIcon, EditIcon, ClipboardIcon, TrashIcon } from '../Icons';

const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function BundleOverview({ bundles, setBundles, products, getSupplierPrice, costs, setBundleToEdit, setActiveSubTab }) {
  const [expandedBundleId, setExpandedBundleId] = useState(null);
  
  const calculateBundleCosts = (b) => {
    let fixed = 0;
    let percents = 0;
    costs.filter(c => c.active).forEach(c => {
      if (c.type === 'fixed') fixed += c.value;
      else if (c.type === 'percentage') percents += c.value / 100;
    });
    const totalBaseCost = b.productIds.reduce((sum, pId) => {
      const p = products.find(prod => prod.id === pId);
      return sum + getSupplierPrice(p);
    }, 0);
    const price = b.sellingPrice || 0;
    const totalCost = totalBaseCost + fixed + (price * percents);
    const profit = price - totalCost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    return { profit, margin, totalCost };
  };

  const totalBundles = bundles.length;
  let totalProfit = 0;
  let totalMarginSum = 0;
  let lossBundlesCount = 0;

  bundles.forEach(b => {
    const { profit, margin } = calculateBundleCosts(b);
    totalProfit += profit;
    totalMarginSum += margin;
    if (profit < 0) lossBundlesCount++;
  });

  const avgMargin = totalBundles > 0 ? (totalMarginSum / totalBundles) : 0;

  const handleDeleteBundle = (id) => {
    if(window.confirm('هل أنت متأكد من حذف هذه الحزمة؟')) {
      setBundles(bundles.filter(b => b.id !== id));
    }
  };

  const handleEditBundle = (bundle) => {
    setBundleToEdit(bundle);
    setActiveSubTab('builder');
  };

  const handleDuplicateBundle = (bundle) => {
    const newBundle = {
      ...bundle,
      id: `bundle_${Date.now()}`,
      name: `${bundle.name} (نسخة)`,
      createdAt: new Date().toISOString()
    };
    setBundles([...bundles, newBundle]);
  };

  const toggleExpand = (id) => {
    setExpandedBundleId(prev => (prev === id ? null : id));
  };

  return (
    <div className="bo-container">
      {/* KPI Cards */}
      <div className="po-kpi-grid">
        <div className="po-kpi-card po-kpi-blue">
          <div className="po-kpi-icon flex-row align-center justify-center"><BarChartIcon className="icon-lg" /></div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{totalBundles}</span>
            <span className="po-kpi-label">إجمالي الحزم</span>
          </div>
          <div className="po-kpi-glow" />
        </div>
        <div className="po-kpi-card po-kpi-green">
          <div className="po-kpi-icon flex-row align-center justify-center"><TrendingUpIcon className="icon-lg" /></div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{fmtPct(avgMargin)}%</span>
            <span className="po-kpi-label">متوسط هامش الربح</span>
          </div>
          <div className="po-kpi-glow" />
        </div>
        <div className={`po-kpi-card ${lossBundlesCount > 0 ? 'po-kpi-red' : 'po-kpi-green'}`}>
          <div className="po-kpi-icon flex-row align-center justify-center">{lossBundlesCount > 0 ? <TrendingDownIcon className="icon-lg" /> : <CheckCircleIcon className="icon-lg" />}</div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{lossBundlesCount}</span>
            <span className="po-kpi-label">حزم بخسارة</span>
          </div>
          <div className="po-kpi-glow" />
        </div>
      </div>

      {/* Bundles Table */}
      <div className="po-table-card">
        <div className="po-table-header">
          <h3 className="flex-row align-center gap-2">
            <span className="po-table-icon flex-row align-center justify-center"><PackageIcon className="icon-sm" /></span>
            قائمة الحزم الحالية
          </h3>
          <span className="po-table-count">{bundles.length} حزمة</span>
        </div>
        {bundles.length === 0 ? (
          <div className="cm-empty">
            <span className="cm-empty-icon flex-row align-center justify-center"><PackageIcon className="icon-xl" /></span>
            <p>لم تقم بإنشاء أي حزم بعد</p>
            <span>انتقل إلى "تكوين الحزم" لإضافة حزمة جديدة</span>
          </div>
        ) : (
          <div className="po-table-wrap">
            <table className="po-table">
              <thead>
                <tr>
                  <th className="po-th-product">اسم الحزمة</th>
                  <th>عدد المنتجات</th>
                  <th>سعر البيع</th>
                  <th>الربح الصافي</th>
                  <th className="po-th-action">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {bundles.map((b, idx) => {
                  const { profit } = calculateBundleCosts(b);
                  return (
                    <React.Fragment key={b.id}>
                    <tr className="po-table-row">
                      <td className="po-td-product">
                        <div className="po-product-cell">
                          <span className="po-product-index">{idx + 1}</span>
                          <span className="po-product-name">{b.name}</span>
                        </div>
                      </td>
                      <td className="po-td-num">
                        <span 
                          className="bo-count-badge" 
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => toggleExpand(b.id)}
                          title="عرض أو إخفاء محتويات الحزمة"
                        >
                          {b.productIds.length} منتجات {expandedBundleId === b.id ? '▲' : '▼'}
                        </span>
                      </td>
                      <td className="po-td-num">
                        {b.sellingPrice ? (
                          <span className="cm-value-display">{fmt(b.sellingPrice)} ر.س</span>
                        ) : (
                          <span className="bo-unpriced">غير مسعرة</span>
                        )}
                      </td>
                      <td className="po-td-num">
                        {b.sellingPrice ? (
                          <span className={`po-status-badge ${profit > 0 ? 'po-status-success' : 'po-status-danger'}`}>
                            {profit > 0 ? '+' : ''}{fmt(profit)} ر.س
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="cm-action-btn flex-row align-center justify-center" title="تعديل الحزمة" onClick={() => handleEditBundle(b)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><EditIcon className="icon-sm" /></button>
                          <button className="cm-action-btn flex-row align-center justify-center" title="تكرار الحزمة" onClick={() => handleDuplicateBundle(b)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ClipboardIcon className="icon-sm" /></button>
                          <button className="cm-delete-btn flex-row align-center justify-center" title="حذف الحزمة" onClick={() => handleDeleteBundle(b.id)}><TrashIcon className="icon-sm" /></button>
                        </div>
                      </td>
                    </tr>
                    {expandedBundleId === b.id && (
                      <tr className="po-table-expanded-row">
                        <td colSpan="5">
                          <div className="po-expanded-content">
                            <h4 className="po-expanded-title flex-row align-center gap-2">
                              <PackageIcon className="icon-xs" /> المنتجات المدرجة ضمن هذه الحزمة:
                            </h4>
                            <div className="po-expanded-grid">
                              {b.productIds.map((pId, i) => {
                                const p = products.find(prod => prod.id === pId);
                                return (
                                  <span key={`${pId}-${i}`} className="po-product-chip">
                                    <span className="po-chip-dot"></span>
                                    {p ? p.name : 'منتج محذوف'}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BundleOverview;
