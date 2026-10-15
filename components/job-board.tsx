"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  progressSteps,
  statusIndex,
  statusLabels,
  type Job,
  type JobStatus,
} from "@/lib/job-types";

function localDate() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

const emptyForm = {
  customerName: "",
  suburb: "",
  source: "",
  jobNumber: "",
  invoiceNumber: "",
  notes: "",
};

export function JobBoard() {
  const [date, setDate] = useState(localDate);
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/jobs?date=${encodeURIComponent(date)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Could not load jobs.");
        return payload.jobs as Job[];
      })
      .then((loadedJobs) => {
        if (active) setJobs(loadedJobs);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load jobs.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [date]);

  const visibleJobs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return jobs;
    return jobs.filter((job) =>
      [job.customerName, job.suburb, job.source, job.jobNumber, job.invoiceNumber]
        .some((value) => value?.toLowerCase().includes(needle)),
    );
  }, [jobs, query]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workDate: date, ...form }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not create job.");
      setJobs((current) => [payload.job, ...current]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create job.");
    } finally {
      setSaving(false);
    }
  }

  async function update(id: string, status: JobStatus, courierRequired?: boolean) {
    setError("");
    try {
      const response = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, courierRequired }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not update job.");
      setJobs((current) => current.map((job) => job.id === id ? payload.job : job));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update job.");
    }
  }

  const completed = jobs.filter((job) => job.status === "completed").length;
  const courierPending = jobs.filter((job) => job.status === "courier_needed").length;

  return (
    <section className="workspace">
      <div className="toolbar">
        <div>
          <p className="section-kicker">Daily operations</p>
          <h2>Job board</h2>
        </div>
        <button className="primary" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close" : "+ New job"}
        </button>
      </div>

      <div className="metrics">
        <Metric label="Jobs today" value={jobs.length} tone="neutral" />
        <Metric label="Courier action" value={courierPending} tone="warning" />
        <Metric label="Completed" value={completed} tone="success" />
      </div>

      {showForm && (
        <form className="job-form" onSubmit={create}>
          <div className="form-heading">
            <div><span>New work item</span><h3>Create a job</h3></div>
            <p>All details are optional. Add what you know now.</p>
          </div>
          <div className="form-grid">
            <Input label="Customer / purchaser" value={form.customerName} placeholder="e.g. Capital Smart" onChange={(customerName) => setForm({ ...form, customerName })} />
            <Input label="Suburb" value={form.suburb} placeholder="Delivery suburb" onChange={(suburb) => setForm({ ...form, suburb })} />
            <Input label="Source" value={form.source} placeholder="Order source or channel" onChange={(source) => setForm({ ...form, source })} />
            <Input label="Job / reference number" value={form.jobNumber} placeholder="Reference or job ID" onChange={(jobNumber) => setForm({ ...form, jobNumber })} />
            <Input label="Invoice number" value={form.invoiceNumber} placeholder="e.g. INV-6672" onChange={(invoiceNumber) => setForm({ ...form, invoiceNumber })} />
            <label className="input-field">
              <span>Notes <em>Optional</em></span>
              <input value={form.notes} placeholder="Anything the team should know" onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary" disabled={saving}>{saving ? "Creating…" : "Create job"}</button>
            <button type="button" className="quiet" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="filters">
        <label><span>Work date</span><input type="date" value={date} onChange={(event) => {
          setLoading(true);
          setError("");
          setDate(event.target.value);
        }} /></label>
        <label className="search"><span>Search jobs</span><input value={query} placeholder="Customer, suburb, invoice or reference…" onChange={(event) => setQuery(event.target.value)} /></label>
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {loading ? (
        <div className="empty-state">Loading the day’s jobs…</div>
      ) : visibleJobs.length === 0 ? (
        <div className="empty-state">
          <strong>No jobs found</strong>
          <span>Create the first job for this date, or adjust your search.</span>
        </div>
      ) : (
        <div className="job-list">
          {visibleJobs.map((job) => <JobCard key={job.id} job={job} update={update} />)}
        </div>
      )}
    </section>
  );
}

function JobCard({ job, update }: { job: Job; update: (id: string, status: JobStatus, courierRequired?: boolean) => void }) {
  const current = statusIndex(job.status, job.courierRequired);
  const details = [
    ["Customer", job.customerName],
    ["Suburb", job.suburb],
    ["Source", job.source],
    ["Job ref", job.jobNumber],
    ["Invoice", job.invoiceNumber],
  ].filter(([, value]) => value);

  return (
    <article className={`job-card status-${job.status}`}>
      <div className="job-main">
        <div className="job-title-row">
          <div>
            <span className="job-ref">{job.jobNumber || job.invoiceNumber || "Unnumbered job"}</span>
            <h3>{job.customerName || "Customer not entered"}</h3>
            <p>{job.suburb || "Suburb not entered"}{job.source ? ` · ${job.source}` : ""}</p>
          </div>
          <span className={`status-pill ${job.status}`}>{statusLabels[job.status]}</span>
        </div>
        {details.length > 0 && (
          <dl className="job-details">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        )}
        {job.notes && <p className="job-notes">{job.notes}</p>}
        <JobAction job={job} update={update} />
      </div>
      <div className="progress-panel">
        <span className="progress-title">Progress</span>
        <div className="progress-track">
          {progressSteps.map((step, index) => {
            const skipped = job.courierRequired === false && (step.status === "courier_needed" || step.status === "courier_booked");
            return (
              <div className={`progress-step ${index <= current ? "reached" : ""} ${skipped ? "skipped" : ""}`} key={step.status}>
                <span className="progress-dot">{index < current ? "✓" : index + 1}</span>
                <span>{skipped ? "Not needed" : step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function JobAction({ job, update }: { job: Job; update: (id: string, status: JobStatus, courierRequired?: boolean) => void }) {
  if (job.status === "opened") return <button className="action amber" onClick={() => update(job.id, "picking")}>Start picking</button>;
  if (job.status === "picking") return <button className="action blue" onClick={() => update(job.id, "picked")}>Mark stock ready</button>;
  if (job.status === "picked" && job.courierRequired === null) {
    return <div className="decision"><strong>Does this job need a courier?</strong><button className="action red" onClick={() => update(job.id, "courier_needed", true)}>Yes, courier required</button><button className="action quiet" onClick={() => update(job.id, "picked", false)}>No courier</button></div>;
  }
  if (job.status === "picked" && job.courierRequired === false) return <button className="action green" onClick={() => update(job.id, "completed")}>Complete job</button>;
  if (job.status === "courier_needed") return <button className="action red" onClick={() => update(job.id, "courier_booked", true)}>Mark courier booked</button>;
  if (job.status === "courier_booked") return <button className="action green" onClick={() => update(job.id, "completed", true)}>Complete job</button>;
  return <span className="complete-note">✓ Workflow complete</span>;
}

function Input({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return <label className="input-field"><span>{label} <em>Optional</em></span><input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={`metric ${tone}`}><strong>{value}</strong><span>{label}</span></div>;
}
