import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import Fastify, { FastifyInstance } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { ZodError } from "zod";

import {
  DatabaseError,
  ExternalServiceError,
  ValidationError,
} from "@/core/application/use-cases/errors/application-errors.js";
import {
  AccountBlockedError,
  ForbiddenError,
  InvalidCredentialsError,
  InvalidTokenError,
} from "@/core/application/use-cases/errors/auth-errors.js";
import { PersonaAlreadyExistsError } from "@/core/application/use-cases/errors/persona-errors.js";
import {
  CodigoAgotadoError,
  CodigoInvalidoError,
  CorreoYaVerificadoError,
} from "@/core/application/use-cases/errors/verificacion-errors.js";
import { PersonasRoutes } from "@/modules/seguridad/infrastructure/interface/http/routes/personas.routes.js";
import { AccessControlRoutes } from "@/modules/seguridad/infrastructure/interface/http/routes/access-control.routes.js";
import {
  DuplicateAssignmentError,
  DuplicateCodeError,
  EntityNotFoundError,
} from "@/core/application/use-cases/errors/access-control-errors.js";

export async function createServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, { origin: true });
  await app.register(sensible);

  app.get("/health", async () => ({
    ok: true,
    service: "microservicio-seguridad",
    timestamp: new Date().toISOString(),
  }));

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: "RequestValidationError",
        message: "El cuerpo de la solicitud no es válido",
        issues: error.issues,
      });
    }

    if ((error as { validation?: unknown }).validation) {
      return reply.status(400).send({
        error: "RequestValidationError",
        message: "El cuerpo de la solicitud no es válido",
        issues: (error as { validation: unknown }).validation,
      });
    }

    if (error instanceof ValidationError) {
      return reply.status(400).send({
        error: error.name,
        message: error.message,
        issues: error.issues,
      });
    }

    if (error instanceof CodigoInvalidoError) {
      return reply.status(400).send({ error: error.name, message: error.message });
    }

    if (error instanceof CodigoAgotadoError) {
      return reply.status(429).send({ error: error.name, message: error.message });
    }

    if (error instanceof CorreoYaVerificadoError) {
      return reply.status(409).send({ error: error.name, message: error.message });
    }

    if (
      error instanceof PersonaAlreadyExistsError ||
      error.message === "Ya existe una cuenta registrada con ese identificador"
    ) {
      return reply.status(409).send({
        error: "PersonaAlreadyExistsError",
        message: "Ya existe una cuenta registrada con ese identificador",
      });
    }

    if (error instanceof InvalidCredentialsError) {
      return reply.status(401).send({ error: error.name, message: error.message });
    }

    if (error instanceof InvalidTokenError) {
      return reply.status(401).send({ error: error.name, message: error.message });
    }

    if (error instanceof AccountBlockedError) {
      return reply.status(423).send({
        error: error.name,
        message: error.message,
        blockedUntil: error.blockedUntil.toISOString(),
      });
    }

    if (error instanceof ForbiddenError) {
      return reply.status(403).send({ error: error.name, message: error.message });
    }

    if (error instanceof EntityNotFoundError) {
      return reply.status(404).send({ error: error.name, message: error.message });
    }

    if (error instanceof DuplicateAssignmentError || error instanceof DuplicateCodeError) {
      return reply.status(409).send({ error: error.name, message: error.message });
    }

    if (error instanceof DatabaseError) {
      return reply.status(500).send({ error: error.name, message: error.message });
    }

    if (error instanceof ExternalServiceError) {
      return reply.status(502).send({ error: error.name, message: error.message });
    }

    return reply.status(500).send({
      error: "InternalServerError",
      message: "Ocurrió un error inesperado",
    });
  });

  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: "NotFound",
      message: `Ruta ${request.method} ${request.url} no encontrada`,
    });
  });

  await app.register(PersonasRoutes);
  await app.register(AccessControlRoutes);

  return app;
}
