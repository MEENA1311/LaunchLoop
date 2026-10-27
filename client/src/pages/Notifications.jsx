import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, patch, post } from '../api';
import { Card, Btn, Pill, Toolbar, Empty, relative } from '../components/UI';
import { useToast } from '../components/Toast';

export default function Notifications() {
  const nav = useNavigate();
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const loadNotifications = () => {
    get('/notifications').then(setNotifications).catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(n) {
    if (!n.is_read) {
      try {
        await patch(`/notifications/${n.id}/read`, {});
        setNotifications(notifications.map(x => x.id === n.id ? { ...x, is_read: 1 } : x));
      } catch {}
    }

    // Smart contextual navigation based on notification type
    if (n.type === 'deal') nav('/deals');
    else if (n.type === 'mentorship') nav('/requests');
    else if (n.type === 'application') nav('/applications');
    else if (n.type === 'project' || n.type === 'collaboration') nav('/projects');
    else if (n.type === 'challenge') nav('/challenges');
  }

  async function markAllAsRead() {
    try {
      await post('/notifications/read-all', {});
      setNotifications(notifications.map(x => ({ ...x, is_read: 1 })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <div className="page">
      <Toolbar
        eyebrow="ACTIVITY NOTIFICATIONS"
        title="Ecosystem Notifications & Alerts"
        action={
          unreadCount > 0 && (
            <Btn variant="soft" onClick={markAllAsRead}>
              Mark All as Read ({unreadCount})
            </Btn>
          )
        }
      />

      <div className="filterbar">
        <div className="field">
          <span>Filter Status</span>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Notifications ({notifications.length})</option>
            <option value="unread">Unread Only ({unreadCount})</option>
          </select>
        </div>
      </div>

      <Card className="notification-card">
        <div className="activity-list" style={{ padding: 0 }}>
          {filtered.map(n => (
            <div
              key={n.id}
              className={`notification-row clickable ${!n.is_read ? 'unread' : ''}`}
              onClick={() => markAsRead(n)}
            >
              <div className="notification-icon">
                {n.type === 'deal' && '◫'}
                {n.type === 'mentorship' && '♙'}
                {n.type === 'application' && '✓'}
                {n.type === 'collaboration' && '✦'}
                {(!n.type || n.type === 'system') && '◉'}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>{n.title}</b>
                  <small>{relative(n.created_at)}</small>
                </div>
                <p>{n.message}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Pill tone={!n.is_read ? 'warning' : 'soft'}>
                    {!n.is_read ? 'New Alert' : 'Read'}
                  </Pill>
                  <small style={{ color: '#2d7ff9' }}>Click to open relevant workspace →</small>
                </div>
              </div>
            </div>
          ))}

          {!filtered.length && (
            <Empty
              title="No notifications in this view"
              text="You are all caught up! New collaboration and deal updates will show here."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
