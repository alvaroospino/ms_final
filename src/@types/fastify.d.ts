import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      sub: string;
      authId: string;
      correo: string;
      roles: string[];
      permisos: string[];
    };
  }
}