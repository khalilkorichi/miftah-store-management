import React, { useState } from 'react';
import {
  PackageIcon, UsersIcon, GiftIcon, DollarSignIcon, BarChartIcon,
  TrendingUpIcon, TrendingDownIcon, AlertTriangleIcon, CheckCircleIcon,
  PlusIcon, TagIcon, StarIcon, ActivityIcon, PercentIcon,
  SettingsIcon, LayersIcon, ArrowLeftIcon, ZapIcon, AwardIcon
} from './Icons';

const fmt = (val) => {
  if (val === null || val === undefined) return '0';
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const fmtPct = (val) => {
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

function Dashboard({
  products, suppliers, durations, exchangeRate, bundles,
  costs, pricingData, coupons, activationMethods,
  onNavigate
}) {
  const totalProducts = products.length;
  const totalSuppliers = suppliers.length;
  const totalBundles = bundles.length;
  const totalPlans = products.reduce((acc, p) => acc + p.plans.length, 0);
  const activeCoupons = coupons.filter(c => c.active !== false).length;

  const getSupplierPrice = (product) => {
    const primaryId = pricingData?.primarySupplier;
    let bestPrice = Infinity;
    for (const plan of product.plans) {
      for (const [sid, price] of Object.entries(plan.prices)) {
        if (price > 0 && price < bestPrice) {
          if (primaryId && parseInt(sid) === primaryId) {
            bestPrice = price;
            break;
          }
          bestPrice = price;
        }
      }
    }
    return bestPrice === Infinity ? 0 : bestPrice;
  };

  const getTotalCostMultiplier = () => {
    if (!costs) return 1;
    let totalPct = 0;
    let totalFixed = 0;
    costs.forEach(c => {
      if (c.active === false) return;
      if (c.type === 'percentage') totalPct += (c.value || 0);
      else totalFixed += (c.value || 0);
    });
    return { pctMultiplier: 1 + totalPct / 100, fixedCost: totalFixed };
  };

  const costInfo = getTotalCostMultiplier();

  const productsWithPricing = products.map(product => {
    const supplierPrice = getSupplierPrice(product);
    const supplierPriceSar = supplierPrice * exchangeRate;
    const totalCost = supplierPriceSar * costInfo.pctMultiplier + costInfo.fixedCost;
    const officialPrice = product.plans[0]?.officialPriceUsd
      ? product.plans[0].officialPriceUsd * exchangeRate
      : 0;
    const margin = officialPrice > 0 ? ((officialPrice - totalCost) / officialPrice) * 100 : 0;
    const status = officialPrice === 0 ? 'unpriced' :
      officialPrice < totalCost ? 'loss' :
      margin < 10 ? 'low' :
      margin > 50 ? 'high' : 'good';

    return { ...product, supplierPrice, totalCost, officialPrice, margin, status };
  });

  const unpricedProducts = productsWithPricing.filter(p => p.status === 'unpriced');
  const lossProducts = productsWithPricing.filter(p => p.status === 'loss');
  const lowMarginProducts = productsWithPricing.filter(p => p.status === 'low');
  const goodProducts = productsWithPricing.filter(p => p.status === 'good' || p.status === 'high');

  const avgMargin = productsWithPricing.filter(p => p.officialPrice > 0).length > 0
    ? productsWithPricing.filter(p => p.officialPrice > 0).reduce((acc, p) => acc + p.margin, 0) / productsWithPricing.filter(p => p.officialPrice > 0).length
    : 0;

  const bestSupplier = (() => {
    const wins = {};
    products.forEach(p => {
      p.plans.forEach(plan => {
        let min = Infinity;
        let bestId = null;
        for (const [sid, price] of Object.entries(plan.prices)) {
          if (price > 0 && price < min) {
            min = price;
            bestId = sid;
          }
        }
        if (bestId) wins[bestId] = (wins[bestId] || 0) + 1;
      });
    });
    let maxWins = 0;
    let bestSid = null;
    for (const [sid, count] of Object.entries(wins)) {
      if (count > maxWins) { maxWins = count; bestSid = sid; }
    }
    const supplier = suppliers.find(s => s.id === parseInt(bestSid));
    return supplier ? { name: supplier.name, wins: maxWins } : null;
  })();

  const alertItems = [
    ...lossProducts.map(p => ({ type: 'danger', name: p.name, desc: 'يباع بخسارة', badge: 'خسارة', action: 'pricing' })),
    ...lowMarginProducts.map(p => ({ type: 'warning', name: p.name, desc: 'هامش ربح منخفض', badge: `${fmtPct(p.margin)}%`, action: 'pricing' })),
    ...unpricedProducts.map(p => ({ type: 'info', name: p.name, desc: 'لم يتم تسعيره بعد', badge: 'غير مسعّر', action: 'products' })),
  ];

  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const visibleAlerts = showAllAlerts ? alertItems : alertItems.slice(0, 5);
  const visibleProducts = showAllProducts ? productsWithPricing : productsWithPricing.slice(0, 6);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <h1 className="dashboard-title">
            <ActivityIcon className="icon-md" /> لوحة التحكم
          </h1>
          <p className="dashboard-subtitle">نظرة عامة على متجرك الرقمي</p>
        </div>
      </div>

      <div className="dashboard-stats-grid">
        <div className="dash-stat-card stat-accent-blue" onClick={() => onNavigate('products')}>
          <div className="dash-stat-icon"><PackageIcon /></div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{fmt(totalProducts)}</span>
            <span className="dash-stat-label">المنتجات</span>
          </div>
          <span className="dash-stat-sub">{fmt(totalPlans)} خطة</span>
        </div>

        <div className="dash-stat-card stat-accent-green" onClick={() => onNavigate('products')}>
          <div className="dash-stat-icon"><UsersIcon /></div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{fmt(totalSuppliers)}</span>
            <span className="dash-stat-label">الموردين</span>
          </div>
          {bestSupplier && <span className="dash-stat-sub"><AwardIcon className="icon-xs" /> {bestSupplier.name}</span>}
        </div>

        <div className="dash-stat-card stat-accent-purple" onClick={() => onNavigate('bundles')}>
          <div className="dash-stat-icon"><GiftIcon /></div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{fmt(totalBundles)}</span>
            <span className="dash-stat-label">الحزم</span>
          </div>
          <span className="dash-stat-sub">{fmt(activeCoupons)} كوبون فعّال</span>
        </div>

        <div className="dash-stat-card stat-accent-orange" onClick={() => onNavigate('pricing')}>
          <div className="dash-stat-icon"><PercentIcon /></div>
          <div className="dash-stat-info">
            <span className="dash-stat-value">{fmtPct(avgMargin)}%</span>
            <span className="dash-stat-label">متوسط الهامش</span>
          </div>
          <span className="dash-stat-sub">
            {avgMargin >= 20 ? <><TrendingUpIcon className="icon-xs" /> جيد</> : <><TrendingDownIcon className="icon-xs" /> يحتاج تحسين</>}
          </span>
        </div>
      </div>

      <div className="dashboard-body">
        <div className="dashboard-main-col">
          <div className="dash-section">
            <h2 className="dash-section-title">
              <AlertTriangleIcon className="icon-sm" />
              تنبيهات تحتاج انتباهك
              {alertItems.length > 0 && <span className="dash-section-badge">{alertItems.length}</span>}
            </h2>
            {alertItems.length === 0 ? (
              <div className="dash-all-good">
                <div className="dash-all-good-icon-wrap"><CheckCircleIcon /></div>
                <div className="dash-all-good-content">
                  <span className="dash-all-good-title">كل شيء على ما يرام!</span>
                  <span className="dash-all-good-sub">جميع المنتجات مسعّرة بشكل صحيح</span>
                </div>
              </div>
            ) : (
              <div className="dash-alerts-list">
                {visibleAlerts.map((alert, idx) => (
                  <div key={idx} className={`dash-alert-item alert-${alert.type}`} onClick={() => onNavigate(alert.action)}>
                    <div className={`dash-alert-avatar avatar-${alert.type}`}>{alert.name.charAt(0)}</div>
                    <div className="dash-alert-body">
                      <span className="dash-alert-name">{alert.name}</span>
                      <span className="dash-alert-desc">{alert.desc}</span>
                    </div>
                    <span className={`dash-alert-badge badge-${alert.type}`}>{alert.badge}</span>
                    <ArrowLeftIcon className="icon-xs dash-alert-arrow" />
                  </div>
                ))}
                {alertItems.length > 5 && (
                  <button className="dash-show-more-btn" onClick={() => setShowAllAlerts(!showAllAlerts)}>
                    {showAllAlerts ? 'عرض أقل' : `عرض الكل (${alertItems.length})`}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="dash-section">
            <h2 className="dash-section-title">
              <PackageIcon className="icon-sm" /> حالة المنتجات
            </h2>
            <div className="dash-products-summary">
              <div className="dash-product-status-bar">
                {goodProducts.length > 0 && (
                  <div className="status-segment good" style={{ flex: goodProducts.length }} title={`${goodProducts.length} منتج - هامش جيد`}></div>
                )}
                {lowMarginProducts.length > 0 && (
                  <div className="status-segment warning" style={{ flex: lowMarginProducts.length }} title={`${lowMarginProducts.length} منتج - هامش منخفض`}></div>
                )}
                {lossProducts.length > 0 && (
                  <div className="status-segment danger" style={{ flex: lossProducts.length }} title={`${lossProducts.length} منتج - خسارة`}></div>
                )}
                {unpricedProducts.length > 0 && (
                  <div className="status-segment neutral" style={{ flex: unpricedProducts.length }} title={`${unpricedProducts.length} منتج - غير مسعّر`}></div>
                )}
              </div>
              <div className="dash-status-legend">
                <span className="legend-item"><span className="legend-dot good"></span> جيد ({goodProducts.length})</span>
                <span className="legend-item"><span className="legend-dot warning"></span> منخفض ({lowMarginProducts.length})</span>
                <span className="legend-item"><span className="legend-dot danger"></span> خسارة ({lossProducts.length})</span>
                <span className="legend-item"><span className="legend-dot neutral"></span> غير مسعّر ({unpricedProducts.length})</span>
              </div>
            </div>

            <div className="dash-products-table">
              <div className="dash-table-header">
                <span>المنتج</span>
                <span>أفضل سعر</span>
                <span>التكلفة</span>
                <span>السعر الرسمي</span>
                <span>الهامش</span>
              </div>
              {visibleProducts.map(p => (
                <div key={p.id} className={`dash-table-row status-${p.status}`} onClick={() => onNavigate('products')}>
                  <div className="dash-table-name-cell">
                    <div className={`dash-prod-avatar dash-prod-${p.status}`}>{p.name.charAt(0)}</div>
                    <span className="dash-table-name">{p.name}</span>
                  </div>
                  <span className="dash-table-cell" dir="ltr">{p.supplierPrice > 0 ? `$${fmt(p.supplierPrice)}` : '—'}</span>
                  <span className="dash-table-cell" dir="ltr">{p.totalCost > 0 ? `${fmt(p.totalCost)} ﷼` : '—'}</span>
                  <span className="dash-table-cell" dir="ltr">{p.officialPrice > 0 ? `${fmt(p.officialPrice)} ﷼` : '—'}</span>
                  <span className={`dash-table-margin-pill margin-${p.status}`}>
                    {p.officialPrice > 0 ? `${fmtPct(p.margin)}%` : '—'}
                  </span>
                </div>
              ))}
              {productsWithPricing.length > 6 && (
                <button className="dash-show-more-btn" onClick={() => setShowAllProducts(!showAllProducts)}>
                  {showAllProducts ? 'عرض أقل' : `عرض كل المنتجات (${productsWithPricing.length})`}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-side-col">
          <div className="dash-section">
            <h2 className="dash-section-title">
              <ZapIcon className="icon-sm" /> إجراءات سريعة
            </h2>
            <div className="dash-quick-actions">
              <button className="dash-quick-btn" onClick={() => onNavigate('products')}>
                <div className="dash-qb-icon dash-qb-blue"><PlusIcon className="icon-sm" /></div>
                <div className="dash-qb-info">
                  <span className="dash-qb-title">إضافة منتج</span>
                  <span className="dash-qb-sub">إدارة المنتجات والخطط</span>
                </div>
                <ArrowLeftIcon className="icon-xs dash-qb-arrow" />
              </button>
              <button className="dash-quick-btn" onClick={() => onNavigate('bundles')}>
                <div className="dash-qb-icon dash-qb-purple"><GiftIcon className="icon-sm" /></div>
                <div className="dash-qb-info">
                  <span className="dash-qb-title">إنشاء حزمة</span>
                  <span className="dash-qb-sub">حزم الاشتراكات والكوبونات</span>
                </div>
                <ArrowLeftIcon className="icon-xs dash-qb-arrow" />
              </button>
              <button className="dash-quick-btn" onClick={() => onNavigate('pricing')}>
                <div className="dash-qb-icon dash-qb-gold"><DollarSignIcon className="icon-sm" /></div>
                <div className="dash-qb-info">
                  <span className="dash-qb-title">إدارة التكاليف</span>
                  <span className="dash-qb-sub">التكاليف والرسوم والهوامش</span>
                </div>
                <ArrowLeftIcon className="icon-xs dash-qb-arrow" />
              </button>
              <button className="dash-quick-btn" onClick={() => onNavigate('reports')}>
                <div className="dash-qb-icon dash-qb-green"><BarChartIcon className="icon-sm" /></div>
                <div className="dash-qb-info">
                  <span className="dash-qb-title">تصدير تقرير</span>
                  <span className="dash-qb-sub">تقارير الأسعار والتحليلات</span>
                </div>
                <ArrowLeftIcon className="icon-xs dash-qb-arrow" />
              </button>
              <button className="dash-quick-btn" onClick={() => onNavigate('settings')}>
                <div className="dash-qb-icon dash-qb-gray"><SettingsIcon className="icon-sm" /></div>
                <div className="dash-qb-info">
                  <span className="dash-qb-title">الإعدادات</span>
                  <span className="dash-qb-sub">إعدادات المتجر والتفضيلات</span>
                </div>
                <ArrowLeftIcon className="icon-xs dash-qb-arrow" />
              </button>
            </div>
          </div>

          <div className="dash-section">
            <h2 className="dash-section-title">
              <DollarSignIcon className="icon-sm" /> ملخص التسعير
            </h2>
            <div className="dash-pricing-summary">
              <div className="dash-pricing-row">
                <span className="dash-pricing-label">سعر الصرف</span>
                <span className="dash-pricing-value" dir="ltr">1 USD = {fmt(exchangeRate)} SAR</span>
              </div>
              <div className="dash-pricing-row">
                <span className="dash-pricing-label">إجمالي التكاليف الثابتة</span>
                <span className="dash-pricing-value" dir="ltr">{fmt(costInfo.fixedCost)} ﷼</span>
              </div>
              <div className="dash-pricing-row">
                <span className="dash-pricing-label">نسبة التكاليف المتغيرة</span>
                <span className="dash-pricing-value" dir="ltr">{fmtPct((costInfo.pctMultiplier - 1) * 100)}%</span>
              </div>
              <div className="dash-pricing-row">
                <span className="dash-pricing-label">طرق التفعيل</span>
                <span className="dash-pricing-value">{fmt(activationMethods.length)} طريقة</span>
              </div>
              <div className="dash-pricing-row">
                <span className="dash-pricing-label">المدد المتاحة</span>
                <span className="dash-pricing-value">{fmt(durations.length)} مدة</span>
              </div>
            </div>
          </div>

          {bestSupplier && (
            <div className="dash-section">
              <h2 className="dash-section-title">
                <AwardIcon className="icon-sm" /> أفضل مورد
              </h2>
              <div className="dash-best-supplier">
                <div className="dash-supplier-avatar">{bestSupplier.name.charAt(0)}</div>
                <div className="dash-supplier-info">
                  <span className="dash-supplier-name">{bestSupplier.name}</span>
                  <span className="dash-supplier-wins">
                    <StarIcon className="icon-xs" /> أفضل سعر في {fmt(bestSupplier.wins)} من {fmt(totalPlans)} خطة
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
