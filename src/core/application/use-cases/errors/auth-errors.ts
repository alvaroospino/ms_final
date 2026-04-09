export class InvalidCredentialsError extends Error {
  constructor(message = "Credenciales inválidas") {
    super(message);
    this.name = "InvalidCredentialsError";
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

export class AccountBlockedError extends Error {
  constructor(
    public readonly blockedUntil: Date,
    message = "La cuenta se encuentra bloqueada temporalmente",
  ) {
    super(message);
    this.name = "AccountBlockedError";
    Object.setPrototypeOf(this, AccountBlockedError.prototype);
  }
}

export class InvalidTokenError extends Error {
  constructor(message = "Token inválido o expirado") {
    super(message);
    this.name = "InvalidTokenError";
    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}

export class ForbiddenError extends Error {
  constructor(message = "No tienes permisos para realizar esta acción") {
    super(message);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}