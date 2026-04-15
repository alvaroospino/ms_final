import { PersonaResponseDto } from "./persona.response.dto.js";

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
