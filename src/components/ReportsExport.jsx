import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  BarChartIcon, PackageIcon, BuildingIcon, ClipboardIcon, 
  CurrencyIcon, GlobeIcon, ScaleIcon, TrendingUpIcon, ZapIcon, DownloadIcon,
  StarIcon, KeyIcon, UserIcon, UsersIcon
} from './Icons';

const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtInt = (v) => Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });

// ── Shared inline styles ────────────────────────────────────
const thStyle = {
  padding: '10px 12px',
  textAlign: 'center',
  fontWeight: '700',
  borderBottom: '2px solid #e5e7eb',
  background: '#f8f9fe',
  fontSize: '12px',
  whiteSpace: 'nowrap',
};
const subThStyle = {
  padding: '6px 8px',
  textAlign: 'center',
  fontWeight: '500',
  borderBottom: '1px solid #e5e7eb',
  background: '#fafbff',
  fontSize: '11px',
};
const tdStyle = {
  padding: '8px 12px',
  textAlign: 'center',
  borderBottom: '1px solid #f0f0f0',
  fontSize: '13px',
};

// ── Helper sub-components ─────────────────────────────────────
const MetricCard = ({ label, value, color }) => (
  <div style={{
    background: `${color}14`,
    border: `2px solid ${color}35`,
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
  }}>
    <div style={{ fontSize: '22px', fontWeight: '800', color }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{label}</div>
  </div>
);

const ReportHeader = ({ title, color, subtitle }) => (
  <div style={{
    background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
    color: '#fff',
    padding: '28px 36px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }}>
    <div>
      <h1 style={{ fontSize: '26px', margin: '0 0 6px 0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>{title}</h1>
      {subtitle && <p style={{ fontSize: '13px', margin: 0, opacity: 0.88 }}>{subtitle}</p>}
    </div>
    <div style={{ textAlign: 'left' }}>
      <div style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
        متجر مفتاح <KeyIcon className="icon-sm" style={{ color: '#fff' }} />
      </div>
      <div style={{ fontSize: '11px', opacity: 0.82 }}>
        {new Date().toLocaleDateString('ar-SA-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  </div>
);

const ReportFooter = () => (
  <div style={{
    background: '#f5f5f5',
    padding: '10px 30px',
    textAlign: 'center',
    fontSize: '11px',
    color: '#999',
    borderTop: '1px solid #eee',
  }}>
    متجر مفتاح — تم إنشاء هذا التقرير تلقائياً بتاريخ {new Date().toLocaleDateString('ar-SA-u-nu-latn', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })}
  </div>
);

// ── Main Component ──────────────────────────────────────────────
function ReportsExport({ products, suppliers, durations, exchangeRate, activationMethods = [] }) {
  const reportRef = useRef(null);
  const [generating, setGenerating] = useState(null);   // string key
  const [activeSection, setActiveSection] = useState('global'); // 'global' | 'product' | 'supplier'
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('all');

  const getDurationLabel = (durationId) => {
    const dur = durations.find((d) => d.id === durationId);
    return dur ? dur.label : durationId;
  };

  const formatProductName = (product) => {
    if (product.accountType === 'individual') return `${product.name} (فردي)`;
    if (product.accountType === 'team') return `${product.name} (فريق)`;
    return product.name;
  };

  // ── Analytics helpers ──────────────────────────────────────
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

  // ── PDF generation ──────────────────────────────────────────
  const generatePDF = async (key, filename, isLandscape = false) => {
    setGenerating(key);
    try {
      await new Promise((r) => setTimeout(r, 150));
      const element = reportRef.current;
      if (!element) return;
      const canvas = await html2canvas(element, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
      });
      const imgData   = canvas.toDataURL('image/png');
      const orientation = isLandscape ? 'landscape' : 'portrait';
      const doc       = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
      const pw        = doc.internal.pageSize.getWidth() - 20;
      const ph        = doc.internal.pageSize.getHeight() - 20;
      const ratio     = Math.min(pw / canvas.width, ph / canvas.height);
      const sw        = canvas.width * ratio;
      const sh        = canvas.height * ratio;
      const xOff      = (doc.internal.pageSize.getWidth() - sw) / 2;
      doc.addImage(imgData, 'PNG', xOff, 10, sw, sh);
      doc.save(filename);
    } catch (e) {
      alert('حدث خطأ أثناء إنشاء التقرير: ' + e.message);
    } finally {
      setGenerating(null);
    }
  };

  // ── Report renderers (hidden off-screen) ─────────────────────

  // 1. Full global report
  const renderFullReport = () => (
    <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: '#1a1a2e', minWidth: '900px' }}>
      <ReportHeader title={<><ClipboardIcon style={{width: 28, height: 28}} /> التقرير الكامل — جميع المنتجات</>} color="#5E4FDE"
        subtitle={`سعر الصرف: 1 دولار = ${exchangeRate} ريال`} />
      <div style={{ padding: '24px 30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={{ ...thStyle, textAlign: 'right', minWidth: '120px' }}>المنتج</th>
              <th style={thStyle}>الخطة</th>
              {suppliers.map((s) => (
                <th key={s.id} style={{ ...thStyle, background: '#5E4FDE', color: '#fff' }} colSpan={2}>{s.name}</th>
              ))}
            </tr>
            <tr>
              <th style={subThStyle} /><th style={subThStyle} /><th style={subThStyle} />
              {suppliers.map((s) => (
                <React.Fragment key={s.id}>
                  <th style={{ ...subThStyle, color: '#5E4FDE' }}>دولار $</th>
                  <th style={{ ...subThStyle, color: '#11BA65' }}>ريال ﷼</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product, pi) =>
              product.plans.map((plan, planIdx) => (
                <tr key={`${product.id}-${plan.id}`} style={{ background: pi % 2 === 0 ? '#f8f9fe' : '#fff' }}>
                  {planIdx === 0 && (
                    <>
                      <td style={{ ...tdStyle, fontWeight: '700', color: '#888' }} rowSpan={product.plans.length}>{pi + 1}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700' }} rowSpan={product.plans.length}>{formatProductName(product)}</td>
                    </>
                  )}
                  <td style={tdStyle}>
                    <span style={{ background: '#EEF0FF', color: '#5E4FDE', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                      {getDurationLabel(plan.durationId)}
                    </span>
                  </td>
                  {suppliers.map((s) => {
                    const usd = plan.prices[s.id] || 0;
                    const sar = fmt(usd * exchangeRate);
                    let minP = Infinity;
                    Object.values(plan.prices).forEach((p) => { if (p > 0 && p < minP) minP = p; });
                    const isBest = usd > 0 && usd === minP;
                    return (
                      <React.Fragment key={s.id}>
                        <td style={{ ...tdStyle, fontWeight: '600', color: isBest ? '#11BA65' : '#333', background: isBest ? '#E8FFF3' : undefined }}>
                          {usd > 0 ? `$${fmt(usd)}` : <span style={{ color: '#aaa', fontSize: '11px', fontWeight: '500' }}>غير متوفر</span>}
                        </td>
                        <td style={{ ...tdStyle, color: isBest ? '#11BA65' : '#666', background: isBest ? '#E8FFF3' : undefined }}>
                          {usd > 0 ? `${sar} ﷼` : <span style={{ color: '#aaa', fontSize: '11px', fontWeight: '500', opacity: 0.5 }}>-</span>}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ReportFooter />
    </div>
  );

  // 2. Single product report
  const renderProductReport = (product) => {
    if (!product) return null;
    const productAnalytics = getAnalyticsFor([product]);
    const bestSupplier = getBestSupplierPerProduct([product])[0];
    const assignedMethods = (product.activationMethods || [])
      .map((mId) => activationMethods.find((x) => x.id === mId))
      .filter(Boolean);

    return (
      <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: '#1a1a2e', width: '720px' }}>
        <ReportHeader title={<><PackageIcon style={{width: 28, height: 28}} /> تقرير المنتج: {formatProductName(product)}</>} color="#1A51F4"
          subtitle={`${product.plans.length} خطة — سعر الصرف: 1$ = ${exchangeRate} ﷼`} />
        <div style={{ padding: '24px 30px', display: 'flex', gap: '16px', marginBottom: '0', flexWrap: 'wrap' }}>
          <MetricCard label="عدد الخطط"    value={product.plans.length} color="#1A51F4" />
          <MetricCard label="عدد الموردين" value={suppliers.length}       color="#5E4FDE" />
          {bestSupplier && <MetricCard label="أفضل مورد" value={bestSupplier.supplierName} color="#11BA65" />}
          {productAnalytics.length > 0 && (
            <MetricCard label="متوسط التوفير"
              value={`${fmtPct(productAnalytics.reduce((s,a) => s+parseFloat(a.savingsPercent),0)/productAnalytics.length)}%`}
              color="#F7784A" />
          )}
        </div>
        
        {assignedMethods.length > 0 && (
          <div style={{ padding: '0 30px', marginTop: '8px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#5E4FDE', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ZapIcon className="icon-sm" /> طرق التفعيل المتاحة
            </h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {assignedMethods.map((m) => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  padding: '8px 14px', borderRadius: '8px', 
                  background: `${m.color}15`, border: `1px solid ${m.color}30`,
                  color: m.color, fontSize: '13px', fontWeight: '600'
                }}>
                  <span style={{ fontSize: '16px' }}>{m.icon}</span>
                  <div>
                    <div style={{ lineHeight: '1.2' }}>{m.label}</div>
                    {m.description && <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px', fontWeight: '500' }}>{m.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: '0 30px 24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1A51F4', margin: '20px 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CurrencyIcon className="icon-sm" /> جدول الأسعار التفصيلي
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={thStyle}>الخطة</th>
                {suppliers.map((s) => (
                  <th key={s.id} style={{ ...thStyle, background: '#1A51F4', color: '#fff' }} colSpan={2}>{s.name}</th>
                ))}
                <th style={{ ...thStyle, background: '#11BA65', color: '#fff' }}>أفضل سعر</th>
              </tr>
              <tr>
                <th style={subThStyle} />
                {suppliers.map((s) => (
                  <React.Fragment key={s.id}>
                    <th style={{ ...subThStyle, color: '#1A51F4' }}>$ دولار</th>
                    <th style={{ ...subThStyle, color: '#11BA65' }}>﷼ ريال</th>
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
                      <span style={{ background: '#EEF0FF', color: '#1A51F4', padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                        {getDurationLabel(plan.durationId)}
                      </span>
                    </td>
                    {suppliers.map((s) => {
                      const usd = plan.prices[s.id] || 0;
                      const isBest = usd > 0 && usd === minP;
                      return (
                        <React.Fragment key={s.id}>
                          <td style={{ ...tdStyle, fontWeight: isBest ? '800' : '500', color: isBest ? '#11BA65' : '#333', background: isBest ? '#E8FFF3' : undefined }}>
                            {usd > 0 ? `$${fmt(usd)}` : <span style={{ color: '#aaa', fontSize: '11px', fontWeight: '500' }}>غير متوفر</span>}
                          </td>
                          <td style={{ ...tdStyle, color: isBest ? '#11BA65' : '#666', background: isBest ? '#E8FFF3' : undefined }}>
                            {usd > 0 ? `${fmt(usd * exchangeRate)} ﷼` : <span style={{ color: '#aaa', fontSize: '11px', fontWeight: '500', opacity: 0.5 }}>-</span>}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td style={{ ...tdStyle, fontWeight: '700', color: '#11BA65' }}>
                      {minP < Infinity ? `${bestName} — $${fmt(minP)}` : <span style={{ color: '#aaa', fontSize: '11px', fontWeight: '500' }}>غير متوفر</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ReportFooter />
      </div>
    );
  };

  // 3. Supplier report (one supplier OR all)
  const renderSupplierReport = (supplierFilter) => {
    const targetSuppliers = supplierFilter === 'all' ? suppliers : suppliers.filter((s) => s.id === parseInt(supplierFilter));
    const title = supplierFilter === 'all' ? <><BuildingIcon style={{width: 28, height: 28}} /> تقرير جميع الموردين</> : <><BuildingIcon style={{width: 28, height: 28}} /> تقرير المورد: {targetSuppliers[0]?.name || ''}</>;
    return (
      <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: '#1a1a2e', minWidth: '700px' }}>
        <ReportHeader title={title} color="#11BA65"
          subtitle={`${targetSuppliers.length} مورد — سعر الصرف: 1$ = ${exchangeRate} ﷼`} />

        {targetSuppliers.map((supplier) => {
          // Find best-price plans for this supplier
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

          return (
            <div key={supplier.id} style={{ padding: '20px 30px', borderBottom: '2px solid #f0f0f0' }}>
              {/* Supplier header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#0ea85c,#11ba65)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', flexShrink: 0 }}>
                  {supplier.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#11BA65' }}>{supplier.name}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {supplier.whatsapp && `واتساب: ${supplier.whatsapp} `}
                    {supplier.telegram && `| تيليجرام: @${supplier.telegram} `}
                    {supplier.g2g && `| G2G: ${supplier.g2g}`}
                  </div>
                </div>
                <div style={{ marginRight: 'auto', display: 'flex', gap: '10px' }}>
                  <MetricCard label="الخطط" value={planCount} color="#11BA65" />
                  <MetricCard label="الأفضل سعراً" value={bestCount} color="#5E4FDE" />
                  <MetricCard label="إجمالي الأسعار $" value={`$${fmtInt(totalSpend)}`} color="#1A51F4" />
                </div>
              </div>

              {supplierPlans.length === 0 ? (
                <p style={{ color: '#999', fontSize: '13px' }}>لا توجد أسعار مسجّلة لهذا المورد.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, background: '#11BA65', color: '#fff', textAlign: 'right' }}>المنتج</th>
                      <th style={{ ...thStyle, background: '#11BA65', color: '#fff' }}>الخطة</th>
                      <th style={{ ...thStyle, background: '#11BA65', color: '#fff' }}>السعر ($)</th>
                      <th style={{ ...thStyle, background: '#11BA65', color: '#fff' }}>السعر (﷼)</th>
                      <th style={{ ...thStyle, background: '#11BA65', color: '#fff' }}>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierPlans.map((row, ri) => (
                      <tr key={ri} style={{ background: ri % 2 === 0 ? '#f0faf5' : '#fff' }}>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600' }}>{row.productName}</td>
                        <td style={tdStyle}>
                          <span style={{ background: '#E8FFF3', color: '#11BA65', padding: '3px 10px', borderRadius: '12px', fontSize: '11px' }}>
                            {row.duration}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: '700' }}>${fmt(row.price)}</td>
                        <td style={tdStyle}>{fmt(row.price * exchangeRate)} ﷼</td>
                        <td style={tdStyle}>
                          {row.isBest ? (
                            <span style={{ background: '#E8FFF3', color: '#11BA65', padding: '3px 12px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>
                              ★ الأفضل
                            </span>
                          ) : (
                            <span style={{ background: '#f5f5f5', color: '#999', padding: '3px 12px', borderRadius: '12px', fontSize: '12px' }}>عادي</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
        <ReportFooter />
      </div>
    );
  };

  // 4. Comparison / Summary (existing)
  const renderComparisonReport = () => (
    <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: '#1a1a2e', width: '750px' }}>
      <ReportHeader title={<><ScaleIcon style={{width: 28, height: 28}} /> مقارنة الموردين — أفضل الأسعار</>} color="#11BA65"
        subtitle={`سعر الصرف: 1 دولار = ${exchangeRate} ريال`} />
      <div style={{ padding: '24px 30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              {['المنتج','الخطة','أفضل مورد','السعر ($)','السعر (﷼)','المتوسط ($)','التوفير ($)','نسبة التوفير'].map((h) => (
                <th key={h} style={{ ...thStyle, background: '#11BA65', color: '#fff', textAlign: h === 'المنتج' ? 'right' : 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analytics.map((a, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#f0faf5' : '#fff' }}>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600' }}>{a.productName}</td>
                <td style={tdStyle}><span style={{ background: '#E8FFF3', color: '#11BA65', padding: '3px 10px', borderRadius: '12px', fontSize: '11px' }}>{a.planDuration}</span></td>
                <td style={{ ...tdStyle, fontWeight: '600', color: '#11BA65' }}>{a.cheapest.supplierName !== '-' ? a.cheapest.supplierName : <span style={{ color: '#aaa', fontSize: '11px', fontWeight: '500' }}>لا يوجد</span>}</td>
                <td style={{ ...tdStyle, fontWeight: '700' }}>{a.cheapest.price > 0 ? `$${fmt(a.cheapest.price)}` : <span style={{ color: '#aaa', fontSize: '11px', fontWeight: '500' }}>-</span>}</td>
                <td style={tdStyle}>{a.cheapest.price > 0 ? `${fmt(a.cheapest.price * exchangeRate)} ﷼` : <span style={{ color: '#aaa', fontSize: '11px', fontWeight: '500' }}>-</span>}</td>
                <td style={tdStyle}>{a.avgPrice > 0 ? `$${fmt(a.avgPrice)}` : '-'}</td>
                <td style={{ ...tdStyle, color: '#F7784A', fontWeight: '600' }}>${fmt(a.savings)}</td>
                <td style={tdStyle}>
                  <span style={{ background: parseFloat(a.savingsPercent) > 10 ? '#FFE8E0' : '#FFF8E0', color: parseFloat(a.savingsPercent) > 10 ? '#F94B60' : '#F7784A', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                    {a.savingsPercent}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ReportFooter />
    </div>
  );

  const renderSummaryReport = () => {
    const bestPerProduct = getBestSupplierPerProduct(products);
    return (
      <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', background: '#fff', color: '#1a1a2e', width: '700px' }}>
        <ReportHeader title={<><TrendingUpIcon style={{width: 28, height: 28}} /> الملخص التنفيذي</>} color="#1A51F4"
          subtitle={`سعر الصرف: 1 دولار = ${exchangeRate} ريال`} />
        <div style={{ padding: '24px 30px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#1A51F4', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChartIcon className="icon-sm" /> المؤشرات الرئيسية
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
            <MetricCard label="عدد المنتجات"         value={products.length}                           color="#5E4FDE" />
            <MetricCard label="عدد الموردين"         value={suppliers.length}                          color="#11BA65" />
            <MetricCard label="إجمالي الخطط"         value={totalPlans}                                color="#1A51F4" />
            <MetricCard label="إجمالي التوفير ($)"   value={`$${fmt(totalSavings)}`}            color="#F7784A" />
            <MetricCard label="إجمالي التوفير (﷼)"  value={`${fmt(totalSavings * exchangeRate)} ﷼`} color="#FFC530" />
            <MetricCard label="متوسط نسبة التوفير"  value={`${avgSavingsPercent}%`}                   color="#F94B60" />
          </div>
          {bestPerProduct.length > 0 && (
            <>
              <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#11BA65', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StarIcon className="icon-sm" /> أفضل مورد لكل منتج
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '28px' }}>
                {bestPerProduct.map((bp, idx) => (
                  <div key={idx} style={{ background: 'linear-gradient(135deg,#E8FFF3,#F0FAF5)', border: '1px solid #11BA65', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>{bp.productName}</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#11BA65' }}>{bp.supplierName}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>الأفضل في {bp.planCount} {bp.planCount === 1 ? 'خطة' : 'خطط'}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <ReportFooter />
      </div>
    );
  };

  // ── Decide what to render in the hidden area ──────────────────
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

  // ── Helpers for selected product ─────────────────────────────
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

      {/* ── Section switcher ── */}
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

      {/* ── GLOBAL REPORTS ── */}
      {activeSection === 'global' && (
        <div className="report-cards">
          <div className="report-card">
            <div className="report-card-header blue-header">
              <span className="report-icon"><ClipboardIcon /></span><h3>التقرير الكامل</h3>
            </div>
            <p>جميع المنتجات وخططها مع أسعار كل مورد بالدولار والريال</p>
            <button className="btn-generate" onClick={() => generatePDF('full', 'تقرير_كامل_مفتاح.pdf', true)} disabled={!!generating}>
              {generating === 'full' ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تحميل PDF</>}
            </button>
          </div>
          <div className="report-card">
            <div className="report-card-header green-header">
              <span className="report-icon"><ScaleIcon /></span><h3>مقارنة الموردين</h3>
            </div>
            <p>أفضل سعر لكل خطة مع نسبة التوفير ومتوسط الأسعار</p>
            <button className="btn-generate green-btn" onClick={() => generatePDF('comparison', 'مقارنة_الموردين_مفتاح.pdf')} disabled={!!generating}>
              {generating === 'comparison' ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تحميل PDF</>}
            </button>
          </div>
          <div className="report-card">
            <div className="report-card-header purple-header">
              <span className="report-icon"><TrendingUpIcon /></span><h3>الملخص التنفيذي</h3>
            </div>
            <p>تقرير شامل مع توصيات وأفضل مورد لكل منتج وخطة</p>
            <button className="btn-generate purple-btn" onClick={() => generatePDF('summary', 'الملخص_التنفيذي_مفتاح.pdf')} disabled={!!generating}>
              {generating === 'summary' ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تحميل PDF</>}
            </button>
          </div>
        </div>
      )}

      {/* ── PRODUCT REPORT ── */}
      {activeSection === 'product' && (
        <div className="individual-report-panel">
          <div className="individual-report-header">
            <span className="individual-icon"><PackageIcon /></span>
            <div>
              <h3>تقرير منتج منفرد</h3>
              <p>اختر منتجاً لتصدير تقرير شامل بجميع خططه وأسعار الموردين</p>
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
            <button
              className="btn-generate"
              disabled={!selectedProductId || !!generating}
              onClick={() => generatePDF(`product-${selectedProductId}`, `تقرير_${selectedProduct ? formatProductName(selectedProduct).replace(/ /g, '_') : 'منتج'}_مفتاح.pdf`)}
            >
              {generating?.startsWith('product-') ? <><span className="spinner" /> جاري الإنشاء...</> : <><DownloadIcon className="icon-sm" /> تصدير PDF</>}
            </button>
          </div>

          {/* Mini preview card */}
          {selectedProduct && (
            <div className="product-preview-card">
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

      {/* ── SUPPLIER REPORT ── */}
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

          {/* Supplier cards grid */}
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

      {/* ── Analytics table ── */}
      <div className="analytics-preview">
        <h3 className="flex-row align-center gap-2"><BarChartIcon className="icon-sm" /> ملخص التحليلات</h3>
        <div className="table-wrapper">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>المنتج</th><th>الخطة</th><th>أفضل مورد</th>
                <th>أقل سعر ($)</th><th>أقل سعر (﷼)</th>
                <th>المتوسط</th><th>التوفير</th><th>نسبة التوفير</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((a, i) => (
                <tr key={i}>
                  <td className="td-product-name">{a.productName}</td>
                  <td><span className="plan-badge">{a.planDuration}</span></td>
                  <td className="td-best-supplier">{a.cheapest.supplierName !== '-' ? a.cheapest.supplierName : <span className="price-not-available">لا يوجد</span>}</td>
                  <td className="td-price">{a.cheapest.price > 0 ? `$${fmt(a.cheapest.price)}` : <span className="price-not-available" style={{opacity: 0.5}}>-</span>}</td>
                  <td className="td-price">{a.cheapest.price > 0 ? `${fmt(a.cheapest.price * exchangeRate)} ﷼` : <span className="price-not-available" style={{opacity: 0.5}}>-</span>}</td>
                  <td className="td-price">{a.avgPrice > 0 ? `$${fmt(a.avgPrice)}` : <span className="price-not-available" style={{opacity: 0.5}}>-</span>}</td>
                  <td className="td-savings">${fmt(a.savings)}</td>
                  <td className="td-savings-pct">{a.savingsPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Hidden render area ── */}
      {generating && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={reportRef}>{renderHiddenContent()}</div>
        </div>
      )}
    </div>
  );
}

export default ReportsExport;
