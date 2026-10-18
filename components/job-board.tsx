"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  progressSteps,
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

  useEffect(() => {
    const addCreatedJob = (event: Event) => {
      const job = (event as CustomEvent<Job>).detail;
      if (job.workDate === date) setJobs((current) => [job, ...current]);
    };
    window.addEventListener("mic:job-created", addCreatedJob);
    return () => window.removeEventListener("mic:job-created", addCreatedJob);
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

  async function update(id: string, status: JobStatus, courierRequired?: boolean, courierBookedDate?: string) {
    setError("");
    const previousJobs = jobs;
    setJobs((current) => current.map((job) => job.id === id ? {
        ...job,
        status,
        courierRequired: courierRequired ?? job.courierRequired,
        courierBookedDate: courierBookedDate ?? job.courierBookedDate,
        completedAt: status === "completed" ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      } : job));
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, courierRequired, courierBookedDate }),
        signal: controller.signal,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not update job.");
      setJobs((current) => current.map((job) => job.id === id ? payload.job : job));
    } catch (caught) {
      setJobs(previousJobs);
      setError(caught instanceof Error && caught.name === "AbortError"
        ? "Saving took too long. The progress change was cancelled; please try again."
        : caught instanceof Error ? caught.message : "Could not update job.");
    } finally {
      window.clearTimeout(timeout);
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

function JobCard({ job, update }: { job: Job; update: (id: string, status: JobStatus, courierRequired?: boolean, courierBookedDate?: string) => Promise<void> }) {
  const current = progressSteps.findIndex((step) => step.status === job.status);
  const [selectedStatus, setSelectedStatus] = useState<JobStatus>(job.status);
  const [bookingDate, setBookingDate] = useState(job.courierBookedDate || localDate());
  const [saving, setSaving] = useState(false);
  const selectedIndex = progressSteps.findIndex((step) => step.status === selectedStatus);

  useEffect(() => {
    setSelectedStatus(job.status);
    setBookingDate(job.courierBookedDate || localDate());
  }, [job.status, job.courierBookedDate]);

  function selectStep(status: JobStatus, index: number) {
    if (status === selectedStatus && index > 0) {
      setSelectedStatus(progressSteps[index - 1].status);
      return;
    }
    setSelectedStatus(status);
  }

  async function confirmStatus() {
    setSaving(true);
    try {
      const courierRequired = selectedIndex >= 3 ? true : undefined;
      await update(
        job.id,
        selectedStatus,
        courierRequired,
        selectedStatus === "courier_booked" || selectedStatus === "completed" ? bookingDate : undefined,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={`job-card status-${job.status}`}>
      <div className="job-main">
        <div className="job-title-row">
          <div>
            <span className="job-ref">Invoice · {job.invoiceNumber || "No invoice number"}{job.jobNumber ? ` · Ref ${job.jobNumber}` : ""}</span>
            <h3>{job.customerName || "Customer not entered"}</h3>
            <p>{job.deliveryAddress ? `${job.deliveryAddress} · ` : ""}{job.suburb || "Suburb not entered"}</p>
          </div>
          <span className={`status-pill ${job.status}`}>{statusLabels[job.status]}</span>
        </div>
        <div className="job-parts">
          {job.lineItems.length > 0 && <div className="job-part job-part-header"><span>Name</span><span>中文名字</span><span>MIC Code</span><span>Part Number</span><span>Price</span></div>}
          {job.lineItems.length ? job.lineItems.map((item, index) => (
            <div className="job-part" key={`${item.partNumber}-${index}`}>
              <span>{item.description}</span><span className={item.chineseName ? "" : "name-pending"}>{item.chineseName || "待确认"}</span><code className={item.micCode ? "" : "mic-pending"}>{item.micCode || "Manual check"}</code><code>{item.partNumber || "No part number"}</code><strong>{job.currency || ""} {item.price || "—"}</strong>
            </div>
          )) : <span className="no-parts">Parts need manual review</span>}
        </div>
        <div className="job-card-footer">
          <span className="job-total">Total <strong>{job.currency || ""} {job.total || "—"}</strong></span>
          {job.courierBookedDate && <span className="booked-date">Courier booked for <strong>{job.courierBookedDate}</strong></span>}
        </div>
      </div>
      <div className="progress-panel">
        <div className="progress-heading">
          <div><span className="progress-title">Progress</span><small>Select a stage, then click Complete to save</small></div>
          {(selectedStatus === "courier_booked" || selectedStatus === "completed") && <input aria-label="Courier booking date" type="date" value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} />}
          {selectedStatus !== job.status && <button className="cancel-progress" onClick={() => setSelectedStatus(job.status)}>Cancel</button>}
          <button className="confirm-progress" disabled={selectedStatus === job.status || saving} onClick={confirmStatus}>{saving ? "Saving…" : "Complete"}</button>
        </div>
        <div className="progress-track">
          {progressSteps.map((step, index) => {
            const skipped = job.courierRequired === false && (step.status === "courier_needed" || step.status === "courier_booked");
            return (
              <button type="button" onClick={() => selectStep(step.status, index)} className={`progress-step ${index < selectedIndex ? "reached" : ""} ${index === selectedIndex ? "current" : ""} ${index !== current ? "draft" : ""} ${skipped ? "skipped" : ""}`} key={step.status}>
                <span className="progress-dot">{index < selectedIndex ? "✓" : index + 1}</span>
                <span>{skipped ? "Not needed" : step.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function Input({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return <label className="input-field"><span>{label} <em>Optional</em></span><input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={`metric ${tone}`}><strong>{value}</strong><span>{label}</span></div>;
}
