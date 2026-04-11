export class PersonaAlreadyExistsError extends Error {
  constructor(message = "Ya existe una cuenta registrada con ese identificador") {
    super(message);
    this.name = "PersonaAlreadyExistsError";
    Object.setPrototypeOf(this, PersonaAlreadyExistsError.prototype);
  }
}
