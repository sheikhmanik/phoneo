'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface SessionData {
  sessionId: string;
  status: string;
  phoneNumber: string | null;
}

interface InvoiceResponse {
  success: boolean;
  message: string;
  invoice: {
    invoiceNumber: string;
    invoiceDate: string;
    customerName: string;
    customerPhone: string;
    amount: number;
    sentFrom: string | undefined;
    message: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function InvoicePage() {
  const router = useRouter();

  const [session, setSession] =
    useState<SessionData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // =====================================================
  // INVOICE FIELDS
  // =====================================================

  const [customerName, setCustomerName] =
    useState('');

  const [customerPhone, setCustomerPhone] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [amount, setAmount] =
    useState('');

  const [message, setMessage] =
    useState(
      'Hello, please find your invoice attached. Thank you.'
    );

  // =====================================================
  // AUTOMATIC INVOICE DATE
  // =====================================================

  const invoiceDate = new Date()
    .toISOString()
    .split('T')[0];

  // =====================================================
  // LOAD WHATSAPP SESSION
  // =====================================================

  useEffect(() => {
    const loadSession = async () => {
      const sessionId =
        localStorage.getItem(
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

    loadSession();
  }, [router]);

  // =====================================================
  // CREATE INVOICE
  // =====================================================

  const handleCreateInvoice = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError(null);

    if (!session) {
      setError(
        'WhatsApp session not found.'
      );
      return;
    }

    if (!customerName.trim()) {
      setError(
        'Please enter the customer name.'
      );
      return;
    }

    if (!customerPhone.trim()) {
      setError(
        'Please enter the customer WhatsApp number.'
      );
      return;
    }

    if (!description.trim()) {
      setError(
        'Please enter an invoice description.'
      );
      return;
    }

    if (
      !amount ||
      Number(amount) <= 0
    ) {
      setError(
        'Please enter a valid invoice amount.'
      );
      return;
    }

    setCreating(true);

    try {
      const { data } =
        await axios.post<InvoiceResponse>(
          `${API_URL}/api/invoices`,
          {
            sessionId:
              session.sessionId,

            customerName:
              customerName.trim(),

            customerPhone:
              customerPhone.trim(),

            description:
              description.trim(),

            amount: Number(amount),

            message:
              message.trim(),
          }
        );

      console.log(
        'Invoice created:',
        data
      );

      setSuccess(true);

      /*
       * Give the user a moment to see
       * the success state before redirecting.
       */
      setTimeout(() => {
        router.replace('/dashboard');
      }, 1200);

    } catch (error) {
      console.error(error);
      
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to send invoice.';
        alert(message);
        setError(message);
      } else {
        alert('Something went wrong while sending the invoice.');
        setError('Something went wrong while sending the invoice.');
      }
    } finally {
      setCreating(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf8]">
        <div className="flex flex-col items-center">

          <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-[#25D366]" />

          <p className="mt-4 text-sm text-neutral-500">
            Loading invoice creator...
          </p>

        </div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  // =====================================================
  // SUCCESS
  // =====================================================

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf8] px-5">

        <div className="w-full max-w-md rounded-[28px] border border-neutral-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.06)]">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">

            <svg
              className="h-8 w-8 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>

          </div>

          <h1 className="mt-6 text-2xl font-semibold text-neutral-950">
            Invoice sent
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            The invoice has been successfully
            sent to the customer's WhatsApp.
          </p>

          <p className="mt-5 text-xs text-neutral-400">
            Redirecting to dashboard...
          </p>

        </div>

      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-[#f7faf8]">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-neutral-200/70 bg-white/80 backdrop-blur-xl">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">

          <div>

            <button
              type="button"
              onClick={() =>
                router.push('/dashboard')
              }
              className="mb-1 flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-900"
            >

              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>

              Dashboard

            </button>

            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
              Create Invoice
            </h1>

          </div>

          {/* Connected WhatsApp */}

          <div className="hidden items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 sm:flex">

            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

            <div>

              <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">
                Connected
              </p>

              <p className="text-sm font-semibold text-emerald-800">
                {session.phoneNumber}
              </p>

            </div>

          </div>

        </div>

      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleCreateInvoice}
            className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] sm:p-8"
          >

            {/* Header */}

            <div className="mb-8">

              <p className="text-xs font-medium uppercase tracking-[0.15em] text-emerald-600">
                Invoice Details
              </p>

              <h2 className="mt-2 text-xl font-semibold text-neutral-900">
                Basic information
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Enter the details you want to
                include in the invoice.
              </p>

            </div>

            {/* Error */}

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* =================================================
                CUSTOMER
            ================================================= */}

            <div className="mt-6 border-t border-neutral-100 pt-6">

              <p className="mb-4 text-sm font-semibold text-neutral-900">
                Customer
              </p>

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Customer Name
                  </label>

                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) =>
                      setCustomerName(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 caret-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="John Doe"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Customer WhatsApp Number
                  </label>

                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) =>
                      setCustomerPhone(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 caret-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="+91 98765 43210"
                  />

                  <p className="mt-2 text-xs text-neutral-400">
                    Include the country code.
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                INVOICE ITEM
            ================================================= */}

            <div className="mt-6 border-t border-neutral-100 pt-6">

              <p className="mb-4 text-sm font-semibold text-neutral-900">
                Invoice Item
              </p>

              <div>

                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-900 caret-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="Website development service"
                />

              </div>

              <div className="mt-5">

                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Amount
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) =>
                      setAmount(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-9 pr-4 text-sm text-neutral-900 caret-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="25,000"
                  />

                </div>

              </div>

            </div>

            {/* =================================================
                WHATSAPP MESSAGE
            ================================================= */}

            <div className="mt-6 border-t border-neutral-100 pt-6">

              <div className="mb-4">

                <p className="text-sm font-semibold text-neutral-900">
                  WhatsApp Message
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  This message will be sent from your
                  connected WhatsApp number.
                </p>

              </div>

              <textarea
                value={message}
                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
                }
                rows={4}
                className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-900 caret-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Write a message for your customer..."
              />

