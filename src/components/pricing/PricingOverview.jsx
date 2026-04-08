import React from 'react';
import {
  TrendingDownIcon, TrendingUpIcon, CheckCircleIcon, PackageIcon,
  BarChartIcon, AlertTriangleIcon, DollarSignIcon, SettingsIcon,
  TagIcon, ArrowLeftIcon, PercentIcon, ActivityIcon, ShieldCheckIcon,
  LayersIcon, RefreshIcon
} from '../Icons';

const fmtPct = (val) => Number(val).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtNum = (val) => Number(val).toLocaleString('ar-SA');

function PricingOverview({ products, suppliers, costs, exchangeRate, pricingData, finalPrices, onNavigate }) {

  const getSupplierPrice = (prod) => {
    if (!prod || !prod.plans || prod.plans.length === 0) return 0;
    const plan = prod.plans[0];
    const savedConfig = pricingData[prod.id] || {};
    const supplierId = savedConfig.primarySupplierId || suppliers[0]?.id;
    return (plan.prices[supplierId] || 0) * exchangeRate;
  };

  const calculateCosts = (baseCost) => {
    let fixed = 0;
    let percents = 0;
    costs.filter(c => c.active).forEach(c => {
      if (c.type === 'fixed') fixed += c.value;
      else if (c.type === 'percentage') percents += c.value / 100;
    });
    const marginDec = 0.20;
    const denominator = 1 - marginDec - percents;
    const suggestedPrice = denominator > 0 ? (baseCost + fixed) / denominator : 0;
    const totalCost = baseCost + fixed + (suggestedPrice * percents);
    return { totalCost, suggestedPrice };
  };

  let totalProductsCount = products.length;
  let belowCostCount = 0;
  let totalMarginSum = 0;
  let marginApplicableCount = 0;
  let totalSetPrices = 0;
  let totalPlansCount = 0;
  let activeCostsCount = costs.filter(c => c.active).length;
  let bestMargin = -Infinity;
  let worstMargin = Infinity;

  products.forEach(p => {
    const baseC = getSupplierPrice(p);
    const { totalCost } = calculateCosts(baseC);
    p.plans?.forEach(pl => {
      totalPlansCount++;
      const key = `${p.id}_${pl.id}`;
      const finalP = finalPrices?.[key];
      if (finalP) {
        totalSetPrices++;
        const profitMargin = finalP > 0 ? ((finalP - totalCost) / finalP) * 100 : 0;
        if (finalP < totalCost) belowCostCount++;
        if (finalP > 0) {
          totalMarginSum += profitMargin;
          marginApplicableCount++;
          if (profitMargin > bestMargin) bestMargin = profitMargin;
          if (profitMargin < worstMargin) worstMargin = profitMargin;
        }
      }
    });
  });

  const avgMargin = marginApplicableCount > 0 ? (totalMarginSum / marginApplicableCount) : 0;
  const coveragePercent = totalPlansCount > 0 ? (totalSetPrices / totalPlansCount) * 100 : 0;

  const healthScore = Math.max(0, Math.min(100, Math.round(
    (coveragePercent * 0.4) +
    (belowCostCount === 0 ? 30 : Math.max(0, 30 - belowCostCount * 5)) +
    (avgMargin > 20 ? 30 : avgMargin > 10 ? 20 : avgMargin > 0 ? 10 : 0)
  )));

  const healthLabel = healthScore >= 80 ? 'ممتاز' : healthScore >= 60 ? 'جيد' : healthScore >= 40 ? 'مقبول' : 'يحتاج مراجعة';
  const healthColor = healthScore >= 80 ? 'var(--accent-green)' : healthScore >= 60 ? '#f59e0b' : healthScore >= 40 ? '#f97316' : 'var(--accent-red)';

  const insights = [];
  if (totalSetPrices === 0) {
    insights.push({ type: 'info', icon: <DollarSignIcon className="icon-sm" />, text: 'لم يتم تحديد أي أسعار نهائية بعد. ابدأ بتحديد الأسعار في تبويبة الأسعار النهائية.', tab: 'finalprices' });
  }
  if (belowCostCount > 0) {
    insights.push({ type: 'danger', icon: <TrendingDownIcon className="icon-sm" />, text: `${belowCostCount} خطة تسعير تحت التكلفة — راجعها الآن لتجنب الخسارة.`, tab: 'finalprices' });
  }
  if (activeCostsCount === 0) {
    insights.push({ type: 'warning', icon: <AlertTriangleIcon className="icon-sm" />, text: 'لا توجد تكاليف نشطة. أضف تكاليفك لضمان دقة حسابات التسعير.', tab: 'costs' });
  }
  if (coveragePercent > 0 && coveragePercent < 100) {
    insights.push({ type: 'warning', icon: <PackageIcon className="icon-sm" />, text: `${totalPlansCount - totalSetPrices} خطة لم يتم تسعيرها بعد. أكمل التسعير لتحقيق تغطية كاملة.`, tab: 'finalprices' });
  }
  if (avgMargin > 0 && avgMargin < 15) {
    insights.push({ type: 'warning', icon: <PercentIcon className="icon-sm" />, text: `متوسط هامش الربح منخفض (${fmtPct(avgMargin)}%). فكّر في مراجعة آليات التسعير.`, tab: 'mechanisms' });
  }
  if (healthScore === 100) {
    insights.push({ type: 'success', icon: <ShieldCheckIcon className="icon-sm" />, text: 'ممتاز! منظومة التسعير لديك في حالة مثالية. استمر في المراقبة الدورية.' });
  }

  const quickActions = [
    { id: 'costs', icon: <DollarSignIcon className="icon-md" />, label: 'إدارة التكاليف', desc: 'أضف أو عدّل التكاليف الثابتة والمتغيرة', color: 'qa-blue' },
    { id: 'mechanisms', icon: <SettingsIcon className="icon-md" />, label: 'آليات التسعير', desc: 'اضبط قواعد حساب الأسعار المقترحة', color: 'qa-purple' },
    { id: 'coupons', icon: <TagIcon className="icon-md" />, label: 'الكوبونات', desc: 'أنشئ وادر كوبونات خصم للعملاء', color: 'qa-orange' },
    { id: 'finalprices', icon: <CheckCircleIcon className="icon-md" />, label: 'الأسعار النهائية', desc: 'راجع وأقرّ الأسعار النهائية للمنتجات', color: 'qa-green' },
  ];

  return (
    <div className="po-container">

      <div className="po-top-row">
        <div className="po-health-card">
          <div className="po-health-header">
            <ActivityIcon className="icon-sm" />
            <span>مؤشر صحة التسعير</span>
          </div>
          <div className="po-health-body">
            <div className="po-health-score-wrap">
              <svg className="po-health-ring" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border-color)" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke={healthColor}
                  strokeWidth="8"
                  strokeDasharray={`${(healthScore / 100) * 213.6} 213.6`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
                <text x="40" y="44" textAnchor="middle" fontSize="16" fontWeight="800" fill={healthColor}>{healthScore}</text>
              </svg>
              <div className="po-health-label-wrap">
                <span className="po-health-label" style={{ color: healthColor }}>{healthLabel}</span>
                <span className="po-health-sublabel">من 100 نقطة</span>
              </div>
            </div>
            <div className="po-health-details">
              <div className="po-health-detail-item">
                <span className="po-hd-dot" style={{ background: coveragePercent >= 100 ? 'var(--accent-green)' : 'var(--accent-red)' }} />
                <span>تغطية التسعير: <strong>{fmtPct(coveragePercent)}%</strong></span>
              </div>
              <div className="po-health-detail-item">
                <span className="po-hd-dot" style={{ background: belowCostCount === 0 ? 'var(--accent-green)' : 'var(--accent-red)' }} />
                <span>أسعار تحت التكلفة: <strong>{belowCostCount}</strong></span>
              </div>
              <div className="po-health-detail-item">
                <span className="po-hd-dot" style={{ background: avgMargin >= 20 ? 'var(--accent-green)' : avgMargin >= 10 ? '#f59e0b' : 'var(--accent-red)' }} />
                <span>متوسط الهامش: <strong>{fmtPct(avgMargin)}%</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="po-kpi-grid">
          <div className="po-kpi-card po-kpi-blue">
            <div className="po-kpi-icon flex-row align-center justify-center"><PackageIcon className="icon-lg" /></div>
            <div className="po-kpi-data">
              <span className="po-kpi-value">{fmtNum(totalProductsCount)}</span>
              <span className="po-kpi-label">إجمالي المنتجات</span>
            </div>
            <div className="po-kpi-glow" />
          </div>
          <div className={`po-kpi-card ${belowCostCount > 0 ? 'po-kpi-red' : 'po-kpi-green'}`}>
            <div className="po-kpi-icon flex-row align-center justify-center">
              {belowCostCount > 0 ? <TrendingDownIcon className="icon-lg" /> : <CheckCircleIcon className="icon-lg" />}
            </div>
            <div className="po-kpi-data">
              <span className="po-kpi-value">{belowCostCount}</span>
              <span className="po-kpi-label">أسعار تحت التكلفة</span>
            </div>
            <div className="po-kpi-glow" />
          </div>
          <div className={`po-kpi-card ${avgMargin >= 20 ? 'po-kpi-green' : avgMargin >= 10 ? 'po-kpi-amber' : 'po-kpi-red'}`}>
            <div className="po-kpi-icon flex-row align-center justify-center">
              {avgMargin >= 15 ? <TrendingUpIcon className="icon-lg" /> : <BarChartIcon className="icon-lg" />}
            </div>
            <div className="po-kpi-data">
              <span className="po-kpi-value">{fmtPct(avgMargin)}%</span>
              <span className="po-kpi-label">متوسط هامش الربح</span>
            </div>
            <div className="po-kpi-glow" />
          </div>
          <div className={`po-kpi-card ${coveragePercent >= 100 ? 'po-kpi-green' : coveragePercent > 0 ? 'po-kpi-amber' : 'po-kpi-blue'}`}>
            <div className="po-kpi-icon flex-row align-center justify-center">
              {coveragePercent >= 100 ? <CheckCircleIcon className="icon-lg" /> : <LayersIcon className="icon-lg" />}
            </div>
            <div className="po-kpi-data">
              <span className="po-kpi-value">{totalSetPrices}<span className="po-kpi-sub">/{totalPlansCount}</span></span>
              <span className="po-kpi-label">خطط مُسعَّرة</span>
            </div>
            <div className="po-kpi-coverage-bar">
              <div className="po-kpi-coverage-fill" style={{ width: `${coveragePercent}%`, background: coveragePercent >= 100 ? 'var(--accent-green)' : 'var(--accent-blue)' }} />
            </div>
            <div className="po-kpi-glow" />
          </div>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="po-insights-section">
          <div className="po-section-title">
            <ActivityIcon className="icon-sm" />
            <span>تنبيهات وتوصيات ذكية</span>
          </div>
          <div className="po-insights-list">
            {insights.map((ins, i) => (
              <div key={i} className={`po-insight-item po-insight-${ins.type}`}>
                <span className="po-insight-icon">{ins.icon}</span>
                <span className="po-insight-text">{ins.text}</span>
                {ins.tab && onNavigate && (
                  <button className="po-insight-action" onClick={() => onNavigate(ins.tab)}>
                    انتقل <ArrowLeftIcon className="icon-xs" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="po-quick-actions-section">
        <div className="po-section-title">
          <RefreshIcon className="icon-sm" />
          <span>إجراءات سريعة</span>
        </div>
        <div className="po-quick-actions-grid">
          {quickActions.map(action => (
            <button
              key={action.id}
              className={`po-qa-card ${action.color}`}
              onClick={() => onNavigate && onNavigate(action.id)}
            >
              <div className="po-qa-icon-wrap">{action.icon}</div>
              <div className="po-qa-text">
                <span className="po-qa-label">{action.label}</span>
                <span className="po-qa-desc">{action.desc}</span>
              </div>
              <ArrowLeftIcon className="icon-sm po-qa-arrow" />
            </button>
          ))}
        </div>
      </div>

      {activeCostsCount > 0 && (
        <div className="po-costs-summary">
          <div className="po-section-title">
            <DollarSignIcon className="icon-sm" />
            <span>ملخص التكاليف النشطة</span>
          </div>
          <div className="po-costs-pills">
            {costs.filter(c => c.active).map((c, i) => (
              <div key={i} className="po-cost-pill">
                <span className="po-cost-pill-name">{c.name}</span>
                <span className="po-cost-pill-val">
                  {c.type === 'fixed' ? `${fmtNum(c.value)} ر.س` : `${c.value}%`}
                </span>
                <span className={`po-cost-pill-type ${c.type === 'fixed' ? 'fixed' : 'pct'}`}>
                  {c.type === 'fixed' ? 'ثابت' : 'نسبة'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default PricingOverview;
