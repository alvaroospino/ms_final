import { FastifyReply, FastifyRequest } from "fastify";

import { CountPersonasUseCase } from "../../../../../../core/application/use-cases/personas/count-personas.use-case.js";
import { GetAllPersonasUseCase } from "../../../../../../core/application/use-cases/personas/get-all-personas.use-case.js";
import { GetPersonaByIdUseCase } from "../../../../../../core/application/use-cases/personas/get-persona-by-id.use-case.js";
import { CambiarClaveUseCase } from "../../../../../../core/application/use-cases/seguridad/cambiar-clave.use-case.js";
import { ConfirmarVerificacionCorreoUseCase } from "../../../../../../core/application/use-cases/seguridad/confirmar-verificacion-correo.use-case.js";
import { EnviarVerificacionCorreoUseCase } from "../../../../../../core/application/use-cases/seguridad/enviar-verificacion-correo.use-case.js";
import { EstablecerClaveRegistroUseCase } from "../../../../../../core/application/use-cases/seguridad/establecer-clave-registro.use-case.js";
import { GetMySessionDetailUseCase } from "../../../../../../core/application/use-cases/seguridad/get-my-session-detail.use-case.js";
import { GetMySessionsUseCase } from "../../../../../../core/application/use-cases/seguridad/get-my-sessions.use-case.js";
import { IniciarRegistroAccesoUseCase } from "../../../../../../core/application/use-cases/seguridad/iniciar-registro-acceso.use-case.js";
import { LoginPersonaLocalUseCase } from "../../../../../../core/application/use-cases/seguridad/login-persona-local.use-case.js";
import { SolicitarCodigoLoginUseCase } from "../../../../../../core/application/use-cases/seguridad/solicitar-codigo-login.use-case.js";
import { VerificarCodigoLoginUseCase } from "../../../../../../core/application/use-cases/seguridad/verificar-codigo-login.use-case.js";
import { LogoutGlobalUseCase } from "../../../../../../core/application/use-cases/seguridad/logout-global.use-case.js";
import { LogoutUseCase } from "../../../../../../core/application/use-cases/seguridad/logout.use-case.js";
import { RefreshTokenUseCase } from "../../../../../../core/application/use-cases/seguridad/refresh-token.use-case.js";
import { RestablecerClaveUseCase } from "../../../../../../core/application/use-cases/seguridad/restablecer-clave.use-case.js";
import { SolicitarRecuperacionClaveUseCase } from "../../../../../../core/application/use-cases/seguridad/solicitar-recuperacion-clave.use-case.js";
import { VerificarRegistroAccesoUseCase } from "../../../../../../core/application/use-cases/seguridad/verificar-registro-acceso.use-case.js";
import { AuditoriaDrizzleRepository } from "../../../drizzle/repositories/auditoria.drizzle-repository.js";
import { CodigoVerificacionDrizzleRepository } from "../../../drizzle/repositories/codigo-verificacion.drizzle-repository.js";
import { PersonaDrizzleRepository } from "../../../drizzle/repositories/persona.drizzle-repository.js";
import { RegistroPendienteDrizzleRepository } from "../../../drizzle/repositories/registro-pendiente.drizzle-repository.js";
import { CambiarClaveRequestDto } from "../dto/request/cambiar-clave.request.dto.js";
import { ConfirmarVerificacionCorreoRequestDto } from "../dto/request/confirmar-verificacion-correo.request.dto.js";
import { EstablecerClaveRegistroRequestDto } from "../dto/request/establecer-clave-registro.request.dto.js";
import { IniciarRegistroRequestDto } from "../dto/request/iniciar-registro.request.dto.js";
import { LoginPersonaLocalRequestDto } from "../dto/request/login-persona-local.request.dto.js";
import { SolicitarCodigoLoginRequestDto } from "../dto/request/solicitar-codigo-login.request.dto.js";
import { VerificarCodigoLoginRequestDto } from "../dto/request/verificar-codigo-login.request.dto.js";
import { LogoutRequestDto } from "../dto/request/logout.request.dto.js";
import { RefreshTokenRequestDto } from "../dto/request/refresh-token.request.dto.js";
import { RestablecerClaveRequestDto } from "../dto/request/restablecer-clave.request.dto.js";
import { SolicitarRecuperacionClaveRequestDto } from "../dto/request/solicitar-recuperacion-clave.request.dto.js";
import { VerificarRegistroRequestDto } from "../dto/request/verificar-registro.request.dto.js";
import { PersonaMapper } from "../mappers/persona.mapper.js";
import { RegisterPersonaLocalMapper } from "../mappers/register-persona-local.mapper.js";
import { emailConfig, queueConfig, smsConfig } from "../../../../../../shared/config/database.config.js";
import { InMemoryEmailQueueService } from "../../../../../../shared/email/in-memory-email-queue.service.js";
import { NodemailerEmailService } from "../../../../../../shared/email/nodemailer-email.service.js";
import { HttpEmailService } from "../../../../../../shared/email/http-email.service.js";
import { HttpSmsService, NoopSmsService } from "../../../../../../shared/notifications/http-sms.service.js";
import { JoseJwtService } from "../../../../../../shared/security/jwt.service.js";
import { JwtRefreshTokenService } from "../../../../../../shared/security/refresh-token.service.js";
import { PasswordHasher } from "../../../../../../shared/utils/password-hasher.js";
import { buildAuthSuccessResponse } from "../../../../../../shared/http/api-response.js";

