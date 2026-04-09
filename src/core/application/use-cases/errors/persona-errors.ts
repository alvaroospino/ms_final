export class PersonaAlreadyExistsError extends Error {
  constructor(message = "Ya existe una persona registrada con ese correo") {
    super(message);
    this.name = "PersonaAlreadyExistsError";
    Object.setPrototypeOf(this, PersonaAlreadyExistsError.prototype);
  }
}