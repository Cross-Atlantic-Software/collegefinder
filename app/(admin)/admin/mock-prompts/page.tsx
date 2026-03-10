'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getMockPromptsList, updateMockPrompt, type MockPromptItem } from '@/api/admin/mock-prompts';
import { useToast } from '@/components/shared';
import { FiSearch, FiChevronDown, FiChevronRight } from 'react-icons/fi';

/** Example prompt for JEE Main — copy into the textarea for that exam. */
const JEE_MAIN_EXAMPLE_PROMPT = `You are an expert JEE Main paper setter.

SLOT: Question {{question_number}} of {{total_in_section}} for {{section_name}} ({{section_type}}) in {{exam_name}}.
QUESTION TYPE: {{question_type}}

SYLLABUS for {{subject}}:
- Physics: Mechanics, Kinematics, Laws of Motion, Work-Energy-Power, Rotational Motion, Gravitation, Thermodynamics, Waves, Oscillations, Electrostatics, Current Electricity, EMI, Magnetic Effects, Optics, Modern Physics, Semiconductors
- Chemistry: Atomic Structure, Chemical Bonding, Thermodynamics, Equilibrium, Electrochemistry, Kinetics, p-Block, d-Block, Coordination Compounds, Hydrocarbons, Organic Reactions, Biomolecules, Polymers
- Mathematics: Sets, Complex Numbers, Quadratics, Sequences, Binomial, Matrices, Permutations, Probability, Trigonometry, Calculus, Differential Equations, Coordinate Geometry, 3D, Vectors

COVERAGE RULE: This is question {{question_number}} of {{total_in_section}}. Pick a topic from the syllabus above that ensures full coverage across the section — do not repeat topics that earlier questions likely covered.

DIFFICULTY RULE: Distribute difficulty across the full section as: first ~30% easy, middle ~50% medium, last ~20% hard. Based on question {{question_number}} of {{total_in_section}}, choose the appropriate difficulty level.

STYLE:
- MCQ: single correct, 4 plausible options, matches NTA JEE Main pattern (2022–2025 level)
- Numerical: integer answer 0–9999, step-by-step derivation
- Use standard notation; in JSON use double backslashes for LaTeX (e.g. \\\\Omega)
- Solution must be educational and step-by-step`;

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
            <p className="text-sm text-gray-600">
              Set the generation prompt for each exam. These prompts are stored by exam ID and used for mock question generation.
            </p>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Placeholders: {'{{exam_name}}'}, {'{{subject}}'}, {'{{section_name}}'}, {'{{section_type}}'}, {'{{question_type}}'}, {'{{question_number}}'}, {'{{total_in_section}}'}
          </p>
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
              <pre className="mt-2 p-4 bg-gray-100 border border-gray-200 rounded-lg text-xs text-left overflow-x-auto whitespace-pre-wrap font-sans">
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
