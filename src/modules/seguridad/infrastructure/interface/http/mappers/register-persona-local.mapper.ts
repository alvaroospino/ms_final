import { RegistroPersonaLocalResult } from "@/core/domain/repositories/persona.repository.js";
import { RegisterPersonaLocalResponseDto } from "@/modules/seguridad/infrastructure/interface/http/dto/response/register-persona-local.response.dto.js";
import { PersonaMapper } from "@/modules/seguridad/infrastructure/interface/http/mappers/persona.mapper.js";

export class RegisterPersonaLocalMapper {
  static toResponse(result: RegistroPersonaLocalResult): RegisterPersonaLocalResponseDto {
    return {
      persona: PersonaMapper.toResponse(result.persona),
      autenticacion: result.autenticacion,
    };
  }
}