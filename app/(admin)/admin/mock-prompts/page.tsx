'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getMockPromptsList, updateMockPrompt, type MockPromptItem } from '@/api/admin/mock-prompts';
import { useToast } from '@/components/shared';
import { FiSearch, FiChevronDown, FiChevronRight } from 'react-icons/fi';

/** Example prompt for JEE Main — copy into the textarea for that exam. Updated for NTA JEE Main 2025/2026 pattern. */
const JEE_MAIN_EXAMPLE_PROMPT = `You are an expert JEE Main (NTA) paper setter. Generate one question per call matching the current NTA JEE Main Paper 1 (B.E./B.Tech) pattern.

SLOT: Question {{question_number}} of {{total_in_section}} in {{section_name}} ({{section_type}}), {{exam_name}}.
QUESTION TYPE: {{question_type}}

SYLLABUS for {{subject}} (align with NTA JEE Main 2025 syllabus):
- Physics: Units & Dimensions, Kinematics, Laws of Motion, Work Energy Power, Rotational Motion, Gravitation, Properties of Solids & Fluids, Thermodynamics, Kinetic Theory, Oscillations & Waves, Electrostatics, Current Electricity, Magnetic Effects, EMI, AC, EM Waves, Ray & Wave Optics, Dual Nature, Atoms & Nuclei, Electronic Devices, Communication Systems
- Chemistry: Some Basic Concepts, Atomic Structure, Classification, Chemical Bonding, States of Matter, Thermodynamics, Equilibrium, Redox, Hydrogen, s-Block, p-Block, Organic Chemistry (Basic, Hydrocarbons), Environmental Chemistry; Solid State, Solutions, Electrochemistry, Chemical Kinetics, Surface Chemistry, p-Block (cont.), d-Block, Coordination Compounds, Haloalkanes & Haloarenes, Alcohols & Ethers, Aldehydes, Ketones, Carboxylic Acids, Amines, Biomolecules, Polymers, Chemistry in Everyday Life
- Mathematics: Sets, Relations & Functions, Complex Numbers, Quadratic Equations, Matrices, Permutations & Combinations, Binomial Theorem, Sequences & Series, Straight Lines, Conic Sections, 3D Geometry, Limits, Continuity, Differentiation, Applications of Derivatives, Integrals, Applications of Integrals, Differential Equations, Vector Algebra, Probability, Statistics

COVERAGE: This is question {{question_number}} of {{total_in_section}}. Choose a topic from the syllabus so that across the section there is broad coverage; avoid repeating the same topic in consecutive questions.

DIFFICULTY: For the section, aim for roughly: first 30% easier, middle 50% medium, last 20% harder. For question {{question_number}} of {{total_in_section}}, set difficulty accordingly (easy / medium / hard).

STYLE:
- MCQ (Section A): Single correct answer; exactly 4 options; plausible distractors; clarity and precision; NTA JEE Main 2025–2026 style.
- Numerical (Section B): Integer answer in range 0–9999; clear step-by-step solution; final answer as a single integer.
- Use standard symbols; in JSON escape LaTeX with double backslashes (e.g. \\\\Omega, \\\\frac{1}{2}).
- Solution must be complete, step-by-step, and suitable for JEE Main preparation.`;

export default function MockPromptsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<MockPromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExample, setShowExample] = useState(false);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (i) =>
        i.exam_name.toLowerCase().includes(q) ||
        i.exam_code.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }
    fetchList();
  }, [router]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await getMockPromptsList();
      if (res.success && res.data) {
        setItems(res.data.items);
        const initial: Record<number, string> = {};
        res.data.items.forEach((i) => { initial[i.exam_id] = i.prompt ?? ''; });
        setEdits(initial);
      }
    } catch {
      showError('Failed to load mock prompts');
    } finally {
      setLoading(false);
    }
  };

  const setEdit = (examId: number, value: string) => {
    setEdits((prev) => ({ ...prev, [examId]: value }));
  };

  const handleSave = async (examId: number) => {
    const prompt = edits[examId] ?? '';
    setSavingId(examId);
    try {
      const res = await updateMockPrompt(examId, prompt);
      if (res.success) {
        showSuccess('Mock prompt saved');
        setItems((prev) =>
          prev.map((i) => (i.exam_id === examId ? { ...i, prompt } : i))
        );
      } else {
        showError(res.message || 'Failed to save');
      }
    } catch {
      showError('Failed to save mock prompt');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Mock Prompts</h1>
            <p className="text-sm text-gray-600 max-w-2xl">
              Write instructions for the AI that generates mock questions. One prompt per exam; the same prompt is used for every question in that exam, with placeholders filled in per question (e.g. which subject, section, and question number). Use placeholders in double curly braces so the system can inject context: exam and subject names, section and type, question type (MCQ/Numerical), and position (e.g. question 5 of 25). Expand the JEE Main example below to see a full template you can copy and adapt.
            </p>
          </div>
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowExample((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {showExample ? <FiChevronDown className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />}
              Example prompt for JEE Main
            </button>
            {showExample && (
              <pre className="mt-2 p-4 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-800 text-left overflow-x-auto whitespace-pre-wrap font-sans">
                {JEE_MAIN_EXAMPLE_PROMPT}
              </pre>
            )}
          </div>
          {!loading && items.length > 0 && (
            <div className="relative mb-4 max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by exam name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
              />
            </div>
          )}
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-4">
              {items.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No exams in the database. Add exams first from the Exams section.</p>
              ) : filteredItems.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No exams match your search.</p>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.exam_id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{item.exam_name}</span>
                        <span className="ml-2 text-sm text-gray-500 font-mono">{item.exam_code}</span>
                        {item.prompt && item.prompt.trim() && (
                          <span className="ml-2 text-xs text-green-600 font-medium">Custom prompt set</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSave(item.exam_id)}
                        disabled={savingId === item.exam_id}
                        className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingId === item.exam_id ? 'Saving...' : 'Save prompt'}
                      </button>
                    </div>
                    <div className="p-4">
                      <textarea
                        value={edits[item.exam_id] ?? ''}
                        onChange={(e) => setEdit(item.exam_id, e.target.value)}
                        placeholder="Leave empty to use the generic prompt, or enter exam-specific instructions..."
                        rows={8}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-y font-mono"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
