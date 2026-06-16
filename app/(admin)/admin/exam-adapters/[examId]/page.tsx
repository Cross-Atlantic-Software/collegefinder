'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getExamAdapter,
  getProfileSchema,
  updateExamAdapter,
  setExamAdapterStatus,
  ExamAdapterDetail,
  ProfilePathEntry,
  AdapterSection,
  AdapterField,
  FieldType
} from '@/api/admin/examAdapters';
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiChevronDown,
  FiChevronRight,
  FiSave,
  FiCheckCircle,
  FiClock,
  FiCpu
} from 'react-icons/fi';
import { useToast } from '@/components/shared';

const FIELD_TYPES: FieldType[] = ['text', 'select', 'date', 'radio', 'checkbox', 'file', 'select_or_text'];
const FORMATS = ['', 'UPPERCASE', 'TITLECASE', 'PHONE', 'digits_only'] as const;
const PAGE_INDICATOR_TYPES = ['url_contains', 'page_text_contains', 'step_number'] as const;

export default function ExamAdapterEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const examId = decodeURIComponent(String(params?.examId || ''));

  const [adapter, setAdapter] = useState<ExamAdapterDetail | null>(null);
  const [profileSchema, setProfileSchema] = useState<ProfilePathEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const [adapterRes, schemaRes] = await Promise.all([getExamAdapter(examId), getProfileSchema()]);
      if (adapterRes.success && adapterRes.data) {
        setAdapter(adapterRes.data);
        // expand the first section by default
        if (adapterRes.data.adapter_config?.sections?.[0]) {
          setExpandedSections(new Set([adapterRes.data.adapter_config.sections[0].section_id]));
        }
      } else {
        setError(adapterRes.message || 'Failed to load adapter');
      }
      if (schemaRes.success && schemaRes.data) setProfileSchema(schemaRes.data);
    } catch (err) {
      setError('Failed to load adapter');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const sections = adapter?.adapter_config?.sections || [];

  const updateSections = (updater: (prev: AdapterSection[]) => AdapterSection[]) => {
    setAdapter((prev) => {
      if (!prev) return prev;
      const newSections = updater(prev.adapter_config.sections || []);
      return {
        ...prev,
        adapter_config: { ...prev.adapter_config, sections: newSections }
      };
    });
  };

  const handleSave = async () => {
    if (!adapter) return;
    try {
      setIsSaving(true);
      const res = await updateExamAdapter(examId, {
        exam_name: adapter.exam_name,
        portal_url_pattern: adapter.portal_url_pattern,
        adapter_config: adapter.adapter_config,
        credit_cost: adapter.credit_cost ?? null,
        exam_fee: adapter.exam_fee ?? null
      });
      if (res.success && res.data) {
        showSuccess(`Saved. Version v${res.data.version}.`);
        setAdapter(res.data);
      } else {
        showError(res.message || 'Save failed');
      }
    } catch (err) {
      showError('Save failed');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!adapter) return;
    const next = adapter.status === 'published' ? 'draft' : 'published';
    const res = await setExamAdapterStatus(examId, next);
    if (res.success && res.data) {
      showSuccess(next === 'published' ? 'Published' : 'Unpublished');
      setAdapter({ ...adapter, ...res.data });
    } else {
      showError(res.message || 'Failed to change status');
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSection = () => {
    const newId = `section_${Date.now()}`;
    updateSections((prev) => [
      ...prev,
      {
        section_id: newId,
        section_name: 'New Section',
        page_indicator: { type: 'url_contains', value: '' },
        fields: []
      }
    ]);
    setExpandedSections((prev) => new Set([...prev, newId]));
  };

  const removeSection = (sectionId: string) => {
    if (!confirm('Remove this section?')) return;
    updateSections((prev) => prev.filter((s) => s.section_id !== sectionId));
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    updateSections((prev) => {
      const idx = prev.findIndex((s) => s.section_id === sectionId);
      if (idx < 0) return prev;
      const next = idx + direction;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  const updateSection = (sectionId: string, patch: Partial<AdapterSection>) => {
    updateSections((prev) => prev.map((s) => (s.section_id === sectionId ? { ...s, ...patch } : s)));
  };

  const addField = (sectionId: string) => {
    updateSections((prev) =>
      prev.map((s) =>
        s.section_id === sectionId
          ? {
              ...s,
              fields: [
                ...s.fields,
                {
                  field_id: `field_${Date.now()}`,
                  label: '',
                  source: null,
                  type: 'text',
                  required: false,
                  selectors: {}
                }
              ]
            }
          : s
      )
    );
  };

  const updateField = (sectionId: string, fieldIdx: number, patch: Partial<AdapterField>) => {
    updateSections((prev) =>
      prev.map((s) =>
        s.section_id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f, i) => (i === fieldIdx ? { ...f, ...patch } : f))
            }
          : s
      )
    );
  };

  const removeField = (sectionId: string, fieldIdx: number) => {
    updateSections((prev) =>
      prev.map((s) =>
        s.section_id === sectionId
          ? { ...s, fields: s.fields.filter((_, i) => i !== fieldIdx) }
          : s
      )
    );
  };

  // ─── Render ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500">Loading…</div>
        </div>
      </div>
    );
  }

  if (error || !adapter) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-3">{error || 'Adapter not found'}</p>
              <button
                onClick={() => router.push('/admin/exam-adapters')}
                className="text-[#341050] hover:underline text-sm"
              >
                ← Back to adapters list
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <button
                onClick={() => router.push('/admin/exam-adapters')}
                className="mt-0.5 text-slate-500 hover:text-slate-800"
                title="Back to list"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {adapter.exam_name}
                  {adapter.is_ai_generated && (
                    <span title="AI-generated">
                      <FiCpu className="h-4 w-4 text-amber-500" />
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {adapter.exam_id} · v{adapter.version} · {sections.length} section{sections.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePublish}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  adapter.status === 'published'
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
              >
                {adapter.status === 'published' ? (
                  <FiCheckCircle className="h-4 w-4" />
                ) : (
                  <FiClock className="h-4 w-4" />
                )}
                {adapter.status === 'published' ? 'Published — click to unpublish' : 'Draft — click to publish'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg disabled:opacity-60"
              >
                <FiSave className="h-4 w-4" />
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border border-slate-200 rounded-lg p-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                Exam Name
              </label>
              <input
                type="text"
                value={adapter.exam_name}
                onChange={(e) => setAdapter({ ...adapter, exam_name: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                Portal URL Pattern
              </label>
              <input
                type="text"
                value={adapter.portal_url_pattern}
                onChange={(e) => setAdapter({ ...adapter, portal_url_pattern: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                Credit Cost (credits to auto-fill)
              </label>
              <input
                type="number"
                min={0}
                value={adapter.credit_cost ?? ''}
                onChange={(e) =>
                  setAdapter({
                    ...adapter,
                    credit_cost: e.target.value === '' ? null : parseInt(e.target.value, 10)
                  })
                }
                placeholder="1"
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                Exam Fee (₹, paid to the exam)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={adapter.exam_fee ?? ''}
                onChange={(e) =>
                  setAdapter({
                    ...adapter,
                    exam_fee: e.target.value === '' ? null : Number(e.target.value)
                  })
                }
                placeholder="e.g. 2000"
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
              />
            </div>
          </div>

          {/* Sections accordion */}
          <div className="space-y-3">
            {sections.length === 0 && (
              <div className="bg-white border border-dashed border-slate-300 rounded-lg p-6 text-center text-sm text-slate-500">
                No sections yet. Open the portal in Chrome with the ExamFill extension to AI-build the first section, or click below to add one manually.
              </div>
            )}

            {sections.map((section, sIdx) => (
              <SectionEditor
                key={section.section_id}
                section={section}
                isExpanded={expandedSections.has(section.section_id)}
                onToggle={() => toggleSection(section.section_id)}
                onChange={(patch) => updateSection(section.section_id, patch)}
                onMoveUp={sIdx > 0 ? () => moveSection(section.section_id, -1) : undefined}
                onMoveDown={sIdx < sections.length - 1 ? () => moveSection(section.section_id, 1) : undefined}
                onRemove={() => removeSection(section.section_id)}
                onAddField={() => addField(section.section_id)}
                onUpdateField={(idx, patch) => updateField(section.section_id, idx, patch)}
                onRemoveField={(idx) => removeField(section.section_id, idx)}
                profileSchema={profileSchema}
              />
            ))}

            <button
              onClick={addSection}
              className="w-full py-2 text-sm text-[#341050] bg-white border border-dashed border-slate-300 rounded-lg hover:border-[#341050] hover:bg-slate-50 inline-flex items-center justify-center gap-1.5"
            >
              <FiPlus className="h-4 w-4" />
              Add Section
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── SectionEditor ────────────────────────────────────────────────────

interface SectionEditorProps {
  section: AdapterSection;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<AdapterSection>) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
  onAddField: () => void;
  onUpdateField: (idx: number, patch: Partial<AdapterField>) => void;
  onRemoveField: (idx: number) => void;
  profileSchema: ProfilePathEntry[];
}

function SectionEditor({
  section,
  isExpanded,
  onToggle,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  onAddField,
  onUpdateField,
  onRemoveField,
  profileSchema
}: SectionEditorProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50">
        <button onClick={onToggle} className="text-slate-500 hover:text-slate-800 p-1">
          {isExpanded ? <FiChevronDown className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900">{section.section_name || '(unnamed)'}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            {section.section_id} · {section.fields.length} field{section.fields.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onMoveUp && (
            <button onClick={onMoveUp} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded" title="Move up">
              ↑
            </button>
          )}
          {onMoveDown && (
            <button onClick={onMoveDown} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded" title="Move down">
              ↓
            </button>
          )}
          <button onClick={onRemove} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded" title="Delete section">
            <FiTrash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Section meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                Section Name
              </label>
              <input
                type="text"
                value={section.section_name}
                onChange={(e) => onChange({ section_name: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                Page Indicator Type
              </label>
              <select
                value={section.page_indicator?.type || 'url_contains'}
                onChange={(e) =>
                  onChange({
                    page_indicator: {
                      type: e.target.value as 'url_contains' | 'page_text_contains' | 'step_number',
                      value: section.page_indicator?.value || ''
                    }
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
              >
                {PAGE_INDICATOR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                Page Indicator Value
              </label>
              <input
                type="text"
                value={String(section.page_indicator?.value || '')}
                onChange={(e) =>
                  onChange({
                    page_indicator: {
                      type: section.page_indicator?.type || 'url_contains',
                      value: e.target.value
                    }
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none font-mono"
              />
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase text-slate-600">Fields</div>
            {section.fields.length === 0 && (
              <div className="text-xs text-slate-500 italic">No fields. Click "Add Field" or use the extension Builder.</div>
            )}
            {section.fields.map((field, idx) => (
              <FieldEditor
                key={`${section.section_id}-${idx}`}
                field={field}
                onChange={(patch) => onUpdateField(idx, patch)}
                onRemove={() => onRemoveField(idx)}
                profileSchema={profileSchema}
              />
            ))}
            <button
              onClick={onAddField}
              className="w-full py-1.5 text-xs text-[#341050] bg-white border border-dashed border-slate-300 rounded-lg hover:border-[#341050] hover:bg-slate-50 inline-flex items-center justify-center gap-1.5"
            >
              <FiPlus className="h-3.5 w-3.5" />
              Add Field
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FieldEditor ────────────────────────────────────────────────────

interface FieldEditorProps {
  field: AdapterField;
  onChange: (patch: Partial<AdapterField>) => void;
  onRemove: () => void;
  profileSchema: ProfilePathEntry[];
}

function FieldEditor({ field, onChange, onRemove, profileSchema }: FieldEditorProps) {
  const [expanded, setExpanded] = useState(false);

  const sourceLabel = useMemo(() => {
    if (!field.source) return null;
    return profileSchema.find((p) => p.path === field.source)?.label || null;
  }, [field.source, profileSchema]);

  const updateSelector = (key: 'by_id' | 'by_name' | 'by_placeholder' | 'by_label', value: string) => {
    const arr = value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    onChange({ selectors: { ...field.selectors, [key]: arr.length ? arr : undefined } });
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-slate-50/40">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-500 hover:text-slate-800 p-1"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <FiChevronDown className="h-3.5 w-3.5" /> : <FiChevronRight className="h-3.5 w-3.5" />}
        </button>

        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Label"
          className="flex-1 min-w-0 px-2 py-1 text-xs border border-slate-300 rounded bg-white"
        />

        <select
          value={field.source || ''}
          onChange={(e) => onChange({ source: e.target.value || null })}
          className="px-2 py-1 text-xs border border-slate-300 rounded bg-white max-w-[200px]"
          title={sourceLabel || 'Pick a profile path'}
        >
          <option value="">— skip —</option>
          {profileSchema.map((p) => (
            <option key={p.path} value={p.path}>
              {p.path}
            </option>
          ))}
        </select>

        <select
          value={field.type}
          onChange={(e) => onChange({ type: e.target.value as FieldType })}
          className="px-2 py-1 text-xs border border-slate-300 rounded bg-white"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label className="text-[11px] text-slate-600 inline-flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ required: e.target.checked })}
          />
          required
        </label>

        <button onClick={onRemove} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Delete field">
          <FiTrash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-200 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">Field ID</label>
              <input
                type="text"
                value={field.field_id}
                onChange={(e) => onChange({ field_id: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">Format</label>
              <select
                value={field.format || ''}
                onChange={(e) => onChange({ format: (e.target.value || undefined) as AdapterField['format'] })}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f || '(none)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectorRow
              label="by_id"
              value={(field.selectors.by_id || []).join(', ')}
              onChange={(v) => updateSelector('by_id', v)}
            />
            <SelectorRow
              label="by_name"
              value={(field.selectors.by_name || []).join(', ')}
              onChange={(v) => updateSelector('by_name', v)}
            />
            <SelectorRow
              label="by_placeholder"
              value={(field.selectors.by_placeholder || []).join(', ')}
              onChange={(v) => updateSelector('by_placeholder', v)}
            />
            <SelectorRow
              label="by_label"
              value={(field.selectors.by_label || []).join(', ')}
              onChange={(v) => updateSelector('by_label', v)}
            />
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">by_index</label>
              <input
                type="number"
                min={0}
                value={typeof field.selectors.by_index === 'number' ? field.selectors.by_index : ''}
                onChange={(e) => {
                  const n = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                  onChange({
                    selectors: {
                      ...field.selectors,
                      by_index: typeof n === 'number' && !isNaN(n) ? n : undefined
                    }
                  });
                }}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
              />
            </div>
          </div>

          {(field.type === 'select' || field.type === 'radio') && (
            <ValueMapEditor
              valueMap={field.value_map || {}}
              onChange={(vm) => onChange({ value_map: vm })}
            />
          )}

          {field.type === 'date' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">date_config.variant</label>
                <select
                  value={field.date_config?.variant || 'text'}
                  onChange={(e) =>
                    onChange({
                      date_config: {
                        variant: e.target.value as 'masked_text' | 'text',
                        format: field.date_config?.format || 'DD/MM/YYYY'
                      }
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                >
                  <option value="text">text</option>
                  <option value="masked_text">masked_text</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">date_config.format</label>
                <input
                  type="text"
                  value={field.date_config?.format || ''}
                  onChange={(e) =>
                    onChange({
                      date_config: {
                        variant: field.date_config?.variant || 'text',
                        format: e.target.value
                      }
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                  placeholder="DD/MM/YYYY"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SelectorRow({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
        {label} <span className="font-normal lowercase text-slate-400">(comma-separated)</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
      />
    </div>
  );
}

function ValueMapEditor({
  valueMap,
  onChange
}: {
  valueMap: Record<string, string[]>;
  onChange: (vm: Record<string, string[]>) => void;
}) {
  const entries = Object.entries(valueMap);

  const updateKey = (oldKey: string, newKey: string) => {
    if (!newKey || newKey === oldKey) return;
    const next: Record<string, string[]> = {};
    for (const [k, v] of entries) next[k === oldKey ? newKey : k] = v;
    onChange(next);
  };

  const updateVariants = (key: string, raw: string) => {
    const arr = raw
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    onChange({ ...valueMap, [key]: arr });
  };

  const removeKey = (key: string) => {
    const next = { ...valueMap };
    delete next[key];
    onChange(next);
  };

  const addKey = () => {
    const next = { ...valueMap, [`Option${entries.length + 1}`]: [] };
    onChange(next);
  };

  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
        value_map <span className="font-normal lowercase text-slate-400">(canonical → portal labels)</span>
      </label>
      <div className="space-y-1">
        {entries.map(([k, variants]) => (
          <div key={k} className="flex items-center gap-1">
            <input
              type="text"
              defaultValue={k}
              onBlur={(e) => updateKey(k, e.target.value)}
              className="px-2 py-1 text-xs border border-slate-300 rounded font-mono w-32"
              placeholder="Canonical"
            />
            <span className="text-slate-400 text-xs">→</span>
            <input
              type="text"
              value={variants.join(', ')}
              onChange={(e) => updateVariants(k, e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded"
              placeholder="Variant 1, Variant 2"
            />
            <button onClick={() => removeKey(k)} className="text-red-600 hover:bg-red-50 p-1 rounded">
              <FiTrash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          onClick={addKey}
          className="text-xs text-[#341050] inline-flex items-center gap-1 hover:underline"
        >
          <FiPlus className="h-3 w-3" />
          Add canonical value
        </button>
      </div>
    </div>
  );
}
