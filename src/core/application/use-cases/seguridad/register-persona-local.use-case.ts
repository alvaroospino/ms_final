import { PersonaAlreadyExistsError } from "../errors/persona-errors.js";
import { ValidationError } from "../errors/application-errors.js";
import {
  PersonaRepository,
  RegistroPersonaLocalResult,
} from "../../../domain/repositories/persona.repository.js";
import { PasswordHasherService } from "../../../domain/services/password-hasher.service.js";
import { CorreoElectronico } from "../../../domain/value-objects/correo-electronico.value-object.js";

export interface RegisterPersonaLocalInput {
  nombres: string;
  apellidos: string;
  correo: string;
  celular?: string | null;
  clave: string;
}

export class RegisterPersonaLocalUseCase {
  constructor(
    private readonly repository: PersonaRepository,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  async execute(input: RegisterPersonaLocalInput): Promise<RegistroPersonaLocalResult> {
    const nombres = input.nombres.trim();
    const apellidos = input.apellidos.trim();
    const correo = new CorreoElectronico(input.correo).toString();
    const celular = input.celular?.trim() ? input.celular.trim() : null;
    const clave = input.clave.trim();

    const issues = [];

    if (nombres.length < 2) {
      issues.push({
        field: "nombres",
        message: "Debe tener al menos 2 caracteres",
        received: input.nombres,
      });
    }

    if (apellidos.length < 2) {
      issues.push({
        field: "apellidos",
        message: "Debe tener al menos 2 caracteres",
        received: input.apellidos,
      });
    }

    if (celular && celular.length > 20) {
      issues.push({
        field: "celular",
        message: "No puede exceder 20 caracteres",
        received: input.celular,
      });
    }

    if (clave.length < 8) {
      issues.push({
        field: "clave",
        message: "Debe tener al menos 8 caracteres",
      });
    }

    if (!/[A-Za-z]/.test(clave) || !/\d/.test(clave)) {
      issues.push({
        field: "clave",
        message: "Debe contener al menos una letra y un n�mero",
      });
    }

    if (issues.length) {
      throw new ValidationError(issues, "Los datos de registro no son v�lidos");
    }

    const existing = await this.repository.findByCorreo(correo);

    if (existing) {
      throw new PersonaAlreadyExistsError();
    }

    const hashClave = await this.passwordHasher.hash(clave);

    return this.repository.registrarLocal({
      nombres,
      apellidos,
      correo,
      celular,
      hashClave,
    });
  }
}
