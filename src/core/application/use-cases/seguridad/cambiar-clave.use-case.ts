import { ValidationError } from "../errors/application-errors.js";
import { InvalidCredentialsError, InvalidTokenError } from "../errors/auth-errors.js";
import { PersonaRepository } from "../../../domain/repositories/persona.repository.js";
import { AuditoriaRepository } from "../../../domain/repositories/auditoria.repository.js";
import { PasswordHasherService } from "../../../domain/services/password-hasher.service.js";
import { PasswordVerifierService } from "../../../domain/services/password-verifier.service.js";

export interface CambiarClaveInput {
  idAutenticacion: string;
  idPersona: string;
  claveActual: string;
  nuevaClave: string;
  ip?: string | null;
  agenteUsuario?: string | null;
}

export class CambiarClaveUseCase {
  constructor(
    private readonly personaRepo: PersonaRepository,
    private readonly auditoriaRepo: AuditoriaRepository,
    private readonly passwordHasher: PasswordHasherService,
    private readonly passwordVerifier: PasswordVerifierService,
  ) {}

  async execute(input: CambiarClaveInput): Promise<{ success: true }> {
    const issues = [];
    const nuevaClave = input.nuevaClave.trim();
    const claveActual = input.claveActual.trim();

    if (!claveActual) issues.push({ field: "claveActual", message: "La clave actual es obligatoria" });
    if (nuevaClave.length < 8) issues.push({ field: "nuevaClave", message: "Debe tener al menos 8 caracteres" });
    if (!/[A-Za-z]/.test(nuevaClave) || !/\d/.test(nuevaClave)) {
      issues.push({ field: "nuevaClave", message: "Debe contener al menos una letra y un n�mero" });
    }
    if (claveActual === nuevaClave) {
      issues.push({ field: "nuevaClave", message: "La nueva clave no puede ser igual a la actual" });
    }
    if (issues.length) throw new ValidationError(issues);

    const auth = await this.personaRepo.findAutenticacionById(input.idAutenticacion);
    if (!auth) throw new InvalidTokenError("Autenticaci�n no encontrada");

    const claveValida = await this.passwordVerifier.verify(claveActual, auth.hashClave);
    if (!claveValida) throw new InvalidCredentialsError("La clave actual es incorrecta");

    const hashClave = await this.passwordHasher.hash(nuevaClave);
    await this.personaRepo.cambiarClave(input.idAutenticacion, hashClave);

    await this.auditoriaRepo.registrar({
      idPersona: input.idPersona,
      idAutenticacion: input.idAutenticacion,
      evento: "cambio_clave",
      ip: input.ip,
      agenteUsuario: input.agenteUsuario,
      detalle: { metodo: "cambio_voluntario" },
    });

    return { success: true };
  }
}
