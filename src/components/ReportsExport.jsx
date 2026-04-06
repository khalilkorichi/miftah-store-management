import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  BarChartIcon, PackageIcon, BuildingIcon, ClipboardIcon, 
  CurrencyIcon, GlobeIcon, ScaleIcon, TrendingUpIcon, ZapIcon, DownloadIcon,
  StarIcon, KeyIcon, ChevronDownIcon
} from './Icons';

const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtInt = (v) => Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });

const pdfColors = {
  primary: '#1a1a3e',
  accent: '#5E4FDE',
  green: '#0ea85c',
  blue: '#1A51F4',
  orange: '#F7784A',
  red: '#F94B60',
  gold: '#FFC530',
  muted: '#6b7280',
  light: '#f8f9fe',
  border: '#e5e7eb',
  borderLight: '#f0f0f0',
};

const thStyle = {
  padding: '10px 12px',
  textAlign: 'center',
  fontWeight: '700',
  borderBottom: `2px solid ${pdfColors.border}`,
  background: pdfColors.light,
  fontSize: '12px',
  whiteSpace: 'nowrap',
};
const subThStyle = {
  padding: '6px 8px',
  textAlign: 'center',
  fontWeight: '500',
  borderBottom: `1px solid ${pdfColors.border}`,
  background: '#fafbff',
  fontSize: '11px',
};
const tdStyle = {
  padding: '8px 12px',
  textAlign: 'center',
  borderBottom: `1px solid ${pdfColors.borderLight}`,
  fontSize: '12px',
};

const MetricCard = ({ label, value, color, icon }) => (
  <div style={{
    background: `${color}10`,
    border: `1.5px solid ${color}30`,
    borderRadius: '10px',
    padding: '14px 16px',
    textAlign: 'center',
    flex: '1 1 0',
    minWidth: '100px',
  }}>
    <div style={{ fontSize: '20px', fontWeight: '800', color, lineHeight: '1.2' }}>{value}</div>
    <div style={{ fontSize: '11px', color: pdfColors.muted, marginTop: '4px', fontWeight: '500' }}>{label}</div>
  </div>
);

