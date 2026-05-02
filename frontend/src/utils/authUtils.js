/**
 * Indica se o objeto de usuário representa admin.
 * No backend MySQL, is_admin costuma vir como 1/0, não como boolean — evitar === true.
 */
export function isUserAdmin(u) {
  if (!u) return false
  if (u.role === 'admin') return true
  const v = u.is_admin !== undefined && u.is_admin !== null ? u.is_admin : u.isAdmin
  if (v === true || v === 1) return true
  if (v === '1') return true
  if (typeof v === 'string' && v.toLowerCase() === 'true') return true
  return false
}
