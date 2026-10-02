"use client";

import { useEffect, useState } from "react";

type ReturnRequest = { id: string; orderId: string; email: string; reason: string; details: string; status: string; createdAt: string };

export default function AdminReturnsPage() {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [error, setError] = useState("");

  const headers = (): HeadersInit => {
    const token = localStorage.getItem("sc_token");
    return token ? { authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch("/api/returns", { headers: headers() })
        .then(async (response) => ({ response, data: await response.json().catch(() => ({})) }))
        .then(({ response, data }) => {
          if (!response.ok) setError(data.error || "Unable to load requests");
          else setRequests(data.requests || []);
        })
        .catch(() => setError("Unable to load requests"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function updateStatus(id: string, status: string) {
    const response = await fetch("/api/returns", { method: "PATCH", headers: { "Content-Type": "application/json", ...headers() }, body: JSON.stringify({ id, status }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error || "Unable to update request"); return; }
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
  }

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Returns and Refunds</h1>
      <p className="mt-1 text-sm text-slate-500">Review customer requests and update their status.</p>
      {error && <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-6 space-y-3">
        {requests.length === 0 && <p className="text-sm text-slate-500">No return requests yet.</p>}
        {requests.map((request) => (
          <article key={request.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold">{request.id} · Order {request.orderId}</p>
                <p className="text-sm text-slate-600">{request.email} · {request.reason}</p>
                <p className="mt-2 text-sm text-slate-700">{request.details || "No additional details"}</p>
              </div>
              <select value={request.status} onChange={(event) => void updateStatus(request.id, event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="requested">Requested</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
