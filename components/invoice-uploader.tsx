"use client";

import { FormEvent, useState } from "react";
import type { InvoiceRecord } from "@/lib/types";
import type { Job } from "@/lib/job-types";

export function InvoiceUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<InvoiceRecord | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/invoices", { method: "POST", body });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      setResult(payload.invoice);
      window.dispatchEvent(new CustomEvent<Job>("mic:job-created", { detail: payload.job }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <form className="upload" onSubmit={submit}>
        <label className="dropzone">
          <span>
            <strong>{file ? file.name : "Choose a Xero PDF"}</strong>
            <p className="hint">Text-based PDF only · maximum 10 MB</p>
          </span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <button type="submit" disabled={!file || loading}>
          {loading ? "Importing…" : "Import invoice"}
        </button>
        {error && <div className="error" role="alert">{error}</div>}
      </form>

      {result && (
        <div className="result">
          <div>
            <h2>Invoice imported</h2>
            <dl className="fields invoice-summary">
              <Field label="Invoice number" value={result.invoiceNumber} />
              <Field label="Customer" value={result.contactName} />
              <Field label="Reference" value={result.reference} />
              <Field label="Total" value={result.total} />
              <Field label="Currency" value={result.currency} />
            </dl>
            <div className="invoice-address">
              <span>Delivery address</span>
              <strong>{result.addressLines.join(", ") || "Address not found"}</strong>
              <small>{[result.suburb, result.state, result.postcode].filter(Boolean).join(" ") || "Suburb and postcode not found"}</small>
            </div>
          </div>
          <div className="invoice-items">
            <div className="table-heading"><h3>Parts on invoice</h3><span>{result.lineItems.length} items</span></div>
            <div className="invoice-item invoice-item-header" aria-hidden="true">
              <span>Name</span><span>中文名字</span><span>MIC Code</span><span>Part Number</span><span>Price</span>
            </div>
            {result.lineItems.length ? result.lineItems.map((item, index) => (
              <div className="invoice-item" key={`${item.partNumber}-${index}`}>
                <strong>{item.description}</strong>
                <span className={item.chineseName ? "" : "name-pending"}>{item.chineseName || "待确认"}</span>
                <code className={item.micCode ? "" : "mic-pending"}>{item.micCode || "Manual check"}</code>
                <code>{item.partNumber || "Part number not found"}</code>
                <span className="item-price">{result.currency || ""} {item.price || "—"}</span>
              </div>
            )) : <div className="error">No parts were detected. This job was created for manual review.</div>}
          </div>
          <p className="import-success">Job created and added to today’s workflow.</p>
        </div>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return <div className="field"><dt>{label}</dt><dd>{value || "Not found"}</dd></div>;
}
