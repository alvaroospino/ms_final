export interface CreateRoleParams {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  esSistema?: boolean;
}

export interface CreatePermissionParams {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

export interface AssignRoleToPersonaParams {
  idPersona: string;
  idRol: string;
  idPersonaAutoriza?: string | null;
}

export interface AssignPermissionToRoleParams {
  idRol: string;
  idPermiso: string;
}

export interface RoleRecord {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  esSistema: boolean;
}

export interface PermissionRecord {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface PersonaRoleRecord {
  id: string;
  codigo: string;
  nombre: string;
}

export interface RolePermissionRecord {
  id: string;
  codigo: string;
  nombre: string;
}

export interface AccessControlRepository {
  createRole(params: CreateRoleParams): Promise<RoleRecord>;
  createPermission(params: CreatePermissionParams): Promise<PermissionRecord>;

  assignRoleToPersona(params: AssignRoleToPersonaParams): Promise<void>;
  assignPermissionToRole(params: AssignPermissionToRoleParams): Promise<void>;

  removeRoleFromPersona(idPersona: string, idRol: string): Promise<void>;
  removePermissionFromRole(idRol: string, idPermiso: string): Promise<void>;

  getAllRoles(): Promise<RoleRecord[]>;
  getAllPermissions(): Promise<PermissionRecord[]>;

  getRolesByPersonaId(idPersona: string): Promise<PersonaRoleRecord[]>;
  getPermissionsByRoleId(idRol: string): Promise<RolePermissionRecord[]>;

  roleExists(idRol: string): Promise<boolean>;
  permissionExists(idPermiso: string): Promise<boolean>;
  personaExists(idPersona: string): Promise<boolean>;

  roleAlreadyAssignedToPersona(idPersona: string, idRol: string): Promise<boolean>;
  permissionAlreadyAssignedToRole(idRol: string, idPermiso: string): Promise<boolean>;
}