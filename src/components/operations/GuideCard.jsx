import React, { useState } from 'react';
import {
  ChevronDownIcon, ChevronUpIcon, EditIcon, TrashIcon,
  CopyIcon, CheckIcon, TagIcon, BookOpenIcon
} from '../Icons';

function useCopy(text) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return [copied, copy];
}

function buildCopyText(guide) {
  const lines = [`📋 ${guide.title}`, ''];
  guide.steps.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.text}`);
  });
  return lines.join('\n');
}

export default function GuideCard({ guide, productName, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const copyText = buildCopyText(guide);
  const [copied, copy] = useCopy(copyText);

  const customTagsList = guide.customTags
    ? guide.customTags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="guide-card">
      <div className="guide-card-header" onClick={() => setExpanded(v => !v)}>
        <div className="guide-card-left">
          <span className="guide-card-icon"><BookOpenIcon className="icon-sm" /></span>
          <div className="guide-card-info">
            <span className="guide-card-title">{guide.title}</span>
            <div className="guide-card-tags">
              {productName && (
                <span className="guide-tag guide-tag-product">
                  <TagIcon className="icon-xs" /> {productName}
                </span>
              )}
              {customTagsList.map(tag => (
                <span key={tag} className="guide-tag guide-tag-custom">{tag}</span>
              ))}
              <span className="guide-steps-count">{guide.steps.length} خطوة</span>
            </div>
          </div>
        </div>
        <div className="guide-card-actions" onClick={e => e.stopPropagation()}>
          <button
            className={`ops-btn ops-btn-copy ${copied ? 'ops-btn-copied' : ''}`}
            onClick={copy}
            title="نسخ الدليل"
          >
            {copied ? <><CheckIcon className="icon-sm" /> تم النسخ</> : <><CopyIcon className="icon-sm" /> نسخ</>}
          </button>
          <button className="task-action-btn" onClick={() => onEdit(guide)} title="تعديل">
            <EditIcon className="icon-sm" />
          </button>
          <button className="task-action-btn task-delete-btn" onClick={() => onDelete(guide.id)} title="حذف">
            <TrashIcon className="icon-sm" />
          </button>
          <button className="task-expand-btn" onClick={() => setExpanded(v => !v)} aria-label="توسيع">
            {expanded ? <ChevronUpIcon className="icon-sm" /> : <ChevronDownIcon className="icon-sm" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="guide-card-body">
          <ol className="guide-steps-ol">
            {guide.steps.map((step, i) => (
              <li key={step.id} className="guide-step-item">
                <span className="guide-step-num-display">{i + 1}</span>
                <span className="guide-step-text">{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