            </div>

            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              disabled={creating}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {creating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-500 border-t-white" />

                  Sending Invoice...
                </>
              ) : (
                <>
                  Send Invoice via WhatsApp

                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 10H3a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </>
              )}

            </button>

          </form>

          {/* =================================================
              PREVIEW
          ================================================= */}

          <div className="lg:sticky lg:top-8 lg:self-start">

            <div className="mb-4">

              <p className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-400">
                Preview
              </p>

              <h2 className="mt-1 text-lg font-semibold text-neutral-900">
                Invoice summary
              </h2>

            </div>

            <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.05)]">

              {/* Invoice top */}

              <div className="border-b border-neutral-100 p-6">

                <div className="flex items-start justify-between">

                  <div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]">

                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 fill-white"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.008-.371-.01-.57.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.89-9.884 2.64 0 5.122 1.03 6.987 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884" />
                      </svg>

                    </div>

                    <p className="mt-3 text-lg font-semibold text-neutral-900">
                      Invoice
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-xs text-neutral-400">
                      Auto-generated
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      {invoiceDate}
                    </p>

                  </div>

                </div>

              </div>

              {/* Customer */}

              <div className="p-6">

                <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                  Bill To
                </p>

                <p className="mt-2 font-semibold text-neutral-900">
                  {customerName ||
                    'Customer Name'}
                </p>

                <p className="mt-1 text-sm text-neutral-500">
                  {customerPhone ||
                    'WhatsApp number'}
                </p>

                {/* Item */}

                <div className="mt-6 border-t border-neutral-100 pt-5">

                  <div className="flex justify-between gap-4">

                    <div>

                      <p className="text-sm font-medium text-neutral-800">
                        {description ||
                          'Invoice item'}
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        1 × Service
                      </p>

                    </div>

                    <p className="font-semibold text-neutral-900">
                      ₹{amount || '0.00'}
                    </p>

                  </div>

                </div>

                {/* Total */}

                <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-5">

                  <p className="font-semibold text-neutral-900">
                    Total
                  </p>

                  <p className="text-xl font-bold text-neutral-900">
                    ₹{amount || '0.00'}
                  </p>

                </div>

              </div>

            </div>

            {/* Sending info */}

            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">

              <div className="flex gap-3">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366]">

                  <svg
                    className="h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M22 2L11 13"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M22 2l-7 20-4-9-9-4 20-7z"
                    />

                  </svg>

                </div>

                <div>

                  <p className="text-sm font-semibold text-emerald-900">
                    Ready to send
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-700">
                    The invoice will be sent through{' '}
                    {session.phoneNumber}.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}