const ReportHeader = ({ title, color, subtitle, stats }) => (
  <div>
    <div style={{
      background: `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`,
      color: '#fff',
      padding: '24px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: '22px', margin: '0 0 4px 0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '12px', margin: 0, opacity: 0.85 }}>{subtitle}</p>}
      </div>
      <div style={{ textAlign: 'left', flexShrink: 0 }}>
        <div style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
          متجر مفتاح <KeyIcon className="icon-sm" style={{ color: '#fff' }} />
        </div>
        <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
          {new Date().toLocaleDateString('ar-SA-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </div>
    {stats && (
      <div style={{ padding: '16px 32px', background: '#fff', borderBottom: `2px solid ${pdfColors.border}`, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {stats}
      </div>
    )}
  </div>
);

const SectionTitle = ({ children, color = pdfColors.accent }) => (
  <h2 style={{ fontSize: '15px', fontWeight: '700', color, margin: '20px 0 12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `2px solid ${color}20`, paddingBottom: '8px' }}>
    {children}
  </h2>
);

const ReportFooter = () => (
  <div style={{
    background: pdfColors.light,
    padding: '12px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `2px solid ${pdfColors.border}`,
  }}>
    <span style={{ fontSize: '11px', color: pdfColors.muted }}>
      متجر مفتاح — تقرير تلقائي — {new Date().toLocaleDateString('ar-SA-u-nu-latn', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })}
    </span>
    <span style={{ fontSize: '10px', color: '#bbb' }}>miftah.store</span>
  </div>
);

const InfoRow = ({ label, value, color, bold }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${pdfColors.borderLight}` }}>
    <span style={{ fontSize: '12px', color: pdfColors.muted }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: bold ? '700' : '600', color: color || pdfColors.primary }}>{value}</span>
  </div>
);

const Badge = ({ children, color = pdfColors.accent, bg }) => (
  <span style={{
    background: bg || `${color}12`,
    color,
    padding: '3px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'inline-block',
  }}>{children}</span>
);

function ReportsExport({ products, suppliers, durations, exchangeRate, activationMethods = [] }) {
  const reportRef = useRef(null);
  const [generating, setGenerating] = useState(null);
  const [activeSection, setActiveSection] = useState('global');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('all');
  const [expandedProducts, setExpandedProducts] = useState({});

  const toggleProduct = (productName) => {
    setExpandedProducts(prev => ({ ...prev, [productName]: !prev[productName] }));
  };

  const expandAll = () => {
    const all = {};
    products.forEach(p => { all[formatProductName(p)] = true; });
    setExpandedProducts(all);
  };

  const collapseAll = () => {
    setExpandedProducts({});
  };

  const getDurationLabel = (durationId) => {
    const dur = durations.find((d) => d.id === durationId);
    return dur ? dur.label : durationId;
  };

  const formatProductName = (product) => {
    if (product.accountType === 'individual') return `${product.name} (فردي)`;
    if (product.accountType === 'team') return `${product.name} (فريق)`;
    return product.name;
  };

  const getAnalyticsFor = (productList) => {
    const rows = [];
    productList.forEach((product) => {
      product.plans.forEach((plan) => {
        let cheapest = { price: Infinity, supplierName: '-' };
        let expensive = { price: 0, supplierName: '-' };
        let total = 0, count = 0;
        suppliers.forEach((s) => {
          const p = plan.prices[s.id] || 0;
          if (p > 0) {
            total += p; count++;
            if (p < cheapest.price) cheapest = { price: p, supplierName: s.name };
            if (p > expensive.price) expensive = { price: p, supplierName: s.name };
          }
        });
        const avg = count > 0 ? total / count : 0;
        const savings = cheapest.price < Infinity ? expensive.price - cheapest.price : 0;
        const savingsPercent = expensive.price > 0 ? fmtPct((savings / expensive.price) * 100) : '0';
        rows.push({
          productName: formatProductName(product),
          planDuration: getDurationLabel(plan.durationId),
          cheapest: cheapest.price < Infinity ? cheapest : { price: 0, supplierName: '-' },
          expensive, avgPrice: avg, savings, savingsPercent,
          supplierCount: count,
        });
      });
    });
    return rows;
  };

  const analytics     = getAnalyticsFor(products);
  const totalSavings  = analytics.reduce((s, a) => s + a.savings, 0);
  const totalPlans    = products.reduce((s, p) => s + p.plans.length, 0);
  const avgSavingsPercent = analytics.length > 0
    ? fmtPct(analytics.reduce((s, a) => s + parseFloat(a.savingsPercent), 0) / analytics.length)
    : '0';

  const groupedAnalytics = (() => {
    const groups = [];
    let currentGroup = null;
    analytics.forEach((a) => {
      if (!currentGroup || currentGroup.productName !== a.productName) {
        currentGroup = { productName: a.productName, plans: [] };
        groups.push(currentGroup);
      }
      currentGroup.plans.push(a);
    });
    return groups;
  })();

  const getBestSupplierPerProduct = (productList) => {
    return productList.map((product) => {
      const wins = {};
      product.plans.forEach((plan) => {
        let min = Infinity, bestName = '';
        suppliers.forEach((s) => {
          const p = plan.prices[s.id] || 0;
          if (p > 0 && p < min) { min = p; bestName = s.name; }
        });
        if (bestName) wins[bestName] = (wins[bestName] || 0) + 1;
      });
      const sorted = Object.entries(wins).sort((a, b) => b[1] - a[1]);
      return sorted.length > 0
        ? { productName: formatProductName(product), supplierName: sorted[0][0], planCount: sorted[0][1] }
        : null;
    }).filter(Boolean);
  };

  const getOverallBestSupplier = () => {
    const wins = {};
    products.forEach(product => {
      product.plans.forEach(plan => {
        let min = Infinity, bestName = '';
        suppliers.forEach(s => {
          const p = plan.prices[s.id] || 0;
          if (p > 0 && p < min) { min = p; bestName = s.name; }
        });
        if (bestName) wins[bestName] = (wins[bestName] || 0) + 1;
      });
    });
    const sorted = Object.entries(wins).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], count: sorted[0][1], total: totalPlans } : null;
  };

  const generatePDF = async (key, filename, isLandscape = false) => {
    setGenerating(key);
    try {
      await new Promise((r) => setTimeout(r, 250));
      const element = reportRef.current;
      if (!element) return;
      const canvas = await html2canvas(element, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
      });
      const orientation = isLandscape ? 'landscape' : 'portrait';
      const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 8;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;
      const scale = usableW / canvas.width;
      const scaledH = canvas.height * scale;

      if (scaledH <= usableH) {
        const imgData = canvas.toDataURL('image/png');
        const xOff = (pageW - canvas.width * scale) / 2;
        doc.addImage(imgData, 'PNG', xOff, margin, canvas.width * scale, scaledH);
      } else {
        const sliceHeightPx = Math.floor(usableH / scale);
        const totalPages = Math.ceil(canvas.height / sliceHeightPx);
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) doc.addPage();
          const srcY = page * sliceHeightPx;
          const srcH = Math.min(sliceHeightPx, canvas.height - srcY);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = srcH;
          const ctx = sliceCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
          const sliceData = sliceCanvas.toDataURL('image/png');
          const drawH = srcH * scale;
          doc.addImage(sliceData, 'PNG', margin, margin, usableW, drawH);
        }
      }
      const safeName = filename.replace(/[<>:"/\\|?*]/g, '_').trim() || 'report.pdf';
      doc.save(safeName);
    } catch (e) {
      alert('حدث خطأ أثناء إنشاء التقرير: ' + e.message);
    } finally {
      setGenerating(null);
    }
  };

  // ══════════════════════════════════════════════════════════
  // 1. FULL REPORT — All products with all suppliers
  // ══════════════════════════════════════════════════════════
  const renderFullReport = () => {
    const bestSupplier = getOverallBestSupplier();
    return (
      <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: pdfColors.primary, minWidth: '950px' }}>
        <ReportHeader
          title={<><ClipboardIcon style={{width: 24, height: 24}} /> التقرير الكامل — جميع المنتجات والأسعار</>}
          color={pdfColors.accent}
          subtitle={`${products.length} منتج — ${suppliers.length} مورد — ${totalPlans} خطة — سعر الصرف: 1$ = ${exchangeRate} ﷼`}
          stats={<>
            <MetricCard label="عدد المنتجات" value={products.length} color={pdfColors.accent} />
            <MetricCard label="عدد الموردين" value={suppliers.length} color={pdfColors.green} />
            <MetricCard label="إجمالي الخطط" value={totalPlans} color={pdfColors.blue} />
            <MetricCard label="متوسط التوفير" value={`${avgSavingsPercent}%`} color={pdfColors.orange} />
            {bestSupplier && <MetricCard label="أفضل مورد عام" value={bestSupplier.name} color={pdfColors.green} />}
          </>}
        />

        <div style={{ padding: '16px 28px' }}>
          <SectionTitle color={pdfColors.accent}>
            <CurrencyIcon className="icon-sm" /> جدول الأسعار الشامل — بالدولار والريال
          </SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: `1px solid ${pdfColors.border}`, borderRadius: '8px' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '30px' }}>#</th>
                <th style={{ ...thStyle, textAlign: 'right', minWidth: '100px' }}>المنتج</th>
                <th style={{ ...thStyle, minWidth: '50px' }}>النوع</th>
                <th style={thStyle}>الخطة</th>
                {suppliers.map((s) => (
                  <th key={s.id} style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }} colSpan={2}>{s.name}</th>
                ))}
                <th style={{ ...thStyle, background: pdfColors.green, color: '#fff', minWidth: '100px' }}>أفضل سعر</th>
              </tr>
              <tr>
                <th style={subThStyle} /><th style={subThStyle} /><th style={subThStyle} /><th style={subThStyle} />
                {suppliers.map((s) => (
                  <React.Fragment key={s.id}>
                    <th style={{ ...subThStyle, color: pdfColors.accent }}>دولار $</th>
                    <th style={{ ...subThStyle, color: pdfColors.green }}>ريال ﷼</th>
                  </React.Fragment>
                ))}
                <th style={subThStyle} />
              </tr>
            </thead>
            <tbody>
              {products.map((product, pi) =>
                product.plans.map((plan, planIdx) => {
                  let minP = Infinity, bestName = '';
                  suppliers.forEach((s) => { const p = plan.prices[s.id] || 0; if (p > 0 && p < minP) { minP = p; bestName = s.name; } });
                  return (
                    <tr key={`${product.id}-${plan.id}`} style={{ background: pi % 2 === 0 ? '#f8f9fe' : '#fff' }}>
                      {planIdx === 0 && (
                        <>
                          <td style={{ ...tdStyle, fontWeight: '700', color: '#888' }} rowSpan={product.plans.length}>{pi + 1}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700' }} rowSpan={product.plans.length}>{formatProductName(product)}</td>
                          <td style={{ ...tdStyle, fontSize: '10px' }} rowSpan={product.plans.length}>
                            <Badge color={product.accountType === 'team' ? pdfColors.blue : pdfColors.accent}>
                              {product.accountType === 'team' ? 'فريق' : product.accountType === 'individual' ? 'فردي' : 'عام'}
                            </Badge>
                          </td>
                        </>
                      )}
                      <td style={tdStyle}>
                        <Badge color={pdfColors.accent}>{getDurationLabel(plan.durationId)}</Badge>
                      </td>
                      {suppliers.map((s) => {
                        const usd = plan.prices[s.id] || 0;
                        const isBest = usd > 0 && usd === minP;
                        return (
                          <React.Fragment key={s.id}>
                            <td style={{ ...tdStyle, fontWeight: isBest ? '700' : '500', color: isBest ? pdfColors.green : '#333', background: isBest ? '#E8FFF3' : undefined }}>
                              {usd > 0 ? `$${fmt(usd)}` : <span style={{ color: '#bbb', fontSize: '10px' }}>—</span>}
                            </td>
                            <td style={{ ...tdStyle, color: isBest ? pdfColors.green : '#666', background: isBest ? '#E8FFF3' : undefined }}>
                              {usd > 0 ? `${fmt(usd * exchangeRate)}` : <span style={{ color: '#bbb', fontSize: '10px' }}>—</span>}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td style={{ ...tdStyle, fontWeight: '700', color: pdfColors.green, fontSize: '11px' }}>
                        {minP < Infinity ? `${bestName} — $${fmt(minP)}` : <span style={{ color: '#bbb', fontSize: '10px' }}>—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <SectionTitle color={pdfColors.green}>
            <StarIcon className="icon-sm" /> ملخص أفضل الموردين حسب المنتج
          </SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {getBestSupplierPerProduct(products).map((bp, idx) => (
              <div key={idx} style={{ background: '#f0faf5', border: `1px solid ${pdfColors.green}30`, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: pdfColors.muted, marginBottom: '3px' }}>{bp.productName}</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: pdfColors.green }}>{bp.supplierName}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>الأفضل في {bp.planCount} {bp.planCount === 1 ? 'خطة' : 'خطط'}</div>
              </div>
            ))}
          </div>
        </div>
        <ReportFooter />
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // 2. PRODUCT REPORT — Single product detail
  // ══════════════════════════════════════════════════════════
  const renderProductReport = (product) => {
    if (!product) return null;
    const productAnalytics = getAnalyticsFor([product]);
    const bestSupplier = getBestSupplierPerProduct([product])[0];
    const assignedMethods = (product.activationMethods || [])
      .map((mId) => activationMethods.find((x) => x.id === mId))
      .filter(Boolean);

    const totalAvgSavings = productAnalytics.length > 0
      ? fmtPct(productAnalytics.reduce((s,a) => s+parseFloat(a.savingsPercent),0)/productAnalytics.length) : '0';

    let cheapestOverall = Infinity, cheapestSupplier = '', expensiveOverall = 0, expensiveSupplier = '';
    product.plans.forEach(plan => {
      suppliers.forEach(s => {
        const p = plan.prices[s.id] || 0;
        if (p > 0) {
          if (p < cheapestOverall) { cheapestOverall = p; cheapestSupplier = s.name; }
          if (p > expensiveOverall) { expensiveOverall = p; expensiveSupplier = s.name; }
        }
      });
    });

    return (
      <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: pdfColors.primary, width: '750px' }}>
        <ReportHeader
          title={<><PackageIcon style={{width: 24, height: 24}} /> تقرير المنتج: {formatProductName(product)}</>}
          color={pdfColors.blue}
          subtitle={`${product.plans.length} خطة اشتراك — ${suppliers.length} مورد — سعر الصرف: 1$ = ${exchangeRate} ﷼`}
          stats={<>
            <MetricCard label="عدد الخطط" value={product.plans.length} color={pdfColors.blue} />
            <MetricCard label="عدد الموردين" value={suppliers.length} color={pdfColors.accent} />
            {bestSupplier && <MetricCard label="أفضل مورد" value={bestSupplier.supplierName} color={pdfColors.green} />}
            <MetricCard label="متوسط التوفير" value={`${totalAvgSavings}%`} color={pdfColors.orange} />
          </>}
        />

        <div style={{ padding: '16px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: pdfColors.light, border: `1px solid ${pdfColors.border}`, borderRadius: '10px', padding: '14px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: pdfColors.accent, margin: '0 0 10px' }}>معلومات المنتج</h3>
              <InfoRow label="اسم المنتج" value={product.name} bold />
              <InfoRow label="نوع الحساب" value={product.accountType === 'team' ? 'فريق' : product.accountType === 'individual' ? 'فردي' : 'عام'} />
              <InfoRow label="عدد الخطط" value={product.plans.length} />
              {assignedMethods.length > 0 && <InfoRow label="طرق التفعيل" value={assignedMethods.map(m => m.label).join('، ')} />}
            </div>
            <div style={{ background: pdfColors.light, border: `1px solid ${pdfColors.border}`, borderRadius: '10px', padding: '14px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: pdfColors.green, margin: '0 0 10px' }}>ملخص الأسعار</h3>
              {cheapestOverall < Infinity && (
                <>
                  <InfoRow label="أقل سعر" value={`$${fmt(cheapestOverall)} (${cheapestSupplier})`} color={pdfColors.green} bold />
                  <InfoRow label="أعلى سعر" value={`$${fmt(expensiveOverall)} (${expensiveSupplier})`} color={pdfColors.red} />
                  <InfoRow label="فارق التوفير" value={`$${fmt(expensiveOverall - cheapestOverall)}`} color={pdfColors.orange} bold />
                </>
              )}
            </div>
          </div>

          {assignedMethods.length > 0 && (
            <>
              <SectionTitle color={pdfColors.accent}>
                <ZapIcon className="icon-sm" /> طرق التفعيل المتاحة
              </SectionTitle>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {assignedMethods.map((m) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    padding: '8px 14px', borderRadius: '8px', 
                    background: `${m.color}12`, border: `1px solid ${m.color}25`,
                    color: m.color, fontSize: '12px', fontWeight: '600'
                  }}>
                    <span style={{ fontSize: '14px' }}>{m.icon}</span>
                    <div>
                      <div style={{ lineHeight: '1.2' }}>{m.label}</div>
                      {m.description && <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '1px', fontWeight: '500' }}>{m.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <SectionTitle color={pdfColors.blue}>
            <CurrencyIcon className="icon-sm" /> جدول أسعار الموردين التفصيلي
          </SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: `1px solid ${pdfColors.border}` }}>
            <thead>
              <tr>
                <th style={thStyle}>الخطة</th>
                {suppliers.map((s) => (
                  <th key={s.id} style={{ ...thStyle, background: pdfColors.blue, color: '#fff' }} colSpan={2}>{s.name}</th>
                ))}
                <th style={{ ...thStyle, background: pdfColors.green, color: '#fff' }}>أفضل سعر</th>
              </tr>
              <tr>
                <th style={subThStyle} />
                {suppliers.map((s) => (
                  <React.Fragment key={s.id}>
                    <th style={{ ...subThStyle, color: pdfColors.blue }}>$ دولار</th>
                    <th style={{ ...subThStyle, color: pdfColors.green }}>﷼ ريال</th>
                  </React.Fragment>
                ))}
                <th style={subThStyle} />
              </tr>
            </thead>
            <tbody>
              {product.plans.map((plan, pi) => {
                let minP = Infinity, bestName = '';
                suppliers.forEach((s) => {
                  const p = plan.prices[s.id] || 0;
                  if (p > 0 && p < minP) { minP = p; bestName = s.name; }
                });
                return (
                  <tr key={plan.id} style={{ background: pi % 2 === 0 ? '#f0f2ff' : '#fff' }}>
                    <td style={tdStyle}>
                      <Badge color={pdfColors.blue}>{getDurationLabel(plan.durationId)}</Badge>
                    </td>
                    {suppliers.map((s) => {
                      const usd = plan.prices[s.id] || 0;
                      const isBest = usd > 0 && usd === minP;
                      return (
                        <React.Fragment key={s.id}>
                          <td style={{ ...tdStyle, fontWeight: isBest ? '800' : '500', color: isBest ? pdfColors.green : '#333', background: isBest ? '#E8FFF3' : undefined }}>
                            {usd > 0 ? `$${fmt(usd)}` : <span style={{ color: '#bbb', fontSize: '10px' }}>—</span>}
                          </td>
                          <td style={{ ...tdStyle, color: isBest ? pdfColors.green : '#666', background: isBest ? '#E8FFF3' : undefined }}>
                            {usd > 0 ? `${fmt(usd * exchangeRate)}` : <span style={{ color: '#bbb', fontSize: '10px' }}>—</span>}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td style={{ ...tdStyle, fontWeight: '700', color: pdfColors.green }}>
                      {minP < Infinity ? `${bestName} — $${fmt(minP)}` : <span style={{ color: '#bbb' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {productAnalytics.length > 0 && (
            <>
              <SectionTitle color={pdfColors.orange}>
                <BarChartIcon className="icon-sm" /> تحليل التوفير لكل خطة
              </SectionTitle>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: `1px solid ${pdfColors.border}` }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: 'right' }}>الخطة</th>
                    <th style={thStyle}>أفضل مورد</th>
                    <th style={thStyle}>أقل سعر ($)</th>
                    <th style={thStyle}>المتوسط ($)</th>
                    <th style={thStyle}>التوفير ($)</th>
                    <th style={thStyle}>نسبة التوفير</th>
                  </tr>
                </thead>
                <tbody>
                  {productAnalytics.map((a, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fafbff' : '#fff' }}>
                      <td style={{ ...tdStyle, textAlign: 'right' }}><Badge color={pdfColors.blue}>{a.planDuration}</Badge></td>
                      <td style={{ ...tdStyle, fontWeight: '600', color: pdfColors.green }}>{a.cheapest.supplierName}</td>
                      <td style={{ ...tdStyle, fontWeight: '700' }}>{a.cheapest.price > 0 ? `$${fmt(a.cheapest.price)}` : '—'}</td>
                      <td style={tdStyle}>{a.avgPrice > 0 ? `$${fmt(a.avgPrice)}` : '—'}</td>
                      <td style={{ ...tdStyle, color: pdfColors.orange, fontWeight: '600' }}>${fmt(a.savings)}</td>
                      <td style={tdStyle}>
                        <Badge color={parseFloat(a.savingsPercent) > 10 ? pdfColors.red : pdfColors.orange}>{a.savingsPercent}%</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
        <ReportFooter />
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // 3. SUPPLIER REPORT — One or all suppliers
  // ══════════════════════════════════════════════════════════
  const renderSupplierReport = (supplierFilter) => {
    const targetSuppliers = supplierFilter === 'all' ? suppliers : suppliers.filter((s) => s.id === parseInt(supplierFilter));
    const title = supplierFilter === 'all'
      ? <><BuildingIcon style={{width: 24, height: 24}} /> تقرير جميع الموردين</>
      : <><BuildingIcon style={{width: 24, height: 24}} /> تقرير المورد: {targetSuppliers[0]?.name || ''}</>;

    return (
      <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: pdfColors.primary, minWidth: '720px' }}>
        <ReportHeader
          title={title}
          color={pdfColors.green}
          subtitle={`${targetSuppliers.length} مورد — ${products.length} منتج — سعر الصرف: 1$ = ${exchangeRate} ﷼`}
        />

        {targetSuppliers.map((supplier, sIdx) => {
          const supplierPlans = [];
          let totalSpend = 0, planCount = 0, bestCount = 0;
          products.forEach((product) => {
            product.plans.forEach((plan) => {
              const price = plan.prices[supplier.id] || 0;
              if (price > 0) {
                let minP = Infinity;
                suppliers.forEach((s) => { const p = plan.prices[s.id] || 0; if (p > 0 && p < minP) minP = p; });
                const isBest = price === minP;
                supplierPlans.push({ productName: formatProductName(product), duration: getDurationLabel(plan.durationId), price, isBest });
                totalSpend += price;
                planCount++;
                if (isBest) bestCount++;
              }
            });
          });
          const winRate = planCount > 0 ? fmtPct((bestCount / planCount) * 100) : '0';

          return (
            <div key={supplier.id} style={{ padding: '18px 28px', borderBottom: sIdx < targetSuppliers.length - 1 ? `3px solid ${pdfColors.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `linear-gradient(135deg,${pdfColors.green},${pdfColors.green}cc)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', flexShrink: 0 }}>
                  {supplier.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: pdfColors.green }}>{supplier.name}</div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                    {[
                      supplier.whatsapp && `واتساب: ${supplier.whatsapp}`,
                      supplier.telegram && `تيليجرام: @${supplier.telegram}`,
                      supplier.g2g && `G2G: ${supplier.g2g}`,
                    ].filter(Boolean).join(' — ') || 'لا توجد معلومات اتصال'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <MetricCard label="الخطط المتاحة" value={planCount} color={pdfColors.green} />
                <MetricCard label="الأفضل سعراً" value={bestCount} color={pdfColors.accent} />
                <MetricCard label="نسبة الفوز" value={`${winRate}%`} color={pdfColors.blue} />
                <MetricCard label="إجمالي الأسعار" value={`$${fmt(totalSpend)}`} color={pdfColors.orange} />
              </div>

              {supplierPlans.length === 0 ? (
                <p style={{ color: '#999', fontSize: '12px', textAlign: 'center', padding: '16px 0' }}>لا توجد أسعار مسجّلة لهذا المورد.</p>
              ) : (() => {
                const groupedPlans = [];
                let curGroup = null;
                supplierPlans.forEach(row => {
                  if (!curGroup || curGroup.productName !== row.productName) {
                    curGroup = { productName: row.productName, rows: [] };
                    groupedPlans.push(curGroup);
                  }
                  curGroup.rows.push(row);
                });
                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: `1px solid ${pdfColors.border}` }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, background: pdfColors.green, color: '#fff', textAlign: 'right' }}>المنتج</th>
                        <th style={{ ...thStyle, background: pdfColors.green, color: '#fff' }}>الخطة</th>
                        <th style={{ ...thStyle, background: pdfColors.green, color: '#fff' }}>السعر ($)</th>
                        <th style={{ ...thStyle, background: pdfColors.green, color: '#fff' }}>السعر (﷼)</th>
                        <th style={{ ...thStyle, background: pdfColors.green, color: '#fff' }}>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedPlans.map((g, gIdx) =>
                        g.rows.map((row, ri) => (
                          <tr key={`${gIdx}-${ri}`} style={{ background: gIdx % 2 === 0 ? '#f0faf5' : '#fff', borderTop: ri === 0 ? `2px solid ${pdfColors.green}30` : 'none' }}>
                            {ri === 0 && (
                              <td rowSpan={g.rows.length} style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', fontSize: '12px', verticalAlign: 'middle', borderRight: `3px solid ${pdfColors.green}`, background: gIdx % 2 === 0 ? '#e8f5ef' : '#f5faf7' }}>
                                {row.productName}
                                <div style={{ fontSize: '9px', color: pdfColors.muted, fontWeight: '500', marginTop: '2px' }}>{g.rows.length} خطة</div>
                              </td>
                            )}
                            <td style={tdStyle}><Badge color={pdfColors.green}>{row.duration}</Badge></td>
                            <td style={{ ...tdStyle, fontWeight: '700' }}>${fmt(row.price)}</td>
                            <td style={tdStyle}>{fmt(row.price * exchangeRate)} ﷼</td>
                            <td style={tdStyle}>
                              {row.isBest
                                ? <Badge color={pdfColors.green} bg="#E8FFF3">★ الأفضل</Badge>
                                : <Badge color="#999" bg="#f5f5f5">عادي</Badge>
                              }
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          );
        })}
        <ReportFooter />
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // 4. COMPARISON REPORT — Side-by-side supplier comparison
  // ══════════════════════════════════════════════════════════
  const renderComparisonReport = () => (
    <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: pdfColors.primary, width: '780px' }}>
      <ReportHeader
        title={<><ScaleIcon style={{width: 24, height: 24}} /> مقارنة الموردين — تحليل أفضل الأسعار</>}
        color={pdfColors.green}
        subtitle={`${products.length} منتج — ${suppliers.length} مورد — سعر الصرف: 1$ = ${exchangeRate} ﷼`}
        stats={<>
          <MetricCard label="إجمالي التوفير ($)" value={`$${fmt(totalSavings)}`} color={pdfColors.orange} />
          <MetricCard label="إجمالي التوفير (﷼)" value={`${fmt(totalSavings * exchangeRate)}`} color={pdfColors.gold} />
          <MetricCard label="متوسط نسبة التوفير" value={`${avgSavingsPercent}%`} color={pdfColors.red} />
          <MetricCard label="إجمالي الخطط" value={totalPlans} color={pdfColors.blue} />
        </>}
      />
      <div style={{ padding: '16px 28px' }}>
        <SectionTitle color={pdfColors.green}>
          <ScaleIcon className="icon-sm" /> جدول المقارنة التفصيلي
        </SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: `1px solid ${pdfColors.border}` }}>
          <thead>
            <tr>
              {['المنتج','الخطة','أفضل مورد','السعر ($)','السعر (﷼)','المتوسط ($)','أغلى سعر ($)','التوفير ($)','نسبة التوفير'].map((h) => (
                <th key={h} style={{ ...thStyle, background: pdfColors.green, color: '#fff', textAlign: h === 'المنتج' ? 'right' : 'center', fontSize: '11px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedAnalytics.map((group, gi) =>
              group.plans.map((a, pi) => (
                <tr key={`${gi}-${pi}`} style={{ background: gi % 2 === 0 ? '#f0faf5' : '#fff', borderTop: pi === 0 ? `2px solid ${pdfColors.green}30` : 'none' }}>
                  {pi === 0 && (
                    <td rowSpan={group.plans.length} style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', fontSize: '12px', verticalAlign: 'middle', borderRight: `3px solid ${pdfColors.green}`, background: gi % 2 === 0 ? '#e8f5ef' : '#f5faf7' }}>
                      {a.productName}
                      <div style={{ fontSize: '9px', color: pdfColors.muted, fontWeight: '500', marginTop: '2px' }}>{group.plans.length} خطة</div>
                    </td>
                  )}
                  <td style={tdStyle}><Badge color={pdfColors.green}>{a.planDuration}</Badge></td>
                  <td style={{ ...tdStyle, fontWeight: '600', color: pdfColors.green }}>{a.cheapest.supplierName !== '-' ? a.cheapest.supplierName : <span style={{ color: '#bbb' }}>—</span>}</td>
                  <td style={{ ...tdStyle, fontWeight: '700' }}>{a.cheapest.price > 0 ? `$${fmt(a.cheapest.price)}` : '—'}</td>
                  <td style={tdStyle}>{a.cheapest.price > 0 ? `${fmt(a.cheapest.price * exchangeRate)}` : '—'}</td>
                  <td style={tdStyle}>{a.avgPrice > 0 ? `$${fmt(a.avgPrice)}` : '—'}</td>
                  <td style={{ ...tdStyle, color: pdfColors.red }}>{a.expensive.price > 0 ? `$${fmt(a.expensive.price)}` : '—'}</td>
                  <td style={{ ...tdStyle, color: pdfColors.orange, fontWeight: '600' }}>${fmt(a.savings)}</td>
                  <td style={tdStyle}>
                    <Badge color={parseFloat(a.savingsPercent) > 10 ? pdfColors.red : pdfColors.orange}>{a.savingsPercent}%</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <SectionTitle color={pdfColors.accent}>
          <StarIcon className="icon-sm" /> ملخص أداء الموردين
        </SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: `1px solid ${pdfColors.border}` }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff', textAlign: 'right' }}>المورد</th>
              <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>الخطط المتوفرة</th>
              <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>مرات الأفضل سعراً</th>
              <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>نسبة الفوز</th>
              <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>إجمالي الأسعار ($)</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s, si) => {
              let planCount = 0, bestCount = 0, totalSpend = 0;
              products.forEach(product => {
                product.plans.forEach(plan => {
                  const p = plan.prices[s.id] || 0;
                  if (p > 0) {
                    planCount++;
                    totalSpend += p;
                    let minP = Infinity;
                    suppliers.forEach(sup => { const sp = plan.prices[sup.id] || 0; if (sp > 0 && sp < minP) minP = sp; });
                    if (p === minP) bestCount++;
                  }
                });
              });
              const winRate = planCount > 0 ? fmtPct((bestCount / planCount) * 100) : '0';
              return (
                <tr key={s.id} style={{ background: si % 2 === 0 ? '#fafbff' : '#fff' }}>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700' }}>{s.name}</td>
                  <td style={tdStyle}>{planCount}</td>
                  <td style={{ ...tdStyle, fontWeight: '700', color: pdfColors.green }}>{bestCount}</td>
                  <td style={tdStyle}><Badge color={parseFloat(winRate) >= 50 ? pdfColors.green : pdfColors.orange}>{winRate}%</Badge></td>
                  <td style={{ ...tdStyle, fontWeight: '600' }}>${fmt(totalSpend)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ReportFooter />
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // 5. SUMMARY / EXECUTIVE REPORT
  // ══════════════════════════════════════════════════════════
  const renderSummaryReport = () => {
    const bestPerProduct = getBestSupplierPerProduct(products);
    const overallBest = getOverallBestSupplier();

    const supplierStats = suppliers.map(s => {
      let planCount = 0, bestCount = 0, totalSpend = 0;
      products.forEach(product => {
        product.plans.forEach(plan => {
          const p = plan.prices[s.id] || 0;
          if (p > 0) {
            planCount++; totalSpend += p;
            let minP = Infinity;
            suppliers.forEach(sup => { const sp = plan.prices[sup.id] || 0; if (sp > 0 && sp < minP) minP = sp; });
            if (p === minP) bestCount++;
          }
        });
      });
      return { ...s, planCount, bestCount, totalSpend, winRate: planCount > 0 ? (bestCount / planCount) * 100 : 0 };
    }).sort((a, b) => b.bestCount - a.bestCount);

    return (
      <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: pdfColors.primary, width: '720px' }}>
        <ReportHeader
          title={<><TrendingUpIcon style={{width: 24, height: 24}} /> الملخص التنفيذي — تقرير شامل</>}
          color={pdfColors.blue}
          subtitle={`نظرة شاملة على أداء المتجر والموردين — سعر الصرف: 1$ = ${exchangeRate} ﷼`}
          stats={<>
            <MetricCard label="المنتجات" value={products.length} color={pdfColors.accent} />
            <MetricCard label="الموردين" value={suppliers.length} color={pdfColors.green} />
            <MetricCard label="الخطط" value={totalPlans} color={pdfColors.blue} />
            <MetricCard label="التوفير ($)" value={`$${fmt(totalSavings)}`} color={pdfColors.orange} />
            <MetricCard label="التوفير (﷼)" value={`${fmt(totalSavings * exchangeRate)}`} color={pdfColors.gold} />
            <MetricCard label="متوسط التوفير" value={`${avgSavingsPercent}%`} color={pdfColors.red} />
          </>}
        />

        <div style={{ padding: '16px 28px' }}>
          {overallBest && (
            <div style={{ background: `linear-gradient(135deg, #E8FFF3, #f0faf5)`, border: `2px solid ${pdfColors.green}40`, borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: pdfColors.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>★</div>
              <div>
                <div style={{ fontSize: '11px', color: pdfColors.muted, marginBottom: '2px' }}>التوصية — أفضل مورد عام</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: pdfColors.green }}>{overallBest.name}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>الأفضل سعراً في {overallBest.count} من أصل {overallBest.total} خطة</div>
              </div>
            </div>
          )}

          <SectionTitle color={pdfColors.accent}>
            <BuildingIcon className="icon-sm" /> تقييم أداء الموردين
          </SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: `1px solid ${pdfColors.border}`, marginBottom: '16px' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff', textAlign: 'right' }}>المورد</th>
                <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>الخطط</th>
                <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>مرات الفوز</th>
                <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>نسبة الفوز</th>
                <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>إجمالي ($)</th>
                <th style={{ ...thStyle, background: pdfColors.accent, color: '#fff' }}>التقييم</th>
              </tr>
            </thead>
            <tbody>
              {supplierStats.map((s, si) => (
                <tr key={s.id} style={{ background: si % 2 === 0 ? '#fafbff' : '#fff' }}>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700' }}>{s.name}</td>
                  <td style={tdStyle}>{s.planCount}</td>
                  <td style={{ ...tdStyle, fontWeight: '700', color: pdfColors.green }}>{s.bestCount}</td>
                  <td style={tdStyle}><Badge color={s.winRate >= 50 ? pdfColors.green : s.winRate >= 25 ? pdfColors.orange : pdfColors.red}>{fmtPct(s.winRate)}%</Badge></td>
                  <td style={{ ...tdStyle, fontWeight: '600' }}>${fmt(s.totalSpend)}</td>
                  <td style={tdStyle}>
                    {s.winRate >= 50 ? <Badge color={pdfColors.green}>ممتاز</Badge> : s.winRate >= 25 ? <Badge color={pdfColors.orange}>جيد</Badge> : <Badge color={pdfColors.red}>ضعيف</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {bestPerProduct.length > 0 && (
            <>
              <SectionTitle color={pdfColors.green}>
                <StarIcon className="icon-sm" /> أفضل مورد لكل منتج
              </SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {bestPerProduct.map((bp, idx) => (
                  <div key={idx} style={{ background: '#f0faf5', border: `1px solid ${pdfColors.green}30`, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: pdfColors.muted, marginBottom: '2px' }}>{bp.productName}</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: pdfColors.green }}>{bp.supplierName}</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>الأفضل في {bp.planCount} {bp.planCount === 1 ? 'خطة' : 'خطط'}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <SectionTitle color={pdfColors.orange}>
            <BarChartIcon className="icon-sm" /> تحليل التوفير لجميع المنتجات
          </SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: `1px solid ${pdfColors.border}` }}>
            <thead>
              <tr>
                {['المنتج','الخطة','أفضل مورد','أقل سعر ($)','أقل سعر (﷼)','المتوسط ($)','التوفير ($)','نسبة التوفير'].map((h) => (
                  <th key={h} style={{ ...thStyle, background: pdfColors.orange, color: '#fff', textAlign: h === 'المنتج' ? 'right' : 'center', fontSize: '11px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedAnalytics.map((group, gi) =>
                group.plans.map((a, pi) => (
                  <tr key={`${gi}-${pi}`} style={{ background: gi % 2 === 0 ? '#fff9f5' : '#fff', borderTop: pi === 0 ? `2px solid ${pdfColors.orange}30` : 'none' }}>
                    {pi === 0 && (
                      <td rowSpan={group.plans.length} style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', fontSize: '12px', verticalAlign: 'middle', borderRight: `3px solid ${pdfColors.orange}`, background: gi % 2 === 0 ? '#fff3ec' : '#fffaf7' }}>
                        {a.productName}
                        <div style={{ fontSize: '9px', color: pdfColors.muted, fontWeight: '500', marginTop: '2px' }}>{group.plans.length} خطة</div>
                      </td>
                    )}
                    <td style={tdStyle}><Badge color={pdfColors.orange}>{a.planDuration}</Badge></td>
                    <td style={{ ...tdStyle, fontWeight: '600', color: pdfColors.green }}>{a.cheapest.supplierName !== '-' ? a.cheapest.supplierName : '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: '700' }}>{a.cheapest.price > 0 ? `$${fmt(a.cheapest.price)}` : '—'}</td>
                    <td style={tdStyle}>{a.cheapest.price > 0 ? `${fmt(a.cheapest.price * exchangeRate)}` : '—'}</td>
                    <td style={tdStyle}>{a.avgPrice > 0 ? `$${fmt(a.avgPrice)}` : '—'}</td>
                    <td style={{ ...tdStyle, color: pdfColors.orange, fontWeight: '600' }}>${fmt(a.savings)}</td>
                    <td style={tdStyle}><Badge color={parseFloat(a.savingsPercent) > 10 ? pdfColors.red : pdfColors.orange}>{a.savingsPercent}%</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ReportFooter />
      </div>
    );
  };

  const renderHiddenContent = () => {
    if (generating === 'full')       return renderFullReport();
    if (generating === 'comparison') return renderComparisonReport();
    if (generating === 'summary')    return renderSummaryReport();
    if (generating?.startsWith('product-')) {
      const pid = parseInt(generating.replace('product-', ''));
      return renderProductReport(products.find((p) => p.id === pid));
    }
    if (generating?.startsWith('supplier-')) {
      const sid = generating.replace('supplier-', '');
      return renderSupplierReport(sid);
    }
    return null;
  };

  const selectedProduct = products.find((p) => p.id === parseInt(selectedProductId));

  return (
    <div className="reports-page" dir="rtl">
      <div className="reports-page-header">
        <div className="reports-page-header-icon">
          <BarChartIcon className="icon-xl" />
        </div>
        <div>
          <h2 className="reports-title">التقارير وتصدير PDF</h2>
          <p className="reports-subtitle">إنشاء تقارير احترافية وتحليل بيانات المنتجات والموردين</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon"><PackageIcon /></div>
          <div className="stat-value">{products.length}</div>
          <div className="stat-label">عدد المنتجات</div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon"><BuildingIcon /></div>
          <div className="stat-value">{suppliers.length}</div>
          <div className="stat-label">عدد الموردين</div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon"><ClipboardIcon /></div>
          <div className="stat-value">{totalPlans}</div>
          <div className="stat-label">إجمالي الخطط</div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon"><CurrencyIcon /></div>
          <div className="stat-value">{avgSavingsPercent}%</div>
          <div className="stat-label">متوسط التوفير</div>
        </div>
      </div>

      <div className="report-section-tabs">
        {[
          { id: 'global',   label: <span className="flex-row gap-2 align-center"><GlobeIcon className="icon-sm" /> تقارير عامة</span> },
          { id: 'product',  label: <span className="flex-row gap-2 align-center"><PackageIcon className="icon-sm" /> تقرير منتج</span> },
          { id: 'supplier', label: <span className="flex-row gap-2 align-center"><BuildingIcon className="icon-sm" /> تقرير مورد</span> },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`report-section-tab ${activeSection === tab.id ? 'report-section-tab-active' : ''}`}
            onClick={() => setActiveSection(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === 'global' && (
        <div className="report-cards">
          <div className="report-card">
            <div className="report-card-header blue-header">
              <span className="report-icon"><ClipboardIcon /></span><h3>التقرير الكامل</h3>
            </div>
            <p>جميع المنتجات وخططها مع أسعار كل مورد بالدولار والريال وأفضل الموردين</p>
            <button className="btn-generate" onClick={() => generatePDF('full', 'تقرير_كامل_مفتاح.pdf', true)} disabled={!!generating}>
              {generating === 'full' ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تحميل PDF</>}
            </button>
          </div>
          <div className="report-card">
            <div className="report-card-header green-header">
              <span className="report-icon"><ScaleIcon /></span><h3>مقارنة الموردين</h3>
            </div>
            <p>أفضل سعر لكل خطة مع نسبة التوفير وتقييم أداء كل مورد ونسبة فوزه</p>
            <button className="btn-generate green-btn" onClick={() => generatePDF('comparison', 'مقارنة_الموردين_مفتاح.pdf')} disabled={!!generating}>
              {generating === 'comparison' ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تحميل PDF</>}
            </button>
          </div>
          <div className="report-card">
            <div className="report-card-header purple-header">
              <span className="report-icon"><TrendingUpIcon /></span><h3>الملخص التنفيذي</h3>
            </div>
            <p>تقرير شامل مع توصيات وتقييم الموردين وتحليل التوفير لكل منتج وخطة</p>
            <button className="btn-generate purple-btn" onClick={() => generatePDF('summary', 'الملخص_التنفيذي_مفتاح.pdf')} disabled={!!generating}>
              {generating === 'summary' ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تحميل PDF</>}
            </button>
          </div>
        </div>
      )}

      {activeSection === 'product' && (
        <div className="individual-report-panel">
          <div className="individual-report-header">
            <span className="individual-icon"><PackageIcon /></span>
            <div>
              <h3>تقرير منتج منفرد</h3>
              <p>اختر منتجاً لتصدير تقرير شامل بجميع خططه وأسعار الموردين وتحليل التوفير</p>
            </div>
          </div>
          <div className="individual-select-row">
            <select
              className="individual-select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              dir="rtl"
            >
              <option value="">— اختر منتجاً —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{formatProductName(p)} ({p.plans.length} خطة)</option>
              ))}
            </select>
            {selectedProductId && (
              <button
                className="btn-generate"
                disabled={!!generating}
                onClick={() => {
                  const p = products.find((p) => p.id === parseInt(selectedProductId));
                  if (p) generatePDF(`product-${p.id}`, `تقرير_${p.name}_مفتاح.pdf`);
                }}
              >
                {generating?.startsWith('product-') ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تصدير PDF</>}
              </button>
            )}
          </div>

          {selectedProduct && (
            <div className="ppc-preview-card">
              <div className="ppc-name">{formatProductName(selectedProduct)}</div>
              <div className="ppc-meta">
                <span className="flex-row gap-1 align-center"><ClipboardIcon className="icon-xs" /> {selectedProduct.plans.length} خطة</span>
                <span className="flex-row gap-1 align-center"><BuildingIcon className="icon-xs" /> {suppliers.length} مورد</span>
                {selectedProduct.activationMethods?.length > 0 && (
                  <span className="flex-row gap-1 align-center"><ZapIcon className="icon-xs" /> {selectedProduct.activationMethods.length} طرق تفعيل</span>
                )}
              </div>
              <div className="ppc-plans">
                {selectedProduct.plans.map((plan) => {
                  let minP = Infinity, bestName = '';
                  suppliers.forEach((s) => { const p = plan.prices[s.id] || 0; if (p > 0 && p < minP) { minP = p; bestName = s.name; } });
                  return (
                    <div key={plan.id} className="ppc-plan-row">
                      <span className="ppc-duration">{getDurationLabel(plan.durationId)}</span>
                      {minP < Infinity ? (
                        <span className="ppc-best">أفضل: {bestName} — ${fmt(minP)}</span>
                      ) : (
                        <span className="ppc-empty">لا توجد أسعار</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'supplier' && (
        <div className="individual-report-panel">
          <div className="individual-report-header">
            <span className="individual-icon"><BuildingIcon /></span>
            <div>
              <h3>تقرير مورد منفرد</h3>
              <p>اختر مورداً واحداً أو صدّر تقريراً لجميع الموردين دفعة واحدة</p>
            </div>
          </div>
          <div className="individual-select-row">
            <select
              className="individual-select"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              dir="rtl"
            >
              <option value="all">جميع الموردين</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              className="btn-generate green-btn"
              disabled={!!generating}
              onClick={() => {
                const name = selectedSupplierId === 'all' ? 'جميع_الموردين' : suppliers.find((s) => s.id === parseInt(selectedSupplierId))?.name || 'مورد';
                generatePDF(`supplier-${selectedSupplierId}`, `تقرير_${name}_مفتاح.pdf`, selectedSupplierId === 'all');
              }}
            >
              {generating?.startsWith('supplier-') ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تصدير PDF</>}
            </button>
          </div>

          <div className="supplier-cards-preview">
            {suppliers.map((s) => {
              let planCount = 0, bestCount = 0;
              products.forEach((product) => {
                product.plans.forEach((plan) => {
                  const p = plan.prices[s.id] || 0;
                  if (p > 0) {
                    planCount++;
                    let minP = Infinity;
                    suppliers.forEach((sup) => { const sp = plan.prices[sup.id] || 0; if (sp > 0 && sp < minP) minP = sp; });
                    if (p === minP) bestCount++;
                  }
                });
              });
              const isSelected = selectedSupplierId === 'all' || selectedSupplierId === String(s.id);
              return (
                <div
                  key={s.id}
                  className={`scp-card ${isSelected ? 'scp-card-active' : ''}`}
                  onClick={() => setSelectedSupplierId(String(s.id))}
                >
                  <div className="scp-avatar">{s.name.charAt(0)}</div>
                  <div className="scp-name">{s.name}</div>
                  <div className="scp-stats">
                    <span className="flex-row gap-1 align-center"><ClipboardIcon className="icon-xs" /> {planCount} خطة</span>
                    <span className="flex-row gap-1 align-center"><StarIcon className="icon-xs" /> {bestCount} الأفضل</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="analytics-preview">
        <div className="analytics-header">
          <h3 className="flex-row align-center gap-2"><BarChartIcon className="icon-sm" /> ملخص التحليلات</h3>
          <div className="analytics-actions">
            <button className="analytics-toggle-btn" onClick={expandAll} title="توسيع الكل">
              <span className="toggle-icon">▼</span> توسيع الكل
            </button>
            <button className="analytics-toggle-btn" onClick={collapseAll} title="طي الكل">
              <span className="toggle-icon">▲</span> طي الكل
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="analytics-table grouped-table">
            <thead>
              <tr>
                <th className="th-product">المنتج</th><th>الخطة</th><th>أفضل مورد</th>
                <th>أقل سعر ($)</th><th>أقل سعر (﷼)</th>
                <th>المتوسط</th><th>التوفير</th><th>نسبة التوفير</th>
              </tr>
            </thead>
            <tbody>
              {groupedAnalytics.map((group, gi) => {
                const isExpanded = expandedProducts[group.productName];
                const bestPlan = group.plans.reduce((best, a) => parseFloat(a.savingsPercent) > parseFloat(best.savingsPercent) ? a : best, group.plans[0]);
                const totalGroupSavings = group.plans.reduce((s, a) => s + a.savings, 0);
                return (
                  <React.Fragment key={gi}>
                    <tr className={`product-group-row ${isExpanded ? 'group-expanded' : ''}`} onClick={() => toggleProduct(group.productName)}>
                      <td className="td-product-name td-group-name">
                        <span className={`group-chevron ${!isExpanded ? 'chevron-collapsed' : ''}`}>
                          <ChevronDownIcon className="icon-xs" />
                        </span>
                        {group.productName}
                        <span className="group-plan-count">{group.plans.length} خطة</span>
                      </td>
                      {!isExpanded ? (
                        <td colSpan={7} className="td-group-summary">
                          <div className="collapsed-summary-row">
                            <div className="collapsed-summary-cell">
                              <span className="collapsed-label">أفضل مورد</span>
                              <span className="collapsed-value green">{bestPlan.cheapest.supplierName}</span>
                            </div>
                            <div className="collapsed-summary-divider"></div>
                            <div className="collapsed-summary-cell">
                              <span className="collapsed-label">أقل سعر</span>
                              <span className="collapsed-value blue">${fmt(bestPlan.cheapest.price)}</span>
                            </div>
                            <div className="collapsed-summary-divider"></div>
                            <div className="collapsed-summary-cell">
                              <span className="collapsed-label">بالريال</span>
                              <span className="collapsed-value">{fmt(bestPlan.cheapest.price * exchangeRate)} ﷼</span>
                            </div>
                            <div className="collapsed-summary-divider"></div>
                            <div className="collapsed-summary-cell">
                              <span className="collapsed-label">إجمالي التوفير</span>
                              <span className="collapsed-value orange">${fmt(totalGroupSavings)}</span>
                            </div>
                            <div className="collapsed-summary-divider"></div>
                            <div className="collapsed-summary-cell">
                              <span className="collapsed-label">نسبة التوفير</span>
                              <span className="collapsed-value purple">{bestPlan.savingsPercent}%</span>
                            </div>
                          </div>
                        </td>
                      ) : (
                        <td colSpan={7} className="td-group-summary"></td>
                      )}
                    </tr>
                    {isExpanded && group.plans.map((a, pi) => (
                      <tr key={pi} className="plan-sub-row">
                        <td className="td-plan-indent"></td>
                        <td><span className="plan-badge">{a.planDuration}</span></td>
                        <td className="td-best-supplier">{a.cheapest.supplierName !== '-' ? a.cheapest.supplierName : <span className="price-not-available">لا يوجد</span>}</td>
                        <td className="td-price">{a.cheapest.price > 0 ? `$${fmt(a.cheapest.price)}` : <span className="price-not-available" style={{opacity: 0.5}}>-</span>}</td>
                        <td className="td-price">{a.cheapest.price > 0 ? `${fmt(a.cheapest.price * exchangeRate)} ﷼` : <span className="price-not-available" style={{opacity: 0.5}}>-</span>}</td>
                        <td className="td-price">{a.avgPrice > 0 ? `$${fmt(a.avgPrice)}` : <span className="price-not-available" style={{opacity: 0.5}}>-</span>}</td>
                        <td className="td-savings">${fmt(a.savings)}</td>
                        <td className="td-savings-pct">{a.savingsPercent}%</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {generating && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <div ref={reportRef}>{renderHiddenContent()}</div>
        </div>
      )}
    </div>
  );
}

export default ReportsExport;
