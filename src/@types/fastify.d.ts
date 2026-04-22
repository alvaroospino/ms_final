import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      sub: string;
      authId: string;
      uuidAcceso: string;
      identificador: string;
      tipoIdentificador: "correo" | "celular";
      correo: string | null;
      nombres: string | null;
      apellidos: string | null;
      nombreCompleto: string | null;
      estado: number;
      activa: boolean;
      esEmpresa: boolean;
      roles: string[];
      permisos: string[];
      expiraEn?: number;
    };
  }
}
