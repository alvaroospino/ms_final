export interface ValidationIssue {
  field?: string;
  message: string;
  received?: unknown;
}

export class ExternalServiceError extends Error {
  constructor(
    message = "Ocurrio un error al comunicarse con un servicio externo",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ExternalServiceError";
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

export class ValidationError extends Error {
  constructor(
    public readonly issues: ValidationIssue[],
    message = "Los datos enviados no son validos",
  ) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class DatabaseError extends Error {
  constructor(
    message = "Ocurrio un error de base de datos",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DatabaseError";
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class NotFoundError extends Error {
  constructor(message = "Recurso no encontrado") {
    super(message);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
