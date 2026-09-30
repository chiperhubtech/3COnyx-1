import { useMemo, useState } from "react";
import { ArrowRight, RotateCw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RequestCard, RequestEmpty, RequestSkeleton, ServiceShell, STATUS_LABEL } from "@/components/ServicesShared";
import { useServiceRequests, useUpdateServiceStatus, type ServiceStatus } from "@/hooks/use-services";
import "./services.css";

type Filter = "ALL" | ServiceStatus;
const FILTERS: Filter[] = ["ALL", "NEW", "IN_PROGRESS", "FULFILLED"];

export default function ServicesAdminPage() {
  const { user } = useAuth();
  const { data: requests, isLoading, isError, error, refetch, isFetching } = useServiceRequests(true);
  const update = useUpdateServiceStatus();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);

  const visible = useMemo(() => [...(requests ?? [])].filter(request => {
    const matchesStatus = filter === "ALL" || request.status === filter;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [request.id, request.memberName, request.memberEmail, request.vehicleMake, request.vehicleModel, request.location, request.type]
      .some(value => String(value ?? "").toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [requests, filter, search]);

  const advance = async (id: number, status: ServiceStatus) => {
    setActiveId(id);
    update.reset();
    try { await update.mutateAsync({ id, status }); } catch { /* Inline error below the affected request. */ }
  };

  return <ServiceShell admin>
    <div className="svc-hero">
      <div><div className="svc-kicker">Member care / operations</div><h1 className="svc-title">Service<br /><em>desk.</em></h1>
        <p className="svc-intro">Every member request in one place. Review the details, take ownership, and move work forward as it progresses.</p></div>
      <div className="svc-hero-aside"><strong>Keep the record current.</strong>Members see these status changes in their request history.</div>
    </div>
    {user?.role !== "Admin" ? <div className="svc-empty" role="alert"><ShieldCheck size={28} /><h3>Admin access required</h3><p>This service desk is available to administrators only.</p></div> : <>
      <div className="svc-admin-stats" aria-label="Request totals">
        {(["ALL", "NEW", "IN_PROGRESS", "FULFILLED"] as Filter[]).map(status => <div className="svc-stat" key={status}>
          <strong data-testid={`text-count-${status.toLowerCase()}`}>{requests ? status === "ALL" ? requests.length : requests.filter(r => r.status === status).length : "—"}</strong>
          <span>{status === "ALL" ? "All requests" : STATUS_LABEL[status]}</span>
        </div>)}
      </div>
      <div className="svc-section-head"><h2>Request queue</h2><span>{requests ? `${visible.length} SHOWING` : "LIVE QUEUE"}</span></div>
      <div className="svc-admin-toolbar">
        <div className="svc-filters" role="group" aria-label="Filter requests by status">
          {FILTERS.map(status => <button key={status} className={`svc-filter ${filter === status ? "active" : ""}`} type="button" aria-pressed={filter === status} onClick={() => setFilter(status)} data-testid={`button-filter-${status.toLowerCase()}`}>{status === "ALL" ? "All" : STATUS_LABEL[status]}</button>)}
        </div>
        <input className="svc-search" type="search" value={search} onChange={event => setSearch(event.target.value)} aria-label="Search requests" placeholder="Search member, vehicle, ID..." data-testid="input-search-service-requests" />
      </div>
      {isLoading ? <RequestSkeleton /> : isError ? <div className="svc-empty" role="alert"><ShieldCheck size={28} /><h3>Queue unavailable</h3><p>{error instanceof Error ? error.message : "Please try again."}</p><button type="button" className="svc-button secondary" style={{ marginTop: 18 }} onClick={() => refetch()} data-testid="button-retry-admin-requests"><RotateCw size={14} /> Try again</button></div>
        : !visible.length ? <RequestEmpty admin filtered={!!requests?.length} /> : <div className="svc-list">
          {visible.map(request => {
            const next: ServiceStatus | null = request.status === "NEW" ? "IN_PROGRESS" : request.status === "IN_PROGRESS" ? "FULFILLED" : null;
            return <RequestCard request={request} key={request.id}>
              <div className="svc-admin-actions">
                {next ? <button type="button" className="svc-button" onClick={() => advance(request.id, next)} disabled={update.isPending} data-testid={`button-advance-request-${request.id}`}>
                  {update.isPending && activeId === request.id ? "Updating..." : `Mark ${STATUS_LABEL[next].toLowerCase()}`} {!(update.isPending && activeId === request.id) && <ArrowRight size={14} />}
                </button> : <p>Request fulfilled. No further action needed.</p>}
                {update.isError && activeId === request.id && <p role="alert" style={{ color: "#f0b5a1" }} data-testid={`status-update-error-${request.id}`}>{update.error.message} Please try again.</p>}
                {update.isSuccess && activeId === request.id && <p role="status" style={{ color: "#bed8aa" }} data-testid={`status-update-success-${request.id}`}>Status updated. The member can see this change.</p>}
              </div>
            </RequestCard>;
          })}
        </div>}
      {isFetching && !isLoading && <p style={{ color: "#837d70", fontSize: 10, marginTop: 12 }} role="status">Refreshing queue...</p>}
    </>}
  </ServiceShell>;
}