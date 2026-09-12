/**
 * @param {Error} error
 * @returns {boolean}
 */
export function isAlterPermissionDenied(error) {
  return "code" in error && String(error.code) === "42501";
}
