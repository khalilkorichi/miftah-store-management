import React, { useState } from 'react';
import { CheckSquareIcon, BookOpenIcon } from '../Icons';
import TaskManager from './TaskManager';
import ActivationGuidesManager from './ActivationGuidesManager';

const SUB_TABS = [
  { id: 'tasks', label: 'المهام', Icon: CheckSquareIcon },
  { id: 'guides', label: 'أدلة التفعيل', Icon: BookOpenIcon },
];

export default function OperationsHub({ tasks, setTasks, activationGuides, setActivationGuides, products }) {
  const [activeSubTab, setActiveSubTab] = useState('tasks');

  return (
    <div className="ops-hub">
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
          />
        )}
      </div>
    </div>
  );
}