export class PersonaController {
  private readonly personaRepo = new PersonaDrizzleRepository();
  private readonly codigoRepo = new CodigoVerificacionDrizzleRepository();
  private readonly auditoriaRepo = new AuditoriaDrizzleRepository();
  private readonly registroPendienteRepo = new RegistroPendienteDrizzleRepository();
  private readonly emailService = createEmailService();
  private readonly emailQueue = createEmailQueueService(this.emailService);
  private readonly smsService = createSmsService();

  private readonly getAllPersonasUseCase = new GetAllPersonasUseCase(this.personaRepo);
  private readonly countPersonasUseCase = new CountPersonasUseCase(this.personaRepo);
  private readonly getPersonaByIdUseCase = new GetPersonaByIdUseCase(this.personaRepo);

  private readonly iniciarRegistroAccesoUseCase = new IniciarRegistroAccesoUseCase(
    this.personaRepo,
    this.registroPendienteRepo,
    this.auditoriaRepo,
    this.emailQueue,
    this.smsService,
  );

  private readonly verificarRegistroAccesoUseCase = new VerificarRegistroAccesoUseCase(
    this.registroPendienteRepo,
    this.auditoriaRepo,
  );

  private readonly establecerClaveRegistroUseCase = new EstablecerClaveRegistroUseCase(
    this.personaRepo,
    this.registroPendienteRepo,
    this.auditoriaRepo,
    new PasswordHasher(),
  );

  private readonly loginPersonaLocalUseCase = new LoginPersonaLocalUseCase(
    this.personaRepo,
    new PasswordHasher(),
    new JoseJwtService(),
    new JwtRefreshTokenService(),
    this.auditoriaRepo,
  );

  private readonly solicitarCodigoLoginUseCase = new SolicitarCodigoLoginUseCase(
    this.personaRepo,
    this.codigoRepo,
    this.auditoriaRepo,
    this.emailQueue,
    this.smsService,
  );

  private readonly verificarCodigoLoginUseCase = new VerificarCodigoLoginUseCase(
    this.personaRepo,
    this.codigoRepo,
    this.auditoriaRepo,
    new JoseJwtService(),
    new JwtRefreshTokenService(),
  );

  private readonly refreshTokenUseCase = new RefreshTokenUseCase(
    this.personaRepo,
    new JoseJwtService(),
    new JwtRefreshTokenService(),
  );

  private readonly logoutUseCase = new LogoutUseCase(
    this.personaRepo,
    new JwtRefreshTokenService(),
    this.auditoriaRepo,
  );

