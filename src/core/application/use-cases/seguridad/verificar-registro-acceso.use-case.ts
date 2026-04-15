import { createHash } from "node:crypto";

import { ValidationError } from "../errors/application-errors.js";
import {
  CodigoAgotadoError,
  CodigoInvalidoError,
} from "../errors/verificacion-errors.js";
import { AuditoriaRepository } from "../../../domain/repositories/auditoria.repository.js";
import { RegistroPendienteRepository } from "../../../domain/repositories/registro-pendiente.repository.js";
import { parseAccessIdentifier } from "../../../../shared/utils/access-identifier.js";

export interface VerificarRegistroAccesoInput {
  identificador: string;
  codigo: string;
  ip?: string | null;
  agenteUsuario?: string | null;
}

const MAX_INTENTOS = 5;

export class VerificarRegistroAccesoUseCase {
  constructor(
    private readonly registroPendienteRepo: RegistroPendienteRepository,
    private readonly auditoriaRepo: AuditoriaRepository,
  ) {}

  async execute(input: VerificarRegistroAccesoInput): Promise<{ success: true }> {
    let identificador: string;
    try {
      identificador = parseAccessIdentifier(input.identificador).valor;
    } catch {
      throw new ValidationError([
        { field: "identificador", message: "Debes ingresar un correo o celular valido" },
      ]);
    }

    const codigo = input.codigo.trim();
    if (!codigo) {
      throw new ValidationError([{ field: "codigo", message: "El codigo es obligatorio" }]);
    }

    const registro = await this.registroPendienteRepo.findActivoByIdentificador(identificador);
    if (!registro || registro.completado) throw new CodigoInvalidoError();
    if (registro.fechaExpiracion < new Date()) throw new CodigoInvalidoError("El codigo ha expirado");
    if (registro.intentos >= MAX_INTENTOS) throw new CodigoAgotadoError();

    const hashIngresado = createHash("sha256").update(codigo).digest("hex");
    if (hashIngresado !== registro.hashCodigo) {
      await this.registroPendienteRepo.incrementarIntentos(registro.id);
      throw new CodigoInvalidoError("Codigo incorrecto");
    }

    await this.registroPendienteRepo.marcarVerificado(registro.id);

    await this.auditoriaRepo.registrar({
      evento: "registro_verificado",
      ip: input.ip,
      agenteUsuario: input.agenteUsuario,
      detalle: {
        identificador,
        tipoIdentificador: registro.tipoIdentificador,
      },
    });

    return { success: true };
  }
}
