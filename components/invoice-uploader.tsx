"use client";

import { FormEvent, useState } from "react";
import type { InvoiceRecord } from "@/lib/types";

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
            <dl className="fields">
              <Field label="Invoice number" value={result.invoiceNumber} />
              <Field label="Contact" value={result.contactName} />
              <Field label="Invoice date" value={result.invoiceDate} />
              <Field label="Due date" value={result.dueDate} />
              <Field label="Total" value={result.total} />
              <Field label="Currency" value={result.currency} />
            </dl>
          </div>
          <div>
            <h3>Extracted text</h3>
            <pre>{result.rawText}</pre>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return <div className="field"><dt>{label}</dt><dd>{value || "Not found"}</dd></div>;
}