  private readonly logoutGlobalUseCase = new LogoutGlobalUseCase(this.personaRepo, this.auditoriaRepo);
  private readonly getMySessionsUseCase = new GetMySessionsUseCase(this.personaRepo);
  private readonly getMySessionDetailUseCase = new GetMySessionDetailUseCase(this.personaRepo);

  private readonly enviarVerificacionCorreoUseCase = new EnviarVerificacionCorreoUseCase(
    this.personaRepo,
    this.codigoRepo,
    this.auditoriaRepo,
    this.emailQueue,
  );

  private readonly confirmarVerificacionCorreoUseCase = new ConfirmarVerificacionCorreoUseCase(
    this.personaRepo,
    this.codigoRepo,
    this.auditoriaRepo,
  );

  private readonly solicitarRecuperacionClaveUseCase = new SolicitarRecuperacionClaveUseCase(
    this.personaRepo,
    this.codigoRepo,
    this.auditoriaRepo,
    this.emailQueue,
  );

  private readonly restablecerClaveUseCase = new RestablecerClaveUseCase(
    this.personaRepo,
    this.codigoRepo,
    this.auditoriaRepo,
    new PasswordHasher(),
  );

  private readonly cambiarClaveUseCase = new CambiarClaveUseCase(
    this.personaRepo,
    this.auditoriaRepo,
    new PasswordHasher(),
    new PasswordHasher(),
  );

  getAll = async (_request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const personas = await this.getAllPersonasUseCase.execute();
    return reply.status(200).send({
      data: personas.map(PersonaMapper.toResponse),
      total: personas.length,
    });
  };

  count = async (_request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const total = await this.countPersonasUseCase.execute();
    return reply.status(200).send({ total });
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const params = request.params as { id: string };
    const result = await this.getPersonaByIdUseCase.execute(params.id);
    return reply.status(200).send({ message: "Persona consultada correctamente", data: result });
  };

