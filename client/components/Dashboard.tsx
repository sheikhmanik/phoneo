'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface SessionData {
  sessionId: string;
  status: string;
  phoneNumber: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  sentFrom: string;
  description: string;
  message: string;
  userId: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DashboardPage() {
  
  const router = useRouter();

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // =====================================================
  // LOAD SESSION
  // =====================================================

  useEffect(() => {
    const loadSession = async () => {
      const sessionId = localStorage.getItem(
        'whatsappSessionId'
      );

      if (!sessionId) {
        router.replace('/');
        return;
      }

      try {
        const { data } =
          await axios.get<SessionData>(
            `${API_URL}/api/whatsapp/session/${sessionId}`
          );

        if (data.status !== 'connected') {
          localStorage.removeItem(
            'whatsappSessionId'
          );

          router.replace('/');
          return;
        }

        setSession(data);
      } catch (error) {
        console.error(error);

        localStorage.removeItem(
          'whatsappSessionId'
        );

        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    // Fetch invoices
    const loadInvoices = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/invoices/get-invoices`
        );
        setInvoices(response.data.invoices);
      } catch (error) {
        console.error('Failed to load invoices:', error);
      }
    };

    loadSession();
    loadInvoices();
  }, [router]);


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    if (!session) {
      return;
    }

    setLoggingOut(true);
    setError(null);

    try {
      await axios.post(
        `${API_URL}/api/whatsapp/session/${session.sessionId}/logout`
      );
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status !== 404
      ) {
        setError(
          error.response?.data?.message ||
            'Failed to logout from WhatsApp.'
        );

        setLoggingOut(false);
        return;
      }
    }

    localStorage.removeItem(
      'whatsappSessionId'
    );

    router.replace('/');
  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7faf8]">

        {/* Background */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl" />

          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-green-100/40 blur-3xl" />

        </div>


        {/* Loader */}

        <div className="relative flex flex-col items-center">

          <div className="relative h-14 w-14">

            <div className="absolute inset-0 rounded-full border-4 border-neutral-200" />

            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#25D366]" />

          </div>

          <p className="mt-5 text-sm font-medium text-neutral-500">
            Loading your dashboard...
          </p>

        </div>

      </main>
    );
  }


  if (!session) {
    return null;
  }


  const isConnected =
    session.status === 'connected';


  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7faf8]">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -left-48 -top-48 h-125 w-125 rounded-full bg-emerald-100/40 blur-3xl" />

        <div className="absolute -bottom-48 -right-48 h-125 w-125 rounded-full bg-green-100/40 blur-3xl" />

        <div className="absolute left-1/2 top-[40%] h-150 w-150 -translate-x-1/2 rounded-full border border-emerald-100/50" />

      </div>


      {/* =================================================
          NAVBAR
      ================================================= */}

      <header className="relative z-10 border-b border-neutral-200/70 bg-white/70 backdrop-blur-xl">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">

          {/* Brand */}

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] shadow-[0_6px_18px_rgba(37,211,102,0.22)]">

              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-white"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.075-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.89-9.884 2.64 0 5.122 1.03 6.987 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.89c0 2.096.547 4.142 1.588 5.946L.057 24l6.304-1.654a11.875 11.875 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.478-8.413" />
              </svg>

            </div>

            <div>

              <p className="text-sm font-semibold tracking-tight text-neutral-900">
                WhatsApp
              </p>

              <p className="text-xs text-neutral-400">
                Business Dashboard
              </p>

            </div>

          </div>


          {/* Logout */}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="group flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loggingOut ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-red-500" />
                Logging out
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 17l5-5-5-5"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12H3"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 3v18"
                  />
                </svg>

                Logout
              </>
            )}

          </button>

        </div>

      </header>


      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">


        {/* Header */}

        <div className="mb-10">

          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-emerald-600">

            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            Account Overview

          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Your WhatsApp is connected.
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500 sm:text-base">
            Your account is ready. You can now create and manage invoices from your dashboard.
          </p>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">

            <svg
              className="mt-0.5 h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 17h.01"
              />
            </svg>

            <p>{error}</p>

          </div>
        )}


        {/* =================================================
            MAIN ACCOUNT CARD
        ================================================= */}

        <div className="overflow-hidden rounded-[28px] border border-neutral-200/80 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.07)]">

          <div className="relative p-6 sm:p-8 lg:p-10">

            {/* Decorative glow */}

            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-100/60 blur-3xl" />


            <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">

              {/* Status */}

              <div className="flex items-center gap-5">

                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e9fbf0]">

                  <div className="absolute inset-0 animate-pulse rounded-2xl bg-[#25D366]/10" />

                  <svg
                    viewBox="0 0 24 24"
                    className="relative h-8 w-8 fill-[#25D366]"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.89-9.884 2.64 0 5.122 1.03 6.987 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884" />
                  </svg>

                </div>


                <div>

                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                    Connection Status
                  </p>

                  <div className="mt-1 flex items-center gap-2">

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isConnected
                          ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]'
                          : 'bg-red-500'
                      }`}
                    />

                    <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                      {isConnected
                        ? 'Connected'
                        : 'Disconnected'}
                    </h2>

                  </div>

                </div>

              </div>


              {/* Active badge */}

              {isConnected && (
                <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">

                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />

                  Active

                </div>
              )}

            </div>


            {/* Divider */}

            <div className="my-8 h-px bg-neutral-100" />


            {/* Account details */}

            <div className="grid gap-5 sm:grid-cols-2">

              {/* Phone */}

              <div className="rounded-2xl border border-neutral-100 bg-[#fafafa] p-5">

                <div className="flex items-center gap-2">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">

                    <svg
                      className="h-4 w-4 text-neutral-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.6 3h2.8l1.4 4-2 1.5a13 13 0 006.7 6.7l1.5-2 4 1.4v2.8a2 2 0 01-2.2 2A16.8 16.8 0 013.6 5.2 2 2 0 016.6 3z"
                      />
                    </svg>

                  </div>

                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                    Phone Number
                  </p>

                </div>

                <p className="mt-4 text-xl font-semibold tracking-tight text-neutral-900">
                  {session.phoneNumber || 'Not available'}
                </p>

              </div>


              {/* Status */}

              <div className="rounded-2xl border border-neutral-100 bg-[#fafafa] p-5">

                <div className="flex items-center gap-2">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">

                    <svg
                      className="h-4 w-4 text-neutral-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3v9l6 3"
                      />

                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                      />

                    </svg>

                  </div>

                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-400">
                    WhatsApp Status
                  </p>

                </div>

                <p className="mt-4 text-xl font-semibold capitalize tracking-tight text-neutral-900">
                  {session.status}
                </p>

              </div>

            </div>

          </div>


          {/* =================================================
              INVOICE CTA
          ================================================= */}

          <div className="border-t border-neutral-100 bg-[#fafcfb] p-6 sm:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900">

                    <svg
                      className="h-4.5 w-4.5 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 3h10a2 2 0 012 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 012-2z"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 8h6M9 12h6"
                      />

                    </svg>

                  </div>

                  <h3 className="font-semibold text-neutral-900">
                    Create an invoice
                  </h3>

                </div>

                <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
                  Generate a professional invoice and send it through your connected WhatsApp account.

                </p>

              </div>


              <button
                type="button"
                onClick={() => router.push('/invoice')}
                className="group flex shrink-0 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-[0_12px_25px_rgba(0,0,0,0.16)] active:translate-y-0"
              >

                Create Invoice

                <svg
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 10H3a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>

              </button>

            </div>

          </div>

        </div>


        {/* =================================================
            INVOICE HISTORY
        ================================================= */}

        <div className="mt-10">

        {/* Section header */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-neutral-400">

              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />

              Invoice History

            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
              Your invoices
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              View the invoices you've created and sent through WhatsApp.
            </p>

          </div>


          {/* Invoice count */}

          <div className="flex w-fit items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-600 shadow-sm">

            <svg
              className="h-4 w-4 text-neutral-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 3h10a2 2 0 012 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 012-2z"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 8h6M9 12h4"
              />

            </svg>

            {invoices.length}{' '}
            {invoices.length === 1 ? 'invoice' : 'invoices'}

          </div>

        </div>


        {/* =================================================
            INVOICE SUMMARY
        ================================================= */}

        {invoices.length > 0 && (
          <div className="mb-5 grid gap-4 sm:grid-cols-2">

            {/* Total invoices */}

            <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.035)]">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">

                  <svg
                    className="h-5 w-5 text-neutral-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 3h10a2 2 0 012 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 012-2z"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 8h6M9 12h6"
                    />

                  </svg>

                </div>

                <div>

                  <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                    Total Invoices
                  </p>

                  <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                    {invoices.length}
                  </p>

                </div>

              </div>

            </div>


            {/* Total amount */}

            <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.035)]">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">

                  <span className="text-lg font-semibold text-emerald-600">
                    ₹
                  </span>

                </div>

                <div>

                  <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                    Total Amount
                  </p>

                  <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                    ₹
                    {invoices
                      .reduce(
                        (total, invoice) =>
                          total + invoice.amount,
                        0
                      )
                      .toLocaleString('en-IN')}
                  </p>

                </div>

              </div>

            </div>

          </div>
        )}


        {/* =================================================
            INVOICE LIST
        ================================================= */}

        <div className="overflow-hidden rounded-[28px] border border-neutral-200/80 bg-white shadow-[0_15px_50px_rgba(0,0,0,0.055)]">

          {invoices.length === 0 ? (

            /* EMPTY STATE */

            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">

                <svg
                  className="h-6 w-6 text-neutral-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 3h10a2 2 0 012 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 012-2z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9h6M9 13h4"
                  />

                </svg>

              </div>

              <h3 className="mt-5 text-base font-semibold text-neutral-900">
                No invoices yet
              </h3>

              <p className="mt-1 max-w-sm text-sm leading-6 text-neutral-500">
                Create your first invoice and send it directly to a customer through WhatsApp.
              </p>

              <button
                type="button"
                onClick={() => router.push('/invoice')}
                className="mt-5 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Create your first invoice
              </button>

            </div>

          ) : (

            <>

              {/* Desktop header */}

              <div className="hidden border-b border-neutral-100 bg-[#fafcfb] px-6 py-4 lg:grid lg:grid-cols-[1.5fr_1.3fr_1.5fr_1fr_auto] lg:items-center lg:gap-5">

                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Invoice
                </p>

                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Customer
                </p>

                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Description
                </p>

                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Amount
                </p>

                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Status
                </p>

              </div>


              {/* Invoice rows */}

              <div className="divide-y divide-neutral-100">

                {invoices.map((invoice) => (

                  <div
                    key={invoice.id}
                    className="px-5 py-5 transition-colors hover:bg-[#fafcfb] sm:px-6 lg:grid lg:grid-cols-[1.5fr_1.3fr_1.5fr_1fr_auto] lg:items-center lg:gap-5"
                  >

                    {/* Invoice */}

                    <div>

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">

                          <svg
                            className="h-4.5 w-4.5 text-neutral-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7 3h10a2 2 0 012 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 012-2z"
                            />

                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 8h6M9 12h6"
                            />

                          </svg>

                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-neutral-900">
                            {invoice.invoiceNumber}
                          </p>

                          <p className="mt-0.5 text-xs text-neutral-400">
                            {new Date(
                              invoice.invoiceDate
                            ).toLocaleDateString(
                              'en-IN',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }
                            )}
                          </p>

                        </div>

                      </div>

                    </div>


                    {/* Customer */}

                    <div className="mt-4 lg:mt-0">

                      <p className="text-sm font-medium text-neutral-900">
                        {invoice.customerName}
                      </p>

                      <p className="mt-0.5 text-xs text-neutral-400">
                        {invoice.customerPhone}
                      </p>

                    </div>


                    {/* Description */}

                    <div className="mt-4 lg:mt-0">

                      <p className="line-clamp-2 text-sm text-neutral-600">
                        {invoice.description}
                      </p>

                    </div>


                    {/* Amount */}

                    <div className="mt-4 lg:mt-0">

                      <p className="text-base font-semibold text-neutral-900">
                        ₹
                        {invoice.amount.toLocaleString(
                          'en-IN'
                        )}
                      </p>

                    </div>


                    {/* Status */}

                    <div className="mt-4 lg:mt-0">

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">

                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                        Sent

                      </span>

                    </div>

                  </div>

                ))}

              </div>

            </>

          )}

        </div>

        </div>


        {/* Footer */}

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-neutral-400">

          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4"
            />

          </svg>

          Your WhatsApp connection is secure.

        </div>

      </div>

    </main>
  );
}