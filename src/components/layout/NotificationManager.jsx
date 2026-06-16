import { useEffect } from 'react';
import useDataStore from '../../store/useDataStore';
import useUIStore from '../../store/useUIStore';

export default function NotificationManager() {
  const { leads, tasks } = useDataStore();
  const { addNotification } = useUIStore();

  useEffect(() => {
    // Check every 60 seconds
    const intervalId = setInterval(() => {
      const now = new Date();
      
      // 1. Check tasks
      tasks.forEach(task => {
        if (task.status !== 'completed' && task.due) {
          const dueDate = new Date(task.due);
          // If task is due in the next 1 hour, or just became overdue
          const timeDiff = dueDate - now;
          if (timeDiff > 0 && timeDiff <= 60 * 60 * 1000) {
            addNotification({
              id: `task-due-${task.id}`,
              type: 'system',
              icon: '⏰',
              action: 'Task Due Soon:',
              target: task.title,
              user: 'System',
              time: 'Just now',
              unread: true
            });
          } else if (timeDiff < 0 && timeDiff > -60 * 60 * 1000) {
            addNotification({
              id: `task-overdue-${task.id}`,
              type: 'system',
              icon: '⚠️',
              action: 'Task Overdue:',
              target: task.title,
              user: 'System',
              time: 'Just now',
              unread: true
            });
          }
        }
      });

      // 2. Check leads next actions
      leads.forEach(lead => {
        if (lead.next_action_due) {
          const dueDate = new Date(lead.next_action_due);
          const timeDiff = dueDate - now;
          if (timeDiff < 0 && timeDiff > -60 * 60 * 1000) {
            // Overdue in the last hour
            addNotification({
              id: `lead-overdue-${lead.id}`,
              type: 'system',
              icon: '📅',
              action: 'Lead Follow-up Overdue:',
              target: lead.company_name || 'Unknown',
              meta: lead.next_action,
              user: 'System',
              time: 'Just now',
              unread: true
            });
          }
        }
      });
      
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, [tasks, leads, addNotification]);

  return null; // This is a logic-only component
}
