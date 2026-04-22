import { appImageService } from "../assets/app-image.service.js";

export interface ApiResponse<T> {
  codigoEstado: number;
  mensaje: string;
  datos: T;
  fechaHora: string;
}

export function buildSuccessResponse<T>(
  codigoEstado: number,
  mensaje: string,
  datos: T,
): ApiResponse<T> {
  return {
    codigoEstado,
    mensaje,
    datos,
    fechaHora: new Date().toISOString(),
  };
}

interface AuthResponseInput {
  tokenApp: string;
  refreshToken: string;
  expiraEn: number;
  refreshExpiraEn: number;
  esEmpresa: boolean;
}

export async function buildAuthSuccessResponse(
  codigoEstado: number,
  mensaje: string,
  auth: AuthResponseInput,
): Promise<ApiResponse<AuthResponseInput & { fotoApp: string | null }>> {
  const fotoApp = await appImageService.getAuthImageBase64(auth.esEmpresa);

  return buildSuccessResponse(codigoEstado, mensaje, {
    tokenApp: auth.tokenApp,
    refreshToken: auth.refreshToken,
    fotoApp,
    expiraEn: auth.expiraEn,
    refreshExpiraEn: auth.refreshExpiraEn,
    esEmpresa: auth.esEmpresa,
  });
}
