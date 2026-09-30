import { ArrowUpRight, Bell, Check, RotateCw } from "lucide-react";
import { useState } from "react";
import { STATUS_LABEL } from "@/components/ServicesShared";
import { useMarkServiceNotificationRead, useServiceEvents, useServiceNotifications } from "@/hooks/use-services";

function eventDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function ServiceNotifications({ onView }: { onView: (requestId: number) => void }) {
  const { data, isLoading, isError, error, refetch } = useServiceNotifications();
  const markRead = useMarkServiceNotificationRead();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [failedId, setFailedId] = useState<number | null>(null);

  const mark = async (id: number) => {
    setPendingId(id);
    setFailedId(null);
    try { await markRead.mutateAsync(id); } catch { setFailedId(id); }
    finally { setPendingId(null); }
  };

  if (!isLoading && !isError && !data?.length) return null;

  return <section className="svc-notifications" aria-label="Unread service updates" data-testid="section-service-notifications">
    <div className="svc-notifications-title"><div><Bell size={17} /><span>Updates for you</span></div><span>{isLoading ? "CHECKING" : `${data?.length ?? 0} UNREAD`}</span></div>
    {isLoading ? <div className="svc-notification-skeleton" role="status" aria-label="Loading service updates" /> :
      isError ? <div className="svc-notification-error" role="alert">Could not load updates: {error instanceof Error ? error.message : "Please try again."} <button type="button" onClick={() => refetch()} data-testid="button-retry-service-notifications"><RotateCw size={13} /> Retry</button></div> :
      <div className="svc-notifications-list">{data?.map(item => <div className="svc-notification" key={item.id} data-testid={`notification-service-${item.id}`}>
        <div className="svc-notification-copy"><strong>Request #{item.requestId} is {STATUS_LABEL[item.toStatus]?.toLowerCase() ?? item.toStatus.toLowerCase()}</strong><span>{item.fromStatus ? STATUS_LABEL[item.fromStatus] : "Submitted"} → {STATUS_LABEL[item.toStatus] ?? item.toStatus} · {eventDate(item.createdAt)}</span></div>
        <div className="svc-notification-actions">
          <button type="button" onClick={() => onView(item.requestId)} data-testid={`button-view-notification-${item.id}`}>View request <ArrowUpRight size={13} /></button>
          <button type="button" onClick={() => mark(item.id)} disabled={pendingId === item.id} data-testid={`button-read-notification-${item.id}`}><Check size={13} /> {pendingId === item.id ? "Saving..." : "Mark read"}</button>
        </div>
        {failedId === item.id && <div className="svc-notification-failure" role="alert" data-testid={`status-read-error-${item.id}`}>{markRead.error?.message ?? "Could not mark this update as read."} Please try again.</div>}
      </div>)}</div>}
  </section>;
}

export function ServiceEventHistory({ requestId }: { requestId: number }) {
  const { data: events, isLoading, isError, error, refetch } = useServiceEvents(requestId);
  return <div className="svc-events" data-testid={`timeline-service-events-${requestId}`}>
    <div className="svc-events-title">Status history</div>
    {isLoading ? <div className="svc-notification-skeleton" role="status" aria-label="Loading status history" /> :
      isError ? <div className="svc-events-note" role="alert">Could not load status history: {error instanceof Error ? error.message : "Please try again."} <button type="button" onClick={() => refetch()} data-testid={`button-retry-events-${requestId}`}>Retry</button></div> :
      !events?.length ? <p className="svc-events-note">No status changes yet. Updates will appear here as the team progresses your request.</p> :
      <ol className="svc-events-list">{[...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(event => <li key={event.id} data-testid={`event-service-${event.id}`}>
        <span className="svc-events-dot" /><div><strong>{STATUS_LABEL[event.toStatus] ?? event.toStatus}</strong><p>{event.fromStatus ? `Changed from ${STATUS_LABEL[event.fromStatus]}` : "Request submitted"}</p></div><time dateTime={event.createdAt}>{eventDate(event.createdAt)}</time>
      </li>)}</ol>}
  </div>;
}