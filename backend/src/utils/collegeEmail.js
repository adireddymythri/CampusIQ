function isAllowedCollegeEmail(email, allowlist) {
  const e = String(email).trim().toLowerCase()
  const at = e.lastIndexOf('@')
  if (at === -1) return false
  const domain = e.slice(at + 1)
  if (!domain) return false

  // Accept common college domains globally.
  if (domain.endsWith('.edu') || domain.endsWith('.edu.in')) return true
  if (Array.isArray(allowlist) && allowlist.length > 0) {
    return allowlist.includes(domain)
  }
  // If no allowlist provided, allow common education TLDs only.
  return false
}

module.exports = { isAllowedCollegeEmail }

