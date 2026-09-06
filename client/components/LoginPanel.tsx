'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

type Status =
  | 'idle'
  | 'starting'
  | 'qr'
  | 'connecting'
  | 'connected'
  | 'error';

interface StartSessionResponse {
  sessionId: string;
}

interface QREvent {
  qr: string;
}

interface ConnectedEvent {
  phoneNumber: string;
}

interface SessionData {
  sessionId: string;
  status: string;
  phoneNumber: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function WhatsAppLoginPanel() {
  const router = useRouter();

  const [status, setStatus] = useState<Status>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const startSession = async () => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;

    setStatus('starting');
    setQrCode(null);
    setPhoneNumber(null);
    setError(null);

    try {
      const { data } = await axios.post<StartSessionResponse>(
        `${API_URL}/api/whatsapp/session`
      );

      const { sessionId } = data;

      const eventSource = new EventSource(
        `${API_URL}/api/whatsapp/session/${sessionId}/events`
      );

      eventSourceRef.current = eventSource;

      eventSource.addEventListener('qr', (event) => {
        const data: QREvent = JSON.parse(event.data);

        setQrCode(data.qr);
        setStatus('qr');
      });

      eventSource.addEventListener('connecting', () => {
        setStatus('connecting');
      });

      eventSource.addEventListener('connected', (event) => {
        const data: ConnectedEvent = JSON.parse(event.data);

        setPhoneNumber(data.phoneNumber);
        setStatus('connected');

        localStorage.setItem(
          'whatsappSessionId',
          sessionId
        );

        eventSource.close();
        eventSourceRef.current = null;

        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      });

      eventSource.addEventListener('failed', (event) => {
        const data = JSON.parse(event.data);

        setStatus('error');
        setError(
          data.message || 'WhatsApp connection failed.'
        );

        eventSource.close();
        eventSourceRef.current = null;
      });

      eventSource.onerror = () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          return;
        }

        setStatus('error');
        setError('Connection to server was lost.');

        eventSource.close();
        eventSourceRef.current = null;
      };
    } catch (error) {
      setStatus('error');

      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.message ||
            'Failed to start WhatsApp session.'
        );
      } else {
        setError('Something went wrong.');
      }
    }
  };

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const checkExistingSession = async () => {
      const sessionId = localStorage.getItem(
        'whatsappSessionId'
      );

      if (!sessionId) {
        return;
      }

      try {
        const { data } = await axios.get<SessionData>(
          `${API_URL}/api/whatsapp/session/${sessionId}`
        );

        if (data.status === 'connected') {
          router.replace('/dashboard');
          return;
        }

        localStorage.removeItem('whatsappSessionId');
      } catch {
        localStorage.removeItem('whatsappSessionId');
      }
    };

    checkExistingSession();
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7faf8] px-5 py-12">

      {/* Background decoration */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-green-100/50 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-100/60" />

      </div>


      {/* Main card */}

      <div className="relative z-10 w-full max-w-115">

        {/* Brand */}

        <div className="mb-8 text-center">

          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] shadow-[0_10px_30px_rgba(37,211,102,0.25)]">

            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 fill-white"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.075-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.89-9.884 2.64 0 5.122 1.03 6.987 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.89c0 2.096.547 4.142 1.588 5.946L.057 24l6.304-1.654a11.875 11.875 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.478-8.413" />
            </svg>

          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            Connect WhatsApp
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500">
            Securely connect your WhatsApp account to continue.
          </p>

        </div>


        {/* Card */}

        <div className="rounded-[28px] border border-neutral-200/80 bg-white/90 p-3 shadow-[0_25px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl">

          <div className="rounded-[22px] border border-neutral-100 bg-[#fafafa] px-6 py-8 sm:px-8">


            {/* ===============================
                IDLE
            =============================== */}

            {status === 'idle' && (
              <div className="flex flex-col items-center text-center">

                <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-3xl border border-neutral-200 bg-white shadow-sm">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8fdf0]">

                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7 text-[#20c766]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 10h8M8 14h5"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 11.5a7 7 0 01-7 7 7.2 7.2 0 01-2.7-.5L5 19l1-3.3a7 7 0 1113-4.2z"
                      />

                    </svg>

                  </div>

                </div>


                <h2 className="text-lg font-semibold text-neutral-900">
                  Link your account
                </h2>

                <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-500">
                  Scan a QR code with WhatsApp on your phone to securely link your account.
                </p>


                <button
                  type="button"
                  onClick={startSession}
                  className="group mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1fae5a] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(31,174,90,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1a9b50] hover:shadow-[0_12px_25px_rgba(31,174,90,0.25)] active:translate-y-0"
                >

                  Connect with WhatsApp

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


                <div className="mt-6 flex items-center gap-2 text-xs text-neutral-400">

                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm10-11V7a4 4 0 00-8 0v1"
                    />
                  </svg>

                  Secure connection

                </div>

              </div>
            )}


            {/* ===============================
                STARTING
            =============================== */}

            {status === 'starting' && (
              <div className="flex min-h-90 flex-col items-center justify-center text-center">

                <div className="relative mb-7 h-20 w-20">

                  <div className="absolute inset-0 rounded-full border-4 border-neutral-200" />

                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#25D366]" />

                  <div className="absolute inset-3 flex items-center justify-center rounded-full bg-white">

                    <svg
                      className="h-6 w-6 text-[#25D366]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12.04 2C6.58 2 2.14 6.44 2.14 11.9c0 1.74.45 3.43 1.31 4.92L2 22l5.33-1.4a9.84 9.84 0 004.71 1.2h.01c5.45 0 9.89-4.44 9.89-9.9C21.94 6.44 17.5 2 12.04 2z" />
                    </svg>

                  </div>

                </div>

                <h2 className="text-lg font-semibold text-neutral-900">
                  Preparing WhatsApp
                </h2>

                <p className="mt-2 text-sm text-neutral-500">
                  Generating your secure QR code...
                </p>

              </div>
            )}


            {/* ===============================
                QR
            =============================== */}

            {status === 'qr' && qrCode && (
              <div className="flex flex-col items-center text-center">

                <div className="mb-5 flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">

                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />

                  Waiting for scan

                </div>


                <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                  Scan to connect
                </h2>

                <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-500">
                  Open WhatsApp on your phone and scan the QR code below.
                </p>


                {/* QR container */}

                <div className="relative mt-7 rounded-3xl border border-neutral-200 bg-white p-4 shadow-[0_15px_40px_rgba(0,0,0,0.07)]">

                  {/* Corner decoration */}

                  <div className="pointer-events-none absolute -left-1 -top-1 h-8 w-8 rounded-tl-xl border-l-2 border-t-2 border-[#25D366]" />

                  <div className="pointer-events-none absolute -right-1 -top-1 h-8 w-8 rounded-tr-xl border-r-2 border-t-2 border-[#25D366]" />

                  <div className="pointer-events-none absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-xl border-b-2 border-l-2 border-[#25D366]" />

                  <div className="pointer-events-none absolute -bottom-1 -right-1 h-8 w-8 rounded-br-xl border-b-2 border-r-2 border-[#25D366]" />

                  <img
                    src={qrCode}
                    alt="WhatsApp QR code"
                    className="h-56 w-56 rounded-xl"
                  />

                </div>


                {/* Instructions */}

                <div className="mt-7 flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8fdf0] text-[#20c766]">

                    <svg
                      className="h-4.5 w-4.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 6h6M9 18h6"
                      />

                    </svg>

                  </div>

                  <div>

                    <p className="text-xs font-semibold text-neutral-800">
                      WhatsApp → Linked Devices
                    </p>

                    <p className="mt-0.5 text-xs text-neutral-500">
                      Tap “Link a Device” and scan this code.
                    </p>

                  </div>

                </div>


                <p className="mt-5 text-xs text-neutral-400">
                  Keep this window open while connecting.
                </p>

              </div>
            )}


            {/* ===============================
                CONNECTING
            =============================== */}

            {status === 'connecting' && (
              <div className="flex min-h-90 flex-col items-center justify-center text-center">

                <div className="relative mb-7 flex h-20 w-20 items-center justify-center">

                  <div className="absolute inset-0 animate-ping rounded-full bg-emerald-100" />

                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-sm">

                    <svg
                      className="h-8 w-8 text-[#25D366]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 6l6 6-6 6"
                      />

                    </svg>

                  </div>

                </div>


                <h2 className="text-lg font-semibold text-neutral-900">
                  QR code scanned
                </h2>

                <p className="mt-2 text-sm text-neutral-500">
                  Establishing a secure connection...
                </p>


                <div className="mt-6 flex items-center gap-2">

                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#25D366]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#25D366] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#25D366] [animation-delay:300ms]" />

                </div>

              </div>
            )}


            {/* ===============================
                CONNECTED
            =============================== */}

            {status === 'connected' && (
              <div className="flex min-h-90 flex-col items-center justify-center text-center">

                <div className="relative mb-7">

                  <div className="absolute -inset-3 animate-pulse rounded-full bg-emerald-100" />

                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366] shadow-[0_12px_30px_rgba(37,211,102,0.3)]">

                    <svg
                      className="h-9 w-9 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12l4 4L19 6"
                      />
                    </svg>

                  </div>

                </div>


                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Connection successful
                </div>


                <h2 className="mt-4 text-xl font-semibold text-neutral-900">
                  WhatsApp connected
                </h2>


                {phoneNumber && (
                  <p className="mt-2 text-sm text-neutral-500">
                    {phoneNumber}
                  </p>
                )}


                <div className="mt-7 flex items-center gap-2 text-xs text-neutral-400">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  Redirecting to your dashboard...

                </div>

              </div>
            )}


            {/* ===============================
                ERROR
            =============================== */}

            {status === 'error' && (
              <div className="flex min-h-90 flex-col items-center justify-center text-center">

                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">

                  <svg
                    className="h-7 w-7 text-red-500"
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

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.3 3.8L2.8 17a2 2 0 001.7 3h15a2 2 0 001.7-3l-7.5-13.2a2 2 0 00-3.4 0z"
                    />

                  </svg>

                </div>


                <h2 className="text-lg font-semibold text-neutral-900">
                  Connection failed
                </h2>

                <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-500">
                  {error || 'Unable to connect your WhatsApp account.'}
                </p>


                <button
                  type="button"
                  onClick={startSession}
                  className="mt-7 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 active:translate-y-0"
                >
                  Try again
                </button>

              </div>
            )}

          </div>

        </div>


        {/* Footer */}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-400">

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

          Your WhatsApp connection is private and secure.

        </div>

      </div>

    </main>
  );
}