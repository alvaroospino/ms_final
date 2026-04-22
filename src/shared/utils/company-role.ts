function normalizeRole(role: string): string {
  return role.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

export function inferEsEmpresaFromRoles(roles: string[]): boolean {
  return roles.some((role) => normalizeRole(role).includes("empresa"));
}
