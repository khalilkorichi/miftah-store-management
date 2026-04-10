import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SparklesIcon, XIcon, ZapIcon, SendIcon, TrashIcon,
  CheckCircleIcon, AlertTriangleIcon, SettingsIcon,
} from './Icons';
import { callAI } from '../utils/aiProvider';
import MarkdownRenderer from './MarkdownRenderer';

/* ─── Constants ─────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'miftah_global_assistant_chat';

const SKILLS = [
  {
    id: 'price-analyst',
    label: 'محلل الأسعار',
    icon: '📊',
    color: '#5E4FDE',
    prompt: 'أنت الآن في وضع "محلل الأسعار". ركّز في إجاباتك على تحليل أسعار الموردين مقارنةً بالأسعار الرسمية، وحساب هوامش الربح، وتحديد الفرص التسعيرية لكل منتج في المتجر.',
  },
  {
    id: 'pricing-consultant',
    label: 'مستشار التسعير',
    icon: '💰',
    color: '#11BA65',
    prompt: 'أنت الآن في وضع "مستشار التسعير الاستراتيجي". ساعد في وضع استراتيجيات تسعير مثلى تراعي المنافسة والقيمة المقدمة للعميل وهامش الربح المستهدف والموسمية.',
  },
  {
    id: 'content-writer',
    label: 'كاتب المحتوى',
    icon: '✍️',
    color: '#F7784A',
    prompt: 'أنت الآن في وضع "كاتب المحتوى التسويقي". قدّم نصوصاً تسويقية مختصرة ومقنعة مناسبة للنشر في متجر سلة، واكتب بأسلوب عربي فصيح وجذّاب يعكس قيمة المنتجات الرقمية.',
  },
  {
    id: 'coupon-advisor',
    label: 'مساعد الكوبونات',
    icon: '🏷️',
    color: '#FFC530',
    prompt: 'أنت الآن في وضع "مساعد الكوبونات والخصومات". ساعد في تصميم كوبونات وعروض خصم فعّالة تزيد المبيعات دون التأثير السلبي على الأرباح، مع مراعاة بيانات الكوبونات الموجودة.',
  },
  {
    id: 'product-manager',
    label: 'مدير المنتجات',
    icon: '📦',
    color: '#1A51F4',
    prompt: 'أنت الآن في وضع "مدير المنتجات الرقمية". ساعد في تنظيم وتحسين وتطوير محفظة المنتجات الرقمية في المتجر: خططها وميزاتها وترتيبها وربطها بالحزم.',
  },
];

const GLOBAL_SYSTEM_PROMPT = `أنت مساعد ذكاء اصطناعي داخلي لمتجر مفتاح، متخصص في إدارة المنتجات الرقمية على منصة سلة.

مهمتك:
- الإجابة على أسئلة مدير المتجر بشكل مباشر ودقيق
- تقديم استشارة في إدارة المنتجات الرقمية والتسعير والتسويق
- تحليل بيانات المتجر المقدمة وتقديم رؤى قابلة للتطبيق

قواعد:
- أجب باللغة العربية الفصحى السهلة
- كن موجزاً ومباشراً في إجاباتك
- استند إلى بيانات المتجر الفعلية المقدمة في Context
- لا تختلق أرقاماً أو بيانات غير موجودة`;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function loadMessages() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function saveMessages(msgs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch (e) { console.error('GlobalAI save error:', e); }
}

function makeId() {
  return `gm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

/* ─── Store context builder ──────────────────────────────────────────────── */
function buildStoreContext({ products = [], suppliers = [], durations = [], bundles = [], coupons = [], tasks = [], exchangeRate }) {
  const lines = ['=== ملخص بيانات متجر مفتاح ==='];

  lines.push(`\n📦 المنتجات (${products.length} منتج):`);
  products.forEach(p => {
    const planCount = (p.plans || []).length;
    lines.push(`  - ${p.name} (${planCount} خطة)`);
    (p.plans || []).forEach(plan => {
      const dur = durations.find(d => d.id === plan.durationId);
      const durLabel = dur ? dur.label : (plan.durationId || '');
      const prices = Object.values(plan.prices || {}).map(Number).filter(v => v > 0);
      const minP = prices.length ? Math.min(...prices) : null;
      const maxP = prices.length ? Math.max(...prices) : null;
      const priceStr = minP !== null
        ? (maxP !== minP ? `$${minP}–$${maxP}` : `$${minP}`)
        : 'بدون سعر';
      const officialStr = plan.officialPriceUsd ? ` | رسمي: $${plan.officialPriceUsd}` : '';
      lines.push(`    • ${durLabel}: تكلفة ${priceStr}${officialStr}`);
    });
  });

  if (suppliers.length > 0) {
    lines.push(`\n🏭 الموردون (${suppliers.length}):`);
    suppliers.forEach(s => {
      lines.push(`  - ${s.name}${s.country ? ` (${s.country})` : ''}`);
    });
  }

  if (bundles.length > 0) {
    lines.push(`\n🎁 الحزم (${bundles.length}):`);
    bundles.slice(0, 8).forEach(b => {
      lines.push(`  - ${b.name || 'حزمة'}: ${(b.items || b.products || []).length} منتج`);
    });
    if (bundles.length > 8) lines.push(`  ... و ${bundles.length - 8} حزمة أخرى`);
  }

  const activeCoupons = (coupons || []).filter(c => c.isActive !== false);
  if (activeCoupons.length > 0) {
    lines.push(`\n🏷️ الكوبونات النشطة (${activeCoupons.length}):`);
    activeCoupons.slice(0, 6).forEach(c => {
      const val = c.discountType === 'percent' || c.type === 'percent'
        ? `${c.value || c.discount}%`
        : `${c.value || c.discount} ر.س`;
      lines.push(`  - ${c.code}: خصم ${val}`);
    });
  }

  const openTasks = (tasks || []).filter(t => t.status !== 'done' && t.status !== 'completed' && t.status !== 'closed');
  if (openTasks.length > 0) {
    lines.push(`\n📋 المهام المفتوحة (${openTasks.length}):`);
    openTasks.slice(0, 5).forEach(t => {
      lines.push(`  - ${t.title || t.text || 'مهمة'}`);
    });
    if (openTasks.length > 5) lines.push(`  ... و ${openTasks.length - 5} مهام أخرى`);
  }

  if (exchangeRate) {
    lines.push(`\n💱 سعر صرف الدولار: 1 USD = ${exchangeRate} ر.س`);
  }

  return lines.join('\n');
}

