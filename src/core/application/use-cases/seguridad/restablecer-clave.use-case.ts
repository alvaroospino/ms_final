import { createHash } from "node:crypto";
import { ValidationError } from "@/core/application/use-cases/errors/application-errors.js";
import {
  CodigoAgotadoError,
  CodigoInvalidoError,
} from "@/core/application/use-cases/errors/verificacion-errors.js";
import { PersonaRepository } from "@/core/domain/repositories/persona.repository.js";
import { CodigoVerificacionRepository } from "@/core/domain/repositories/codigo-verificacion.repository.js";
import { AuditoriaRepository } from "@/core/domain/repositories/auditoria.repository.js";
import { PasswordHasherService } from "@/core/domain/services/password-hasher.service.js";
import { CorreoElectronico } from "@/core/domain/value-objects/correo-electronico.value-object.js";

export interface RestablecerClaveInput {
  correo: string;
  codigo: string;
  nuevaClave: string;
  ip?: string | null;
  agenteUsuario?: string | null;
}

const MAX_INTENTOS = 5;

export class RestablecerClaveUseCase {
  constructor(
    private readonly personaRepo: PersonaRepository,
    private readonly codigoRepo: CodigoVerificacionRepository,
    private readonly auditoriaRepo: AuditoriaRepository,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  async execute(input: RestablecerClaveInput): Promise<{ success: true }> {
    const issues = [];

    let correo: string;
    try {
      correo = new CorreoElectronico(input.correo).toString();
    } catch {
      issues.push({ field: "correo", message: "Correo inválido" });
    }

    const nuevaClave = input.nuevaClave.trim();
    if (nuevaClave.length < 8) {
      issues.push({ field: "nuevaClave", message: "Debe tener al menos 8 caracteres" });
    }
    if (!/[A-Za-z]/.test(nuevaClave) || !/\d/.test(nuevaClave)) {
      issues.push({ field: "nuevaClave", message: "Debe contener al menos una letra y un número" });
    }
    if (!input.codigo?.trim()) {
      issues.push({ field: "codigo", message: "El código es obligatorio" });
    }

    if (issues.length) throw new ValidationError(issues);

    const auth = await this.personaRepo.findAutenticacionLocalByCorreo(correo!);
    if (!auth) throw new CodigoInvalidoError("Código inválido o expirado");

    const registro = await this.codigoRepo.findCodigoActivoByAutenticacionAndTipo(
      auth.id,
      "recuperacion_clave",
    );

    if (!registro) throw new CodigoInvalidoError();

    if (registro.fechaExpiracion < new Date()) {
      throw new CodigoInvalidoError("El código ha expirado");
    }

    if (registro.intentos >= MAX_INTENTOS) {
      throw new CodigoAgotadoError();
    }

    const hashIngresado = createHash("sha256").update(input.codigo.trim()).digest("hex");

    if (hashIngresado !== registro.hashCodigo) {
      await this.codigoRepo.incrementarIntentosCodigo(registro.id);
      throw new CodigoInvalidoError("Código incorrecto");
    }

    const hashClave = await this.passwordHasher.hash(nuevaClave);

    await this.codigoRepo.marcarCodigoUsado(registro.id);
    await this.personaRepo.cambiarClave(auth.id, hashClave);

    await this.auditoriaRepo.registrar({
      idPersona: auth.idPersona,
      idAutenticacion: auth.id,
      evento: "cambio_clave",
      ip: input.ip,
      agenteUsuario: input.agenteUsuario,
      detalle: { metodo: "recuperacion_con_codigo" },
    });

    return { success: true };
  }
}
