import { FastifyReply, FastifyRequest } from "fastify";

import { AssignPermissionToRoleUseCase } from "../../../../../../core/application/use-cases/access-control/assign-permission-to-role.use-case.js";
import { AssignRoleToPersonaUseCase } from "../../../../../../core/application/use-cases/access-control/assign-role-to-persona.use-case.js";
import { CreatePermissionUseCase } from "../../../../../../core/application/use-cases/access-control/create-permission.use-case.js";
import { CreateRoleUseCase } from "../../../../../../core/application/use-cases/access-control/create-role.use-case.js";
import { GetAllPermissionsUseCase } from "../../../../../../core/application/use-cases/access-control/get-all-permissions.use-case.js";
import { GetAllRolesUseCase } from "../../../../../../core/application/use-cases/access-control/get-all-roles.use-case.js";
import { GetPersonaRolesUseCase } from "../../../../../../core/application/use-cases/access-control/get-persona-roles.use-case.js";
import { GetRolePermissionsUseCase } from "../../../../../../core/application/use-cases/access-control/get-role-permissions.use-case.js";
import { RemovePermissionFromRoleUseCase } from "../../../../../../core/application/use-cases/access-control/remove-permission-from-role.use-case.js";
import { RemoveRoleFromPersonaUseCase } from "../../../../../../core/application/use-cases/access-control/remove-role-from-persona.use-case.js";
import { AccessControlDrizzleRepository } from "../../../drizzle/repositories/access-control.drizzle-repository.js";
import { AssignPermissionToRoleRequestDto } from "../dto/request/assign-permission-to-role.request.dto.js";
import { AssignRoleToPersonaRequestDto } from "../dto/request/assign-role-to-persona.request.dto.js";
import { CreatePermissionRequestDto } from "../dto/request/create-permission.request.dto.js";
import { CreateRoleRequestDto } from "../dto/request/create-role.request.dto.js";

export class AccessControlController {
  private readonly repository = new AccessControlDrizzleRepository();

  private readonly createRoleUseCase = new CreateRoleUseCase(this.repository);
  private readonly createPermissionUseCase = new CreatePermissionUseCase(this.repository);
  private readonly assignRoleToPersonaUseCase = new AssignRoleToPersonaUseCase(this.repository);
  private readonly assignPermissionToRoleUseCase = new AssignPermissionToRoleUseCase(this.repository);
  private readonly getAllRolesUseCase = new GetAllRolesUseCase(this.repository);
  private readonly getAllPermissionsUseCase = new GetAllPermissionsUseCase(this.repository);
  private readonly getPersonaRolesUseCase = new GetPersonaRolesUseCase(this.repository);
  private readonly getRolePermissionsUseCase = new GetRolePermissionsUseCase(this.repository);
  private readonly removeRoleFromPersonaUseCase = new RemoveRoleFromPersonaUseCase(this.repository);
  private readonly removePermissionFromRoleUseCase = new RemovePermissionFromRoleUseCase(this.repository);

  createRole = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const body = request.body as CreateRoleRequestDto;
    const result = await this.createRoleUseCase.execute(body);

    return reply.status(201).send({
      message: "Rol creado correctamente",
      data: result,
    });
  };

  getAllRoles = async (_request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const result = await this.getAllRolesUseCase.execute();

    return reply.status(200).send({
      data: result,
      total: result.length,
    });
  };

  createPermission = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const body = request.body as CreatePermissionRequestDto;
    const result = await this.createPermissionUseCase.execute(body);

    return reply.status(201).send({
      message: "Permiso creado correctamente",
      data: result,
    });
  };

  getAllPermissions = async (_request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const result = await this.getAllPermissionsUseCase.execute();

    return reply.status(200).send({
      data: result,
      total: result.length,
    });
  };

  assignRoleToPersona = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const params = request.params as { idPersona: string };
    const body = request.body as AssignRoleToPersonaRequestDto;

    await this.assignRoleToPersonaUseCase.execute({
      idPersona: params.idPersona,
      idRol: body.idRol,
      idPersonaAutoriza: body.idPersonaAutoriza ?? null,
    });

    return reply.status(200).send({
      message: "Rol asignado correctamente a la persona",
      data: { success: true },
    });
  };

  assignPermissionToRole = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const params = request.params as { idRol: string };
    const body = request.body as AssignPermissionToRoleRequestDto;

    await this.assignPermissionToRoleUseCase.execute({
      idRol: params.idRol,
      idPermiso: body.idPermiso,
    });

    return reply.status(200).send({
      message: "Permiso asignado correctamente al rol",
      data: { success: true },
    });
  };

  getPersonaRoles = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const params = request.params as { idPersona: string };
    const result = await this.getPersonaRolesUseCase.execute(params.idPersona);

    return reply.status(200).send({
      data: result,
      total: result.length,
    });
  };

  getRolePermissions = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const params = request.params as { idRol: string };
    const result = await this.getRolePermissionsUseCase.execute(params.idRol);

    return reply.status(200).send({
      data: result,
      total: result.length,
    });
  };

  removeRoleFromPersona = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const params = request.params as { idPersona: string; idRol: string };
    const result = await this.removeRoleFromPersonaUseCase.execute(
      params.idPersona,
      params.idRol,
    );

    return reply.status(200).send({
      message: "Rol quitado correctamente de la persona",
      data: result,
    });
  };

  removePermissionFromRole = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> => {
    const params = request.params as { idRol: string; idPermiso: string };
    const result = await this.removePermissionFromRoleUseCase.execute(
      params.idRol,
      params.idPermiso,
    );

    return reply.status(200).send({
      message: "Permiso quitado correctamente del rol",
      data: result,
    });
  };
}