/* ─── TypingDots ─────────────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="gaa-typing-indicator">
      <div className="gaa-typing-avatar">
        <SparklesIcon className="icon-xs" />
      </div>
      <div className="gaa-typing-dots">
        <span /><span /><span />
      </div>
    </div>
  );
}

/* ─── MessageBubble ──────────────────────────────────────────────────────── */
function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);
  const isAI = msg.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`gaa-message ${isAI ? 'gaa-message-ai' : 'gaa-message-user'}`}>
      {isAI && (
        <div className="gaa-msg-avatar">
          <SparklesIcon className="icon-xs" />
        </div>
      )}
      <div className="gaa-msg-body">
        <div className="gaa-msg-content">
          {isAI
            ? <MarkdownRenderer content={msg.content} />
            : <p className="gaa-msg-text">{msg.content}</p>
          }
        </div>
        <div className="gaa-msg-footer">
          <span className="gaa-msg-time">{formatTime(msg.timestamp)}</span>
          {isAI && (
            <button className="gaa-msg-copy" onClick={handleCopy} title="نسخ">
              {copied ? <CheckCircleIcon className="icon-xs" /> : '⎘'}
            </button>
          )}
        </div>
      </div>
      {!isAI && (
        <div className="gaa-msg-avatar gaa-msg-avatar-user">أنت</div>
      )}
    </div>
  );
}

