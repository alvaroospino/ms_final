export class CodigoInvalidoError extends Error {
  constructor(message = "El código es inválido o ha expirado") {
    super(message);
    this.name = "CodigoInvalidoError";
    Object.setPrototypeOf(this, CodigoInvalidoError.prototype);
  }
}

export class CodigoAgotadoError extends Error {
  constructor(message = "Se superó el número de intentos permitidos para este código") {
    super(message);
    this.name = "CodigoAgotadoError";
    Object.setPrototypeOf(this, CodigoAgotadoError.prototype);
  }
}

export class CorreoYaVerificadoError extends Error {
  constructor(message = "El correo ya está verificado") {
    super(message);
    this.name = "CorreoYaVerificadoError";
    Object.setPrototypeOf(this, CorreoYaVerificadoError.prototype);
  }
}
