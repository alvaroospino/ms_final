export class EntityNotFoundError extends Error {
  constructor(message = "Entidad no encontrada") {
    super(message);
    this.name = "EntityNotFoundError";
    Object.setPrototypeOf(this, EntityNotFoundError.prototype);
  }
}

export class DuplicateAssignmentError extends Error {
  constructor(message = "La relación ya existe") {
    super(message);
    this.name = "DuplicateAssignmentError";
    Object.setPrototypeOf(this, DuplicateAssignmentError.prototype);
  }
}

export class DuplicateCodeError extends Error {
  constructor(message = "Ya existe un registro con ese código") {
    super(message);
    this.name = "DuplicateCodeError";
    Object.setPrototypeOf(this, DuplicateCodeError.prototype);
  }
}