import React, { useState, useMemo } from 'react';
import {
  PlusIcon, FilterIcon, SearchIcon, CheckSquareIcon,
  ClockIcon, CheckCircleIcon, InboxIcon
} from '../Icons';
import TaskCard, { CATEGORIES, PRIORITIES } from './TaskCard';
import TaskModal from './TaskModal';

const STATUS_COLS = [
  { id: 'pending',    label: 'معلّقة',        color: '#9ca3b8', Icon: InboxIcon },
  { id: 'inprogress', label: 'قيد التنفيذ',   color: '#FFC530', Icon: ClockIcon },
  { id: 'done',       label: 'مكتملة',         color: '#11BA65', Icon: CheckCircleIcon },
];

export default function TaskManager({ tasks, setTasks }) {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
          !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      return true;
    });
  }, [tasks, search, filterPriority, filterCategory]);

  const tasksByStatus = useMemo(() => {
    const map = {};
    STATUS_COLS.forEach(c => { map[c.id] = filtered.filter(t => t.status === c.id); });
    return map;
  }, [filtered]);

  const handleSave = (task) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === task.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = task;
        return next;
      }
      return [task, ...prev];
    });
  };

  const handleDelete = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleStatusChange = (id, newStatus) => {
    setTasks(prev => prev.map(t => t.id === id
      ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
      : t
    ));
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const openNew = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;

  return (
    <div className="task-manager">
      {/* Toolbar */}
      <div className="ops-toolbar">
        <div className="ops-search-wrap">
          <SearchIcon className="icon-sm ops-search-icon" />
          <input
            type="text"
            className="ops-search-input"
            placeholder="بحث في المهام..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="ops-filters">
          <select
            className="ops-filter-select"
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
          >
            <option value="all">كل الأولويات</option>
            {Object.entries(PRIORITIES).map(([id, p]) => (
              <option key={id} value={id}>{p.label}</option>
            ))}
          </select>
          <select
            className="ops-filter-select"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="all">كل التصنيفات</option>
            {Object.entries(CATEGORIES).map(([id, c]) => (
              <option key={id} value={id}>{c.label}</option>
            ))}
          </select>
        </div>
        <button className="ops-btn ops-btn-primary ops-add-btn" onClick={openNew}>
          <PlusIcon className="icon-sm" /> مهمة جديدة
        </button>
      </div>

      {urgentCount > 0 && (
        <div className="task-urgent-banner">
          <span className="task-urgent-dot" />
          لديك <strong>{urgentCount}</strong> {urgentCount === 1 ? 'مهمة عاجلة' : 'مهام عاجلة'} تحتاج انتباهك الآن
        </div>
      )}

      {/* Kanban Columns */}
      <div className="task-kanban">
        {STATUS_COLS.map(col => (
          <div key={col.id} className={`task-col task-col-${col.id}`}>
            <div className="task-col-header" style={{ '--col-color': col.color }}>
              <col.Icon className="icon-sm" />
              <span className="task-col-label">{col.label}</span>
              <span className="task-col-count">{tasksByStatus[col.id].length}</span>
            </div>
            <div className="task-col-body">
              {tasksByStatus[col.id].length === 0 ? (
                <div className="task-col-empty">
                  <CheckSquareIcon className="icon-lg" />
                  <span>لا توجد مهام</span>
                </div>
              ) : (
                tasksByStatus[col.id].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}
