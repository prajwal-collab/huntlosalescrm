// ============================================
// HUNTLO SALES OS — SDR NOTIFICATION ENGINE
// Smart reminders and SDR activity coordination
// ============================================
import { useEffect, useRef } from 'react';
import useDataStore from '../../store/useDataStore';
import useAuthStore from '../../store/useAuthStore';
import useUIStore from '../../store/useUIStore';

export default function NotificationManager() {
  const { leads, tasks, deals, meetings } = useDataStore();
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const firedRef = useRef(new Set()); // track notifications already fired this session

  // Helper: fire once per session per key
  const fireOnce = (key, notif) => {
    if (firedRef.current.has(key)) return;
    firedRef.current.add(key);
    addNotification(notif);
  };

  useEffect(() => {
    if (!user) return;

    const checkAll = () => {
      const now = new Date();

      // ─────────────────────────────────────────────
      // 1. TASK REMINDERS — Due within 1 hour or overdue
      // ─────────────────────────────────────────────
      tasks.forEach(task => {
        if (task.status === 'completed' || !task.due) return;
        const dueDate = new Date(task.due);
        const timeDiff = dueDate - now;

        if (timeDiff > 0 && timeDiff <= 60 * 60 * 1000) {
          fireOnce(`task-due-${task.id}`, {
            id: `task-due-${task.id}`,
            type: 'task',
            title: 'Task Due Soon ⏰',
            message: `"${task.title}" is due in less than 1 hour.`,
            route: '/tasks',
            unread: true,
            time: now.toISOString(),
          });
        } else if (timeDiff < 0 && timeDiff > -2 * 60 * 60 * 1000) {
          fireOnce(`task-overdue-${task.id}`, {
            id: `task-overdue-${task.id}`,
            type: 'warning',
            title: 'Task Overdue ⚠️',
            message: `"${task.title}" is overdue. Take action now.`,
            route: '/tasks',
            unread: true,
            time: now.toISOString(),
          });
        }
      });

      // ─────────────────────────────────────────────
      // 2. LEAD FOLLOW-UP OVERDUE
      // ─────────────────────────────────────────────
      leads.forEach(lead => {
        if (!lead.next_action_due) return;
        // Only alert the lead owner
        if (lead.owner_id && lead.owner_id !== user.id) return;

        const dueDate = new Date(lead.next_action_due);
        const timeDiff = dueDate - now;

        if (timeDiff < 0 && timeDiff > -3 * 60 * 60 * 1000) {
          fireOnce(`lead-overdue-${lead.id}`, {
            id: `lead-overdue-${lead.id}`,
            type: 'reminder',
            title: 'Lead Follow-up Overdue 📅',
            message: `Follow up with ${lead.company_name || lead.contact_name || 'a lead'} — action overdue.`,
            route: '/leads',
            unread: true,
            time: now.toISOString(),
          });
        }
      });

      // ─────────────────────────────────────────────
      // 3. LEAD ADDED BUT NO PIPELINE DEAL (24h rule)
      // SDR Intelligence: if a lead is >24h old and
      // no deal exists for that company, remind the owner
      // ─────────────────────────────────────────────
      const companyDeals = new Map();
      deals.forEach(d => {
        if (d.company_id) companyDeals.set(d.company_id, true);
      });

      leads.forEach(lead => {
        // Only fire for leads owned by the current user
        if (lead.owner_id && lead.owner_id !== user.id) return;
        if (lead.stage === 'Lost' || lead.stage === 'Customer') return;
        if (!lead.created_at) return;

        const ageHours = (now - new Date(lead.created_at)) / (1000 * 60 * 60);
        if (ageHours < 24) return; // Less than 24h old — not yet

        // Check if a deal exists for this company
        const hasDeal = lead.company_id
          ? companyDeals.has(lead.company_id)
          : deals.some(d => d.title?.toLowerCase().includes((lead.company_name || '').toLowerCase()));

        if (!hasDeal && lead.company_name) {
          fireOnce(`lead-no-deal-${lead.id}`, {
            id: `lead-no-deal-${lead.id}`,
            type: 'sdr',
            title: 'Lead Ready for Pipeline 🚀',
            message: `${lead.company_name} has been a lead for 24h+ but has no deal in the pipeline. Create one to track progress.`,
            route: '/pipeline',
            unread: true,
            time: now.toISOString(),
          });
        }
      });

      // ─────────────────────────────────────────────
      // 4. MEETING BOOKED BUT DEAL STAGE NOT UPDATED (48h rule)
      // ─────────────────────────────────────────────
      meetings.forEach(meeting => {
        if (!meeting.deal_id || !meeting.created_at) return;
        if (meeting.owner_id && meeting.owner_id !== user.id) return;

        const meetingAge = (now - new Date(meeting.created_at)) / (1000 * 60 * 60);
        if (meetingAge < 48) return;

        const linkedDeal = deals.find(d => d.id === meeting.deal_id);
        if (!linkedDeal) return;

        const dealLastUpdated = (now - new Date(linkedDeal.updated_at || linkedDeal.created_at)) / (1000 * 60 * 60);

        // If the deal hasn't been updated since the meeting was created
        if (dealLastUpdated > 48) {
          fireOnce(`meeting-stage-stale-${meeting.id}`, {
            id: `meeting-stage-stale-${meeting.id}`,
            type: 'warning',
            title: 'Update Your Pipeline ⚠️',
            message: `Meeting "${meeting.title}" happened 48h+ ago — did you update the deal stage for ${linkedDeal.title}?`,
            route: '/pipeline',
            unread: true,
            time: now.toISOString(),
          });
        }
      });

      // ─────────────────────────────────────────────
      // 5. STALE DEAL REMINDER — owner-specific (5+ days no activity)
      // ─────────────────────────────────────────────
      deals.forEach(deal => {
        if (deal.stage === 'Closed Won' || deal.stage === 'Closed Lost') return;
        if (deal.owner_id && deal.owner_id !== user.id) return;
        if (!deal.updated_at && !deal.created_at) return;

        const staleDays = (now - new Date(deal.last_activity || deal.updated_at || deal.created_at)) / 86400000;
        if (staleDays >= 5) {
          fireOnce(`deal-stale-${deal.id}`, {
            id: `deal-stale-${deal.id}`,
            type: 'warning',
            title: 'Deal Going Cold ❄️',
            message: `"${deal.title || 'A deal'}" has had no activity for ${Math.floor(staleDays)} days. Follow up now.`,
            route: '/pipeline',
            unread: true,
            time: now.toISOString(),
          });
        }
      });

      // ─────────────────────────────────────────────
      // 6. MEETING STARTING SOON (within 30 minutes)
      // ─────────────────────────────────────────────
      meetings.forEach(meeting => {
        if (!meeting.date || meeting.status === 'completed') return;
        if (meeting.owner_id && meeting.owner_id !== user.id) return;

        const meetingTime = new Date(meeting.date);
        const diff = meetingTime - now;

        if (diff > 0 && diff <= 30 * 60 * 1000) {
          fireOnce(`meeting-soon-${meeting.id}`, {
            id: `meeting-soon-${meeting.id}`,
            type: 'meeting',
            title: 'Meeting Starting Soon 📅',
            message: `"${meeting.title}" starts in ${Math.round(diff / 60000)} minutes.`,
            route: '/meetings',
            unread: true,
            time: now.toISOString(),
          });
        }
      });
    };

    // Run immediately on mount + data change
    checkAll();

    // Then check every 2 minutes
    const intervalId = setInterval(checkAll, 2 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [tasks, leads, deals, meetings, user, addNotification]);

  return null; // Logic-only component
}
