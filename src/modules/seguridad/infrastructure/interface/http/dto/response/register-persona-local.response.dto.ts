import { PersonaResponseDto } from "@/modules/seguridad/infrastructure/interface/http/dto/response/persona.response.dto.js";

export interface RegisterPersonaLocalResponseDto {
  persona: PersonaResponseDto;
  autenticacion: {
    id: string;
    proveedor: "local";
    tipoIdentificador?: "correo" | "celular";
    identificador?: string;
    verificado: boolean;
    estado: number;
    requiereCambioClave: boolean;
  };
}
