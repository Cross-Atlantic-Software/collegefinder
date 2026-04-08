/**
 * Resolver — resolves dot-notation paths like "student.full_name" or
 * "education.class_12.board" against the profile data object returned by the API.
 */

const Resolver = {
  /**
   * Resolve a dot-notation source path against the profile data.
   * @param {string} source  e.g. "student.full_name", "address.state"
   * @param {object} profile The full profile JSON from GET /api/extension/fill-profile
   * @returns {*} The resolved value, or undefined if path doesn't exist.
   */
  resolve(source, profile) {
    if (!source || !profile) return undefined;

    const parts = source.split('.');
    let current = profile;

    for (const part of parts) {
      if (current == null || typeof current !== 'object') return undefined;
      current = current[part];
    }

    return current;
  },

  /**
   * Check if a value is "truthy" enough to fill a form field.
   * Filters out empty strings, null, undefined — but keeps 0 and false.
   */
  hasValue(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  }
};

if (typeof window !== 'undefined') {
  window.ExamFillResolver = Resolver;
}
