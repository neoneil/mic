import { InvoiceUploader } from "@/components/invoice-uploader";
import { JobBoard } from "@/components/job-board";
import { AuthControls } from "@/components/auth-controls";
import { getMicUser } from "@/lib/auth";

export default async function Home() {
  const user = await getMicUser();
  return (
    <main className="app-shell">
      <header className="app-header">
        <span>MIC Auto · Internal</span>
        <AuthControls email={user?.email} />
      </header>
      <section className="hero">
        <p className="eyebrow">MIC · Operations control</p>
        <h1>Invoice to dispatch.</h1>
        <p className="intro">
          Import a Xero invoice, confirm the customer and parts, then move every job
          through labels, picking, courier booking and collection.
        </p>
      </section>
      {user ? <>
        <section className="invoice-intake">
          <div className="intake-heading"><p className="section-kicker">Start a job</p><h2>Invoice PDF intake</h2></div>
          <InvoiceUploader />
        </section>
        <JobBoard />
      </> : <section className="login-required"><strong>Staff access required</strong><span>Use the Log in button above to open the MIC workspace.</span></section>}
    </main>
  );
}
