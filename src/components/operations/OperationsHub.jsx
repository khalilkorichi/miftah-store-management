import React, { useState } from 'react';
import { CheckSquareIcon, BookOpenIcon, ActivityIcon, CalendarIcon } from '../Icons';
import TaskManager from './TaskManager';
import ActivationGuidesManager from './ActivationGuidesManager';
import RenewalReminders from './RenewalReminders';

const SUB_TABS = [
  { id: 'tasks', label: 'المهام', Icon: CheckSquareIcon },
  { id: 'guides', label: 'أدلة التفعيل', Icon: BookOpenIcon },
  { id: 'renewals', label: 'تذكيرات التجديد', Icon: CalendarIcon },
];

export default function OperationsHub({
  tasks, setTasks,
  activationGuides, setActivationGuides,
  renewalReminders, setRenewalReminders,
  products, durations, suppliers, exchangeRate,
}) {
  const [activeSubTab, setActiveSubTab] = useState('tasks');

  return (
    <div className="ops-hub">
      {/* Section header */}
      <div className="ops-hub-header">
        <div className="ops-hub-header-icon">
          <ActivityIcon className="icon-md" />
        </div>
        <div>
          <h1 className="ops-hub-title">قسم العمليات</h1>
          <p className="ops-hub-subtitle">إدارة المهام اليومية وأدلة تفعيل المنتجات وتذكيرات التجديد</p>
        </div>
      </div>

      {/* Sub-tab bar */}
      <div className="ops-subtab-bar">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            className={`ops-subtab-btn ${activeSubTab === tab.id ? 'ops-subtab-active' : ''}`}
            onClick={() => setActiveSubTab(tab.id)}
          >
            <tab.Icon className="icon-sm" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="ops-hub-content">
        {activeSubTab === 'tasks' && (
          <TaskManager tasks={tasks} setTasks={setTasks} />
        )}
        {activeSubTab === 'guides' && (
          <ActivationGuidesManager
            guides={activationGuides}
            setGuides={setActivationGuides}
            products={products}
            durations={durations}
          />
        )}
        {activeSubTab === 'renewals' && (
          <RenewalReminders
            renewals={renewalReminders}
            setRenewals={setRenewalReminders}
            products={products}
            suppliers={suppliers}
            exchangeRate={exchangeRate}
          />
        )}
      </div>
    </div>
  );
}