  iniciarRegistro = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const body = request.body as IniciarRegistroRequestDto;
    const result = await this.iniciarRegistroAccesoUseCase.execute({
      identificador: body.identificador,
      ip: request.ip,
      agenteUsuario: request.headers["user-agent"] ?? null,
    });
    return reply.status(200).send({ message: result.mensaje, data: result });
  };

  verificarRegistro = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const body = request.body as VerificarRegistroRequestDto;
    await this.verificarRegistroAccesoUseCase.execute({
      identificador: body.identificador,
      codigo: body.codigo,
      ip: request.ip,
      agenteUsuario: request.headers["user-agent"] ?? null,
    });
    return reply.status(200).send({ message: "Codigo verificado correctamente", data: { success: true } });
  };

  establecerClaveRegistro = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const body = request.body as EstablecerClaveRegistroRequestDto;
    const result = await this.establecerClaveRegistroUseCase.execute({
      identificador: body.identificador,
      clave: body.clave,
      ip: request.ip,
      agenteUsuario: request.headers["user-agent"] ?? null,
    });

    return reply.status(201).send({
      message: "Cuenta registrada correctamente",
      data: RegisterPersonaLocalMapper.toResponse(result),
    });
  };

  loginLocal = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const body = request.body as LoginPersonaLocalRequestDto;
    const result = await this.loginPersonaLocalUseCase.execute({
      ...body,
      ip: request.ip,
      agenteUsuario: request.headers["user-agent"] ?? null,
      dispositivo: null,
    });
    return reply.status(200).send(
      await buildAuthSuccessResponse(200, "Autenticacion exitosa", {
        tokenApp: result.tokenApp,
        refreshToken: result.refreshToken,
        expiraEn: result.expiraEn,
        refreshExpiraEn: result.refreshExpiraEn,
        esEmpresa: result.esEmpresa,
      }),
    );
  };

  solicitarCodigoLogin = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const body = request.body as SolicitarCodigoLoginRequestDto;
    const result = await this.solicitarCodigoLoginUseCase.execute({
      identificador: body.identificador,
      ip: request.ip,
      agenteUsuario: request.headers["user-agent"] ?? null,
    });
    return reply.status(200).send({ message: result.mensaje, data: result });
  };

  verificarCodigoLogin = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const body = request.body as VerificarCodigoLoginRequestDto;
    const result = await this.verificarCodigoLoginUseCase.execute({
      ...body,
      ip: request.ip,
      agenteUsuario: request.headers["user-agent"] ?? null,
      dispositivo: null,
    });
    return reply.status(200).send(
      await buildAuthSuccessResponse(200, "Autenticacion exitosa", {
        tokenApp: result.tokenApp,
        refreshToken: result.refreshToken,
        expiraEn: result.expiraEn,
        refreshExpiraEn: result.refreshExpiraEn,
        esEmpresa: result.esEmpresa,
      }),
    );
  };

  refreshToken = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const body = request.body as RefreshTokenRequestDto;
    const result = await this.refreshTokenUseCase.execute(body);
    return reply.status(200).send(
      await buildAuthSuccessResponse(200, "Token refrescado correctamente", {
        tokenApp: result.tokenApp,
        refreshToken: result.refreshToken,
        expiraEn: result.expiraEn,
        refreshExpiraEn: result.refreshExpiraEn,
        esEmpresa: result.esEmpresa,
      }),
    );
  };

  logout = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const body = request.body as LogoutRequestDto;
    await this.logoutUseCase.execute({
      ...body,
      ip: request.ip,
      agenteUsuario: request.headers["user-agent"] ?? null,
    });
    return reply.status(200).send({ message: "Sesion cerrada correctamente", data: { success: true } });
  };

  logoutGlobal = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    if (!request.user) {
      return reply.status(401).send({ error: "InvalidTokenError", message: "Usuario no autenticado" });
    }

    const result = await this.logoutGlobalUseCase.execute({
      idPersona: request.user.sub,
      idAutenticacion: request.user.authId,
      ip: request.ip,
      agenteUsuario: request.headers["user-agent"] ?? null,
    });

    return reply.status(200).send({
      message: "Todas las sesiones cerradas correctamente",
      data: result,
    });
  };

  me = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    if (!request.user) {
      return reply.status(401).send({ error: "InvalidTokenError", message: "Usuario no autenticado" });
    }

    return reply.status(200).send({
      message: "Usuario autenticado",
      data: {
        id: request.user.sub,
        authId: request.user.authId,
        uuidAcceso: request.user.uuidAcceso,
        identificador: request.user.identificador,
        tipoIdentificador: request.user.tipoIdentificador,
        correo: request.user.correo,
        nombres: request.user.nombres,
        apellidos: request.user.apellidos,
        nombreCompleto: request.user.nombreCompleto,
        estado: request.user.estado,
        activa: request.user.activa,
        esEmpresa: request.user.esEmpresa,
        roles: request.user.roles,
        permisos: request.user.permisos,
        expiraEn: request.user.expiraEn,
      },
    });
  };

  getMySessions = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    if (!request.user) {
      return reply.status(401).send({ error: "InvalidTokenError", message: "Usuario no autenticado" });
    }
    const result = await this.getMySessionsUseCase.execute(request.user.sub);
    return reply.status(200).send({
      message: "Sesiones consultadas correctamente",
      data: result.map((s) => ({
        idIngreso: s.idIngreso,
        idAutenticacion: s.idAutenticacion,
        resultado: s.resultado,
        ip: s.ip,
        agenteUsuario: s.agenteUsuario,
        dispositivo: s.dispositivo,
        fechaInicio: s.fechaInicio.toISOString(),
        fechaFin: s.fechaFin ? s.fechaFin.toISOString() : null,
        activa: s.activa,
      })),
      total: result.length,
    });
  };

  getMySessionDetail = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    if (!request.user) {
      return reply.status(401).send({ error: "InvalidTokenError", message: "Usuario no autenticado" });
    }
    const params = request.params as { idIngreso: string };
    const idIngreso = Number(params.idIngreso);
    const result = await this.getMySessionDetailUseCase.execute(idIngreso, request.user.sub);
    return reply.status(200).send({
      message: "Detalle de sesion consultado correctamente",
      data: {
        idIngreso: result.idIngreso,
        idAutenticacion: result.idAutenticacion,
        idPersona: result.idPersona,
        correo: result.correo,
        resultado: result.resultado,
        ip: result.ip,
        agenteUsuario: result.agenteUsuario,
        dispositivo: result.dispositivo,
        fechaInicio: result.fechaInicio.toISOString(),
        fechaFin: result.fechaFin ? result.fechaFin.toISOString() : null,
        activa: result.activa,
      },
    });
  };

  enviarVerificacionCorreo = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    if (!request.user) {
      return reply.status(401).send({ error: "InvalidTokenError", message: "Usuario no autenticado" });
    }
    const result = await this.enviarVerificacionCorreoUseCase.execute({
      idAutenticacion: request.user.authId,
      ip: request.ip,
      agenteUsuario: request.headers["user-agent"] ?? null,
    });
    return reply.status(200).send({ message: result.mensaje, data: result });
  };

  confirmarVerificacionCorreo = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    if (!request.user) {
      return reply.status(401).send({ error: "InvalidTokenError", message: "Usuario no autenticado" });
    }
    const body = request.body as ConfirmarVerificacionCorreoRequestDto;
    await this.confirmarVerificacionCorreoUseCase.execute({
      idAutenticacion: request.user.authId,
      codigo: body.codigo,
      ip: request.ip,
      agenteUsuario: request.headers["user-agent"] ?? null,
    });
    return reply.status(200).send({ message: "Correo verificado correctamente", data: { success: true } });
  };

  solicitarRecuperacionClave = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const body = request.body as SolicitarRecuperacionClaveRequestDto;
    const result = await this.solicitarRecuperacionClaveUseCase.execute({
      correo: body.correo,
      ip: request.ip,
      agenteUsuario: request.headers["user-agent"] ?? null,
    });
    return reply.status(200).send({ message: result.mensaje, data: result });
  };

  restablecerClave = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const body = request.body as RestablecerClaveRequestDto;
    await this.restablecerClaveUseCase.execute({
      correo: body.correo,
      codigo: body.codigo,
      nuevaClave: body.nuevaClave,
      ip: request.ip,
      agenteUsuario: request.headers["user-agent"] ?? null,
    });
    return reply.status(200).send({ message: "Contrase�a restablecida correctamente", data: { success: true } });
  };

  cambiarClave = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    if (!request.user) {
      return reply.status(401).send({ error: "InvalidTokenError", message: "Usuario no autenticado" });
    }
    const body = request.body as CambiarClaveRequestDto;
    await this.cambiarClaveUseCase.execute({
      idAutenticacion: request.user.authId,
      idPersona: request.user.sub,
      claveActual: body.claveActual,
      nuevaClave: body.nuevaClave,
      ip: request.ip,
      agenteUsuario: request.headers["user-agent"] ?? null,
    });
    return reply.status(200).send({ message: "Contrase�a cambiada correctamente", data: { success: true } });
  };
}

function createEmailService() {
  if (emailConfig.provider === "http") {
    return new HttpEmailService();
  }

  if (emailConfig.provider === "smtp") {
    return new NodemailerEmailService();
  }

  throw new Error(`Proveedor de correo no soportado: ${emailConfig.provider}`);
}

function createEmailQueueService(emailService: ReturnType<typeof createEmailService>): InMemoryEmailQueueService {
  if (queueConfig.provider !== "memory") {
    throw new Error(`Proveedor de cola no soportado: ${queueConfig.provider}`);
  }

  return new InMemoryEmailQueueService(emailService);
}

function createSmsService() {
  if (smsConfig.provider === "http") {
    return new HttpSmsService();
  }

  return new NoopSmsService();
}
