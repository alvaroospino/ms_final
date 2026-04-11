import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      sub: string;
      authId: string;
      identificador: string;
      tipoIdentificador: "correo" | "celular";
      correo: string | null;
      roles: string[];
      permisos: string[];
    };
  }
}
