import { Persona } from "../entities/persona.entity.js";
import { TipoIdentificadorAcceso } from "./registro-pendiente.repository.js";

export interface RegistrarPersonaLocalParams {
  nombres: string;
  apellidos: string;
  correo: string;
  celular?: string | null;
  hashClave: string;
}

export interface RegistrarPersonaAccesoParams {
  tipoIdentificador: TipoIdentificadorAcceso;
  identificador: string;
  hashClave: string;
}

export interface RegistroPersonaLocalResult {
  persona: Persona;
  autenticacion: {
    id: string;
    proveedor: "local";
    tipoIdentificador?: TipoIdentificadorAcceso;
    identificador?: string;
    verificado: boolean;
    estado: number;
    requiereCambioClave: boolean;
  };
}

export interface AutenticacionLocalRecord {
  id: string;
  idPersona: string;
  tipoIdentificador: TipoIdentificadorAcceso;
  identificador: string;
  correo: string | null;
  hashClave: string;
  verificado: boolean;
  estado: number;
  intentosFallidos: number;
  bloqueadoHasta: Date | null;
  ultimoIngreso: Date | null;
  persona: Persona;
}

export interface RegistrarIngresoParams {
  idAutenticacion: string | null;
  resultado: number;
  ip?: string | null;
  agenteUsuario?: string | null;
  dispositivo?: string | null;
}

export interface RegistrarIngresoResult {
  idIngreso: number;
  fechaInicio: Date;
}

export interface GuardarRefreshTokenParams {
  idIngreso: number;
  tokenHash: string;
}

export interface PersonaRepository {
  findAll(): Promise<Persona[]>;
  count(): Promise<number>;
  findByCorreo(correo: string): Promise<Persona | null>;
  findByIdentificador(identificador: string): Promise<AutenticacionLocalRecord | null>;
  registrarLocal(params: RegistrarPersonaLocalParams): Promise<RegistroPersonaLocalResult>;
  registrarLocalConIdentificador(
    params: RegistrarPersonaAccesoParams,
  ): Promise<RegistroPersonaLocalResult>;

  findAutenticacionLocalByCorreo(correo: string): Promise<AutenticacionLocalRecord | null>;
  findAutenticacionLocalByIdentificador(
    identificador: string,
  ): Promise<AutenticacionLocalRecord | null>;
  findAutenticacionById(idAutenticacion: string): Promise<AutenticacionLocalRecord | null>;
  findAutenticacionByPersonaId(idPersona: string): Promise<AutenticacionLocalRecord | null>;
  incrementarIntentosFallidos(idAutenticacion: string): Promise<number>;
  reiniciarIntentosFallidosYActualizarIngreso(idAutenticacion: string): Promise<void>;
  bloquearAutenticacion(idAutenticacion: string, bloqueadoHasta: Date): Promise<void>;
  marcarCorreoVerificado(idAutenticacion: string): Promise<void>;
  cambiarClave(idAutenticacion: string, hashClave: string): Promise<void>;
  registrarIngreso(params: RegistrarIngresoParams): Promise<RegistrarIngresoResult>;
  guardarRefreshToken(params: GuardarRefreshTokenParams): Promise<void>;
  findRefreshTokenSessionByHash(tokenHash: string): Promise<RefreshTokenSessionRecord | null>;
  revocarRefreshToken(params: RevocarRefreshTokenParams): Promise<void>;
  revocarTodosLosRefreshTokens(idPersona: string): Promise<void>;
  cerrarIngreso(idIngreso: number): Promise<void>;
  cerrarTodosLosIngresos(idPersona: string): Promise<void>;
  findRolesByPersonaId(idPersona: string): Promise<RolRecord[]>;
  findPermisosByPersonaId(idPersona: string): Promise<PermisoRecord[]>;
  findSessionsByPersonaId(idPersona: string): Promise<SessionRecord[]>;
  findSessionByIdAndPersonaId(idIngreso: number, idPersona: string): Promise<SessionDetailRecord | null>;
}

export interface RefreshTokenSessionRecord {
  idToken: number;
  idIngreso: number;
  idAutenticacion: string;
  idPersona: string;
  correo: string | null;
  estadoToken: number;
  fechaRevocacion: Date | null;
  persona: Persona;
  tipoIdentificador: TipoIdentificadorAcceso;
  identificador: string;
}

export interface RevocarRefreshTokenParams {
  idToken: number;
}

export interface RolRecord {
  id: string;
  nombre: string;
}

export interface PermisoRecord {
  id: string;
  nombre: string;
}

export interface SessionRecord {
  idIngreso: number;
  idAutenticacion: string | null;
  resultado: number;
  ip: string | null;
  agenteUsuario: string | null;
  dispositivo: string | null;
  fechaInicio: Date;
  fechaFin: Date | null;
  activa: boolean;
}

export interface SessionDetailRecord extends SessionRecord {
  idPersona: string;
  correo: string | null;
}
