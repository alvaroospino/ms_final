export function formatExpirationDate(value: Date): string {
  return value.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}
