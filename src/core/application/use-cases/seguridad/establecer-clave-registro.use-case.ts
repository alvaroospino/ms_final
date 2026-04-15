import { ValidationError } from "../errors/application-errors.js";
import { CodigoInvalidoError } from "../errors/verificacion-errors.js";
import { AuditoriaRepository } from "../../../domain/repositories/auditoria.repository.js";
import { PersonaRepository } from "../../../domain/repositories/persona.repository.js";
import { RegistroPendienteRepository } from "../../../domain/repositories/registro-pendiente.repository.js";
import { PasswordHasherService } from "../../../domain/services/password-hasher.service.js";
import { parseAccessIdentifier } from "../../../../shared/utils/access-identifier.js";

export interface EstablecerClaveRegistroInput {
  identificador: string;
  clave: string;
  ip?: string | null;
  agenteUsuario?: string | null;
}

export class EstablecerClaveRegistroUseCase {
  constructor(
    private readonly personaRepo: PersonaRepository,
    private readonly registroPendienteRepo: RegistroPendienteRepository,
    private readonly auditoriaRepo: AuditoriaRepository,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  async execute(input: EstablecerClaveRegistroInput) {
    let parsed;
    try {
      parsed = parseAccessIdentifier(input.identificador);
    } catch {
      throw new ValidationError([
        { field: "identificador", message: "Debes ingresar un correo o celular valido" },
      ]);
    }

    const clave = input.clave.trim();
    const issues = [];
    if (clave.length < 8) {
      issues.push({ field: "clave", message: "Debe tener al menos 8 caracteres" });
    }
    if (!/[A-Za-z]/.test(clave) || !/\d/.test(clave)) {
      issues.push({ field: "clave", message: "Debe contener al menos una letra y un numero" });
    }
    if (issues.length) throw new ValidationError(issues, "Los datos enviados no son validos");

    const registro = await this.registroPendienteRepo.findActivoByIdentificador(parsed.valor);
    if (!registro || !registro.verificado || registro.completado) {
      throw new CodigoInvalidoError("Debes verificar el codigo antes de establecer la clave");
    }
    if (registro.fechaExpiracion < new Date()) {
      throw new CodigoInvalidoError("El codigo ha expirado");
    }

    const hashClave = await this.passwordHasher.hash(clave);
    const result = await this.personaRepo.registrarLocalConIdentificador({
      tipoIdentificador: registro.tipoIdentificador,
      identificador: registro.identificador,
      hashClave,
    });

    await this.registroPendienteRepo.marcarCompletado(registro.id);

    await this.auditoriaRepo.registrar({
      idPersona: result.persona.id,
      idAutenticacion: result.autenticacion.id,
      evento: "registro_completado",
      ip: input.ip,
      agenteUsuario: input.agenteUsuario,
      detalle: {
        identificador: registro.identificador,
        tipoIdentificador: registro.tipoIdentificador,
      },
    });

    return result;
  }
}
