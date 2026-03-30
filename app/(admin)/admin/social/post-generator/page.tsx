'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  generateSocialPost,
  getSocialApiHealth,
  type SocialAccountType,
  type SocialGenerateResult,
} from '@/api/admin/social';
import { PostGeneratorOutput } from '@/components/admin/social/PostGeneratorOutput';
import { useToast } from '@/components/shared';

export default function PostGeneratorPage() {
  const router = useRouter();
  const { showError } = useToast();
  const [thoughts, setThoughts] = useState('');
  const [previousPostsRaw, setPreviousPostsRaw] = useState('');
  const [accountType, setAccountType] = useState<SocialAccountType>('project');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SocialGenerateResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<
    'checking' | 'ok' | 'unreachable' | 'no_key'
  >('checking');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const h = await getSocialApiHealth();
      if (cancelled) return;
      if (!h.success || !h.data) {
        setBackendStatus('unreachable');
        return;
      }
      setBackendStatus(h.data.googleKeyConfigured ? 'ok' : 'no_key');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerate = async () => {
    const trimmed = thoughts.trim();
    if (!trimmed) {
      setApiError('Please enter your thoughts before generating.');
      showError('Thoughts cannot be empty');
      return;
    }
    setApiError(null);
    setLoading(true);
    setResult(null);
    const previousPosts = previousPostsRaw
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await generateSocialPost({
        thoughts: trimmed,
        accountType,
        previousPosts,
      });
      if (!res.success || !res.data) {
        setApiError(res.message || 'Generation failed');
        showError(res.message || 'Generation failed');
        return;
      }
      setResult(res.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      setApiError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm text-gray-600 mb-6">
              Turn rough ideas into a title, article, LinkedIn post, Twitter thread, Instagram slides,
              and image prompts (images not generated yet).
            </p>

            {backendStatus === 'checking' ? (
              <p className="mb-4 text-sm text-gray-500">Checking API connection…</p>
            ) : null}

            {backendStatus === 'unreachable' ? (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <p className="font-semibold">Node API unreachable</p>
                <p className="mt-2 text-amber-900/90">
                  <code className="rounded bg-amber-100/80 px-1">npm run dev</code> only starts Next.js.
                  The Post Generator needs the Express server on port 5001 (where{" "}
                  <code className="rounded bg-amber-100/80 px-1">GOOGLE_API_KEY</code> is loaded from{" "}
                  <code className="rounded bg-amber-100/80 px-1">backend/.env</code>).
                </p>
                <p className="mt-2 text-amber-900/90">
                  From the repo root run:{" "}
                  <code className="rounded bg-amber-100/80 px-1">npm run dev:with-api</code>
                  , or in a second terminal:{" "}
                  <code className="rounded bg-amber-100/80 px-1">cd backend &amp;&amp; node server.js</code>
                  . Ensure <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_API_URL</code> in the
                  project <code className="rounded bg-amber-100/80 px-1">.env</code> matches that server
                  (default <code className="rounded bg-amber-100/80 px-1">http://localhost:5001/api</code>
                  ).
                </p>
              </div>
            ) : null}

            {backendStatus === 'no_key' ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                <p className="font-semibold">Google API key not loaded on the Node server</p>
                <p className="mt-2">
                  Set <code className="rounded bg-red-100 px-1">GOOGLE_API_KEY</code> or{" "}
                  <code className="rounded bg-red-100 px-1">GOOGLE_GENERATIVE_AI_API_KEY</code> in{" "}
                  <code className="rounded bg-red-100 px-1">backend/.env</code>, then restart{" "}
                  <code className="rounded bg-red-100 px-1">node server.js</code>.
                </p>
              </div>
            ) : null}

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
              <label htmlFor="thoughts" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your thoughts
              </label>
              <textarea
                id="thoughts"
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                rows={6}
                placeholder="What do you want to talk about?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />

              <div className="mt-4">
                <label htmlFor="previousPosts" className="block text-sm font-medium text-gray-700 mb-2">
                  Previous posts <span className="font-normal text-gray-500">(optional, one per line)</span>
                </label>
                <textarea
                  id="previousPosts"
                  value={previousPostsRaw}
                  onChange={(e) => setPreviousPostsRaw(e.target.value)}
                  rows={3}
                  placeholder="Paste snippets of past posts to match tone…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div className="mt-4">
                <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-2">
                  Account type
                </label>
                <select
                  id="accountType"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as SocialAccountType)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                >
                  <option value="project">Project</option>
                  <option value="founder">Founder</option>
                </select>
              </div>

              {apiError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {apiError}
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={loading || backendStatus !== 'ok'}
                className="mt-6 rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Generating…' : 'Generate post'}
              </button>
            </div>

            {result && <PostGeneratorOutput data={result} />}
          </div>
        </main>
      </div>
    </div>
  );
}
