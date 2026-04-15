import { TipoIdentificadorAcceso } from "../../core/domain/repositories/registro-pendiente.repository.js";
import { CorreoElectronico } from "../../core/domain/value-objects/correo-electronico.value-object.js";

export interface AccessIdentifier {
  tipo: TipoIdentificadorAcceso;
  valor: string;
}

export function parseAccessIdentifier(rawValue: string): AccessIdentifier {
  const value = rawValue.trim();

  if (!value) {
    throw new Error("El identificador es obligatorio");
  }

  try {
    return {
      tipo: "correo",
      valor: new CorreoElectronico(value).toString(),
    };
  } catch {
    return {
      tipo: "celular",
      valor: normalizePhoneNumber(value),
    };
  }
}

export function normalizePhoneNumber(rawValue: string): string {
  const compact = rawValue.replace(/[\s\-().]/g, "");
  const normalized = compact.startsWith("+")
    ? `+${compact.slice(1).replace(/\D/g, "")}`
    : compact.replace(/\D/g, "");
  const digits = normalized.startsWith("+") ? normalized.slice(1) : normalized;

  if (!/^\d{8,15}$/.test(digits)) {
    throw new Error("El celular debe tener entre 8 y 15 digitos");
  }

  return normalized.startsWith("+") ? normalized : `+${normalized}`;
}