/* ─── SkillBadge ─────────────────────────────────────────────────────────── */
function SkillBadge({ skill, onRemove }) {
  return (
    <div className="gaa-skill-badge" style={{ '--skill-color': skill.color }}>
      <span>{skill.icon}</span>
      <span>{skill.label}</span>
      <button onClick={onRemove} className="gaa-skill-badge-remove" title="إلغاء المهارة">
        <XIcon className="icon-xs" />
      </button>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function GlobalAIAssistant({
  products,
  suppliers,
  durations,
  bundles,
  coupons,
  tasks,
  appSettings,
  exchangeRate,
  onNavigateToSettings,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => loadMessages());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSkill, setActiveSkill] = useState(null);
  const [showSkillsMenu, setShowSkillsMenu] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [error, setError] = useState('');

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const skillsMenuRef = useRef(null);

  /* Auto-scroll to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* Focus input when panel opens */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
      setHasUnread(false);
    }
  }, [isOpen]);

  /* Close panel on outside click */
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowSkillsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  /* Close skills menu on outside click */
  useEffect(() => {
    if (!showSkillsMenu) return;
    const handleClick = (e) => {
      if (skillsMenuRef.current && !skillsMenuRef.current.contains(e.target)) {
        setShowSkillsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSkillsMenu]);

  const hasApiKey = Boolean(
    appSettings?.aiProvider === 'openrouter' ? appSettings?.openrouterApiKey :
    appSettings?.aiProvider === 'agentrouter' ? appSettings?.agentrouterApiKey :
    appSettings?.geminiApiKey
  );

  const buildSystemPrompt = useCallback(() => {
    const ctx = buildStoreContext({ products, suppliers, durations, bundles, coupons, tasks, exchangeRate });
    const skillExtra = activeSkill ? `\n\n${activeSkill.prompt}` : '';
    return `${GLOBAL_SYSTEM_PROMPT}${skillExtra}\n\n${ctx}`;
  }, [products, suppliers, durations, bundles, coupons, tasks, exchangeRate, activeSkill]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setError('');
    const userMsg = {
      id: makeId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    saveMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    const apiMessages = nextMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      const result = await callAI({
        systemPrompt: buildSystemPrompt(),
        messages: apiMessages,
        appSettings,
      });

      const aiMsg = {
        id: makeId(),
        role: 'assistant',
        content: result,
        timestamp: Date.now(),
      };

      const finalMessages = [...nextMessages, aiMsg];
      setMessages(finalMessages);
      saveMessages(finalMessages);

      if (!isOpen) setHasUnread(true);
    } catch (e) {
      if (e.message === 'NO_KEY') {
        setError('no_key');
      } else {
        setError(`حدث خطأ: ${e.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    saveMessages([]);
    setError('');
    setActiveSkill(null);
    setInput('');
  };

  const togglePanel = () => {
    setIsOpen(prev => !prev);
    setShowSkillsMenu(false);
  };

  const selectSkill = (skill) => {
    setActiveSkill(prev => prev?.id === skill.id ? null : skill);
    setShowSkillsMenu(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const isOnline = hasApiKey;

  return (
    <div className="gaa-root" ref={panelRef}>
      {/* ── Panel ── */}
      <div className={`gaa-panel ${isOpen ? 'gaa-panel-open' : ''}`} role="dialog" aria-label="المساعد الذكي">

        {/* Header */}
        <div className="gaa-panel-header">
          <div className="gaa-header-info">
            <div className="gaa-header-title">
              <SparklesIcon className="icon-sm" />
              <span>المساعد الذكي</span>
            </div>
            <div className={`gaa-status-dot ${isOnline ? 'gaa-status-online' : 'gaa-status-offline'}`}>
              <span className="gaa-status-pulse" />
              <span className="gaa-status-label">{isOnline ? 'متصل' : 'غير متصل'}</span>
            </div>
          </div>
          <div className="gaa-header-actions">
            {messages.length > 0 && (
              <button className="gaa-icon-btn" onClick={handleClear} title="مسح المحادثة">
                <TrashIcon className="icon-sm" />
              </button>
            )}
            <button className="gaa-icon-btn" onClick={togglePanel} title="إغلاق">
              <XIcon className="icon-sm" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="gaa-messages">
          {messages.length === 0 && !isLoading && (
            <div className="gaa-empty-state">
              <SparklesIcon className="icon-xl" />
              <p className="gaa-empty-title">مرحباً! أنا مساعدك الذكي</p>
              <p className="gaa-empty-sub">أعرف كل شيء عن منتجاتك وأسعارك وكوبوناتك. اسألني أي شيء!</p>
            </div>
          )}
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {isLoading && <TypingDots />}

          {/* Error states */}
          {error === 'no_key' && (
            <div className="gaa-error-banner">
              <AlertTriangleIcon className="icon-sm" />
              <span>لم يتم تعيين مفتاح API.</span>
              {onNavigateToSettings && (
                <button className="gaa-error-link" onClick={() => { onNavigateToSettings(); setIsOpen(false); }}>
                  <SettingsIcon className="icon-xs" /> الإعدادات
                </button>
              )}
            </div>
          )}
          {error && error !== 'no_key' && (
            <div className="gaa-error-banner gaa-error-generic">
              <AlertTriangleIcon className="icon-sm" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Active skill badge */}
        {activeSkill && (
          <div className="gaa-skill-badge-bar">
            <SkillBadge skill={activeSkill} onRemove={() => setActiveSkill(null)} />
          </div>
        )}

        {/* Input bar */}
        <div className="gaa-input-bar">
          <div className="gaa-input-wrap">
            <textarea
              ref={inputRef}
              className="gaa-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك هنا..."
              rows={1}
              disabled={isLoading}
            />
            <div className="gaa-input-actions">
              {/* Skills button */}
              <div className="gaa-skills-wrap" ref={skillsMenuRef}>
                <button
                  className={`gaa-skills-btn ${showSkillsMenu ? 'gaa-skills-btn-active' : ''} ${activeSkill ? 'gaa-skills-btn-has-skill' : ''}`}
                  onClick={() => setShowSkillsMenu(prev => !prev)}
                  title="المهارات"
                  style={activeSkill ? { color: activeSkill.color } : {}}
                >
                  <ZapIcon className="icon-sm" />
                </button>
                {showSkillsMenu && (
                  <div className="gaa-skills-dropdown">
                    <div className="gaa-skills-header">اختر مهارة</div>
                    {SKILLS.map(skill => (
                      <button
                        key={skill.id}
                        className={`gaa-skill-item ${activeSkill?.id === skill.id ? 'gaa-skill-item-active' : ''}`}
                        onClick={() => selectSkill(skill)}
                        style={activeSkill?.id === skill.id ? { '--skill-color': skill.color } : {}}
                      >
                        <span className="gaa-skill-icon">{skill.icon}</span>
                        <span className="gaa-skill-name">{skill.label}</span>
                        {activeSkill?.id === skill.id && (
                          <CheckCircleIcon className="icon-xs gaa-skill-check" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Send button */}
              <button
                className="gaa-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                title="إرسال"
              >
                <SendIcon className="icon-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAB ── */}
      <div className="gaa-fab-wrap">
        <button
          className={`gaa-fab ${isOpen ? 'gaa-fab-open' : ''}`}
          onClick={togglePanel}
          aria-label="المساعد الذكي"
        >
          {isOpen ? <XIcon className="icon-md" /> : <SparklesIcon className="icon-md" />}
          {hasUnread && !isOpen && <span className="gaa-fab-unread" />}
        </button>
        {!isOpen && (
          <div className="gaa-fab-tooltip">المساعد الذكي</div>
        )}
      </div>
    </div>
  );
}
