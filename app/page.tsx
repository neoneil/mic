import { InvoiceUploader } from "@/components/invoice-uploader";
import { JobBoard } from "@/components/job-board";

export default function Home() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">MIC · Operations control</p>
        <h1>Jobs, clearly moving.</h1>
        <p className="intro">
          Track every order from opening and stock picking through courier booking
          and completion—without losing today’s priorities.
        </p>
      </section>
      <JobBoard />
      <details className="invoice-section">
        <summary><span>Invoice PDF intake</span><small>Import a text-based Xero invoice when available</small></summary>
        <InvoiceUploader />
      </details>
    </main>
  );
}
