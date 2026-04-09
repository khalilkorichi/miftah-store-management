import React, { useState, useMemo } from 'react';
import {
  PlusIcon, SearchIcon, CheckSquareIcon,
  ClockIcon, CheckCircleIcon, InboxIcon
} from '../Icons';
import TaskCard, { CATEGORIES, PRIORITIES, getDaysInfo } from './TaskCard';
import TaskModal from './TaskModal';

const STATUS_COLS = [
  { id: 'pending',    label: 'معلّقة',        color: '#9ca3b8', Icon: InboxIcon },
  { id: 'inprogress', label: 'قيد التنفيذ',   color: '#FFC530', Icon: ClockIcon },
  { id: 'done',       label: 'مكتملة',         color: '#11BA65', Icon: CheckCircleIcon },
];

const QUICK_FILTERS = [
  { id: 'all',     label: 'الكل' },
  { id: 'today',   label: 'اليوم' },
  { id: 'week',    label: 'هذا الأسبوع' },
  { id: 'urgent',  label: 'عاجلة' },
  { id: 'overdue', label: 'متأخرة' },
];

function taskMatchesQuickFilter(task, filterId) {
  if (filterId === 'all') return true;
  if (filterId === 'urgent') return task.priority === 'urgent' && task.status !== 'done';
  if (filterId === 'overdue') {
    const info = getDaysInfo(task.dueDate, task.status);
    return info?.isOverdue === true;
  }
  if (filterId === 'today') {
    const info = getDaysInfo(task.dueDate, task.status);
    return info?.isToday === true;
  }
  if (filterId === 'week') {
    if (!task.dueDate || task.status === 'done') return false;
    const info = getDaysInfo(task.dueDate, task.status);
    if (!info) return false;
    return info.diffDays >= 0 && info.diffDays <= 7;
  }
  return true;
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const priorityWeight = (t) => PRIORITIES[t.priority]?.weight ?? 0;
    const pw = priorityWeight(b) - priorityWeight(a);
    if (pw !== 0) return pw;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
}

export default function TaskManager({ tasks, setTasks }) {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (search) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) &&
            !t.description?.toLowerCase().includes(q)) return false;
      }
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (!taskMatchesQuickFilter(t, quickFilter)) return false;
      return true;
    });
  }, [tasks, search, quickFilter, filterCategory]);

  const tasksByStatus = useMemo(() => {
    const map = {};
    STATUS_COLS.forEach(c => {
      map[c.id] = sortTasks(filtered.filter(t => t.status === c.id));
    });
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

  const openEdit = (task) => { setEditingTask(task); setShowModal(true); };
  const openNew = () => { setEditingTask(null); setShowModal(true); };

  const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;

  return (
    <div className="task-manager">
      {/* Quick filters */}
      <div className="task-quick-filters">
        {QUICK_FILTERS.map(f => (
          <button
            key={f.id}
            className={`task-qf-btn ${quickFilter === f.id ? 'task-qf-active' : ''}`}
            onClick={() => setQuickFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

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
