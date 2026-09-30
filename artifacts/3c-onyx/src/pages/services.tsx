import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, LockKeyhole, ShieldCheck, ArrowDown, RotateCw } from "lucide-react";
import { RequestCard, RequestEmpty, RequestSkeleton, ServiceShell, SERVICES, SERVICE_TYPES } from "@/components/ServicesShared";
import { ServiceEventHistory, ServiceNotifications } from "@/components/ServiceUpdates";
import { useCreateServiceRequest, useServiceRequests, type ServiceInput, type ServiceType } from "@/hooks/use-services";
import "./services.css";

type FormValues = Omit<ServiceInput, "type">;
const defaultValues: FormValues = { vehicleYear: new Date().getFullYear(), vehicleMake: "", vehicleModel: "", location: "", description: "" };

export default function ServicesPage() {
  const [type, setType] = useState<ServiceType>("INSURANCE");
  const [confirmation, setConfirmation] = useState<number | null>(null);
  const [focused, setFocused] = useState({ id: -1, version: 0 });
  const historyRef = useRef<HTMLElement>(null);
  const { data: requests, isLoading, isError, error, refetch, isFetching } = useServiceRequests();
  const create = useCreateServiceRequest();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ defaultValues });
  const viewRequest = (id: number) => {
    setFocused(previous => ({ id, version: previous.version + 1 }));
    historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = handleSubmit(async (values) => {
    setConfirmation(null);
    create.reset();
    try {
      const { request } = await create.mutateAsync({
        type,
        vehicleYear: Number(values.vehicleYear),
        vehicleMake: values.vehicleMake.trim(),
        vehicleModel: values.vehicleModel.trim(),
        location: values.location.trim(),
        description: values.description.trim(),
      });
      setConfirmation(request.id);
      reset(defaultValues);
    } catch {
      // The mutation error is shown inline; preserve form values for retry.
    }
  });

  return <ServiceShell>
    <div className="svc-hero">
      <div><div className="svc-kicker">The member service desk / 01</div>
        <h1 className="svc-title">Consider it<br /><em>handled.</em></h1>
        <p className="svc-intro">The right help starts with a clear request. Tell us what you need for your vehicle, and follow its progress from here.</p>
      </div>
      <div className="svc-hero-aside"><strong>One request. One clear next step.</strong>Choose your service, share the essentials, and we'll keep the status visible as it moves forward.</div>
    </div>

    <ServiceNotifications onView={viewRequest} />

    <div className="svc-main-grid">
      <section aria-label="Choose a service">
        <div className="svc-section-head"><h2>What can we help with?</h2><span>SELECT A SERVICE</span></div>
        <div className="svc-option-grid">
          {SERVICE_TYPES.map((service, index) => {
            const Icon = SERVICES[service].icon;
            return <button type="button" key={service} className={`svc-option ${type === service ? "active" : ""}`} aria-pressed={type === service} data-testid={`button-service-${service.toLowerCase()}`} onClick={() => { setType(service); setConfirmation(null); create.reset(); }}>
              <span className="svc-option-top"><span className="svc-option-num">0{index + 1} / 04</span><Icon size={24} strokeWidth={1.4} className="svc-option-icon" /></span>
              <h3>{SERVICES[service].title}</h3><p>{SERVICES[service].short}</p>
            </button>;
          })}
        </div>
      </section>

      <section className="svc-form-panel" aria-label="Service request form">
        <div className="svc-form-step"><span>Request details</span><span>02 / 02</span></div>
        <h2>{SERVICES[type].title}</h2>
        <p className="svc-form-lead">{SERVICES[type].detail}</p>
        {confirmation !== null && <div className="svc-message svc-success" role="status" data-testid="status-request-created">
          Request #{confirmation} was submitted successfully. You can track its progress in your requests below.
          <button type="button" style={{ display: "flex", alignItems: "center", gap: 5, textDecoration: "underline", marginTop: 9, color: "inherit", background: "none", border: 0, cursor: "pointer", padding: 0 }} onClick={() => historyRef.current?.scrollIntoView({ behavior: "smooth" })} data-testid="button-view-submitted-request">View your request <ArrowDown size={13} /></button>
        </div>}
        {create.isError && <div className="svc-message" role="alert" data-testid="status-request-error">{create.error.message} Your details are still here; please try again.</div>}
        <form onSubmit={submit} noValidate>
          <div className="svc-field-grid">
            <div className="svc-field"><label htmlFor="svc-year">Year</label><input id="svc-year" type="number" min="1900" max={new Date().getFullYear() + 2} disabled={create.isPending} data-testid="input-vehicle-year" {...register("vehicleYear", { required: "Enter the model year.", valueAsNumber: true, min: { value: 1900, message: "Enter a valid year." }, max: { value: new Date().getFullYear() + 2, message: "Check the year." } })} />{errors.vehicleYear && <small role="alert">{errors.vehicleYear.message}</small>}</div>
            <div className="svc-field"><label htmlFor="svc-make">Make</label><input id="svc-make" placeholder="e.g. Porsche" maxLength={80} disabled={create.isPending} data-testid="input-vehicle-make" {...register("vehicleMake", { validate: value => value.trim().length >= 2 && value.trim().length <= 80 || "Make must be 2–80 characters." })} />{errors.vehicleMake && <small role="alert">{errors.vehicleMake.message}</small>}</div>
            <div className="svc-field"><label htmlFor="svc-model">Model</label><input id="svc-model" placeholder="e.g. 911 Carrera" maxLength={80} disabled={create.isPending} data-testid="input-vehicle-model" {...register("vehicleModel", { validate: value => value.trim().length >= 2 && value.trim().length <= 80 || "Model must be 2–80 characters." })} />{errors.vehicleModel && <small role="alert">{errors.vehicleModel.message}</small>}</div>
          </div>
          <div className="svc-field"><label htmlFor="svc-location">Your location</label><input id="svc-location" placeholder="City, state or current address" maxLength={200} disabled={create.isPending} data-testid="input-service-location" {...register("location", { validate: value => value.trim().length >= 3 && value.trim().length <= 200 || "Location must be 3–200 characters." })} />{errors.location && <small role="alert">{errors.location.message}</small>}</div>
          <div className="svc-field"><label htmlFor="svc-description">Tell us what you need</label><textarea id="svc-description" maxLength={2000} placeholder={type === "ROADSIDE" ? "Where are you, and what happened? Include any safety concerns." : type === "RENTAL" ? "When do you need the vehicle? Any size or pickup preferences?" : type === "BODY_WORK" ? "What work needs attention? Describe any damage or desired repairs." : "What kind of coverage are you looking for? Any relevant details?"} disabled={create.isPending} data-testid="input-service-description" {...register("description", { validate: value => value.trim().length >= 10 && value.trim().length <= 2000 || "Please provide 10–2,000 characters." })} />{errors.description && <small role="alert">{errors.description.message}</small>}</div>
          <button className="svc-button full" type="submit" disabled={create.isPending} data-testid="button-submit-service-request">{create.isPending ? "Submitting your request..." : "Submit request"} {!create.isPending && <ArrowRight size={16} />}</button>
        </form>
        <p className="svc-form-foot"><LockKeyhole size={13} style={{ flex: "none", marginTop: 1 }} /> Your request is sent securely to the 3C ONYX service team. This form is not monitored for emergencies.</p>
      </section>
    </div>

    <section className="svc-history" ref={historyRef} aria-label="Your service requests">
      <div className="svc-section-head svc-history-head"><div><div className="svc-kicker">A clear record</div><h2>Your requests</h2></div><span>{requests ? `${requests.length} TOTAL` : "SERVICE HISTORY"}</span></div>
      {isLoading ? <RequestSkeleton /> : isError ? <div className="svc-empty" role="alert"><ShieldCheck size={28} /><h3>Could not load your requests</h3><p>{error instanceof Error ? error.message : "Please try again."}</p><button className="svc-button secondary" style={{ marginTop: 18 }} onClick={() => refetch()} data-testid="button-retry-service-requests"><RotateCw size={14} /> Try again</button></div>
        : !requests?.length ? <RequestEmpty /> : <div className="svc-list">{[...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(request => <RequestCard key={request.id} request={request} initiallyOpen={request.id === confirmation} focusVersion={focused.id === request.id ? focused.version : 0}><ServiceEventHistory requestId={request.id} /></RequestCard>)}</div>}
      {isFetching && !isLoading && <p style={{ color: "#837d70", fontSize: 10, marginTop: 12 }} role="status">Refreshing request history...</p>}
    </section>
  </ServiceShell>;
}