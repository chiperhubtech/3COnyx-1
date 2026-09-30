import { ChevronDown, ClipboardList, CarFront, ShieldCheck, Wrench, LifeBuoy, KeyRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { ServiceRequest, ServiceStatus, ServiceType } from "@/hooks/use-services";

export const SERVICES: Record<ServiceType, { title: string; short: string; detail: string; icon: typeof ShieldCheck }> = {
  INSURANCE: { title: "Insurance quote", short: "Find the right coverage.", detail: "Tell us about your vehicle and the coverage you need. Our team will take it from there.", icon: ShieldCheck },
  ROADSIDE: { title: "Roadside assistance", short: "Help when you need it.", detail: "Share where you are and what happened so our team can coordinate support.", icon: LifeBuoy },
  RENTAL: { title: "Rental car", short: "Keep moving, on your terms.", detail: "Tell us where and when you need a car, along with any preferences.", icon: KeyRound },
  BODY_WORK: { title: "Body work", short: "Bring it back to its best.", detail: "Describe the damage or work you have in mind, and we'll help with next steps.", icon: Wrench },
};

export const SERVICE_TYPES = Object.keys(SERVICES) as ServiceType[];

export const STATUS_LABEL: Record<ServiceStatus, string> = {
  NEW: "Received",
  IN_PROGRESS: "In progress",
  FULFILLED: "Fulfilled",
};

export function ServiceShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  return <div className="svc-page"><div className="svc-wrap">
    <header className="svc-topline">
      <div className="svc-brand"><span className="svc-brand-mark">3C</span><span>ONYX / {admin ? "SERVICE DESK" : "MEMBER SERVICES"}</span></div>
      <div className="svc-topnote">{admin ? "Operations console · Authorized access" : "A direct line to people who can help."}</div>
    </header>
    {children}
    <footer className="svc-footer"><span>3C ONYX · Member services</span><span>Clear requests. Considered care.</span></footer>
  </div></div>;
}

export function RequestSkeleton() {
  return <div aria-label="Loading requests" role="status"><div className="svc-skeleton" /><div className="svc-skeleton" /><div className="svc-skeleton" /></div>;
}

export function RequestEmpty({ admin = false, filtered = false }: { admin?: boolean; filtered?: boolean }) {
  return <div className="svc-empty"><ClipboardList size={30} strokeWidth={1.3} />
    <h3>{filtered ? "No matches found" : admin ? "The desk is clear" : "Nothing in the queue yet"}</h3>
    <p>{filtered ? "Try another status or search term." : admin ? "New member requests will appear here when they arrive." : "Choose a service above and send us the details. You can follow every request right here."}</p>
  </div>;
}

export function RequestCard({ request, children, initiallyOpen = false, focusVersion = 0 }: { request: ServiceRequest; children?: ReactNode; initiallyOpen?: boolean; focusVersion?: number }) {
  const [open, setOpen] = useState(initiallyOpen);
  useEffect(() => { if (focusVersion > 0) setOpen(true); }, [focusVersion]);
  const Icon = SERVICES[request.type]?.icon ?? CarFront;
  const created = new Date(request.createdAt);
  const updated = new Date(request.updatedAt);
  const dateLabel = (date: Date) => Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const steps: ServiceStatus[] = ["NEW", "IN_PROGRESS", "FULFILLED"];
  const currentIndex = steps.indexOf(request.status);
  return <article id={`service-request-${request.id}`} className="svc-request" data-testid={`card-service-request-${request.id}`}>
    <button type="button" className="svc-request-head" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${open ? "Hide" : "Show"} details for request ${request.id}`} data-testid={`button-toggle-request-${request.id}`}>
      <span className="svc-request-icon"><Icon size={20} strokeWidth={1.5} /></span>
      <span className="svc-request-main">
        <strong>{SERVICES[request.type]?.title ?? request.type} <span style={{ color: "#827866", fontWeight: 400 }}> / {request.vehicleYear} {request.vehicleMake} {request.vehicleModel}</span></strong>
        <small>{request.memberName ? `${request.memberName} · ` : ""}Request #{request.id} · Submitted {dateLabel(created)}</small>
      </span>
      <span className={`svc-status ${request.status === "IN_PROGRESS" ? "progress" : request.status === "FULFILLED" ? "done" : ""}`} data-testid={`status-service-request-${request.id}`}>{STATUS_LABEL[request.status] ?? request.status}</span>
      <ChevronDown className={`svc-chevron ${open ? "open" : ""}`} size={17} />
    </button>
    {open && <div className="svc-request-detail">
      <div className="svc-detail-block"><small>Vehicle</small><span>{request.vehicleYear} {request.vehicleMake} {request.vehicleModel}</span></div>
      <div className="svc-detail-block"><small>Location</small><span>{request.location}</span></div>
      <div className="svc-detail-block"><small>Last updated</small><span>{dateLabel(updated)}</span></div>
      {request.memberEmail && <div className="svc-detail-block"><small>Member email</small><span>{request.memberEmail}</span></div>}
      <div className="svc-detail-block wide"><small>Request details</small><span style={{ whiteSpace: "pre-wrap" }}>{request.description}</span></div>
      <div className="svc-timeline" aria-label="Request progress">{steps.map((step, index) => <div key={step} className={`svc-timeline-step ${index <= currentIndex ? "active" : ""}`}>{STATUS_LABEL[step]}</div>)}</div>
      {children}
    </div>}
  </article>;
}