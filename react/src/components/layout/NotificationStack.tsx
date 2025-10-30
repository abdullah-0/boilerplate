import type { AppNotification } from "@/hooks/useNotifications";

type NotificationStackProps = {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
};

const formatRelativeTime = (timestamp: string) => {
  const parsed = new Date(timestamp).getTime();
  if (Number.isNaN(parsed)) {
    return "";
  }

  const diff = Date.now() - parsed;
  const seconds = Math.round(diff / 1000);
  if (seconds < 60) {
    return "Just now";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const formatTitle = (notification: AppNotification) => {
  const parts = notification.event.replace(/_/g, " ").split(" ");
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatMessage = (notification: AppNotification) => {
  if (typeof notification.payload.message === "string") {
    return notification.payload.message;
  }

  switch (notification.event) {
    case "profile_updated":
      return "Your profile was updated.";
    case "email_verified":
      return "Email verified successfully.";
    case "team_invitation": {
      const team = typeof notification.payload.team_name === "string" ? notification.payload.team_name : "a team";
      const role =
        typeof notification.payload.role === "string"
          ? notification.payload.role
          : "member";
      return `You have a new ${role} invitation for ${team}.`;
    }
    case "team_membership_updated": {
      const status =
        typeof notification.payload.status === "string"
          ? notification.payload.status
          : "updated";
      const team = typeof notification.payload.team_name === "string" ? notification.payload.team_name : "team";
      return `Your membership in ${team} was ${status}.`;
    }
    default:
      return "You have a new update.";
  }
};

const NotificationStack = ({
  notifications,
  onDismiss,
  onClearAll,
}: NotificationStackProps) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-stack">
      <div className="notification-stack-body">
        {notifications.map((notification) => (
          <article key={notification.id} className="notification-card">
            <div className="notification-card-header">
              <div>
                <h3>{formatTitle(notification)}</h3>
                <span>{formatRelativeTime(notification.receivedAt)}</span>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => onDismiss(notification.id)}
                aria-label="Dismiss notification"
              >
                x
              </button>
            </div>
            <p>{formatMessage(notification)}</p>
          </article>
        ))}
      </div>
      <button type="button" className="link-button" onClick={onClearAll}>
        Clear all notifications
      </button>
    </div>
  );
};

export default NotificationStack;
