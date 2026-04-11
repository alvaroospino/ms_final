import "dotenv/config";

function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;

  if (value === undefined || value === "") {
    throw new Error(`Falta la variable de entorno: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getBooleanEnv(name: string, defaultValue = "false"): boolean {
  return getEnv(name, defaultValue).toLowerCase() === "true";
}

function getNumberEnv(name: string, defaultValue?: string): number {
  const rawValue = getEnv(name, defaultValue);
  const parsed = Number(rawValue);

  if (Number.isNaN(parsed)) {
    throw new Error(`La variable de entorno ${name} no es un número válido`);
  }

  return parsed;
}

export const databaseConfig = {
  host: getEnv("DB_HOST"),
  port: getNumberEnv("DB_PORT", "5432"),
  database: getEnv("DB_NAME"),
  user: getEnv("DB_USER"),
  password: getEnv("DB_PASSWORD"),
  ssl: getBooleanEnv("DB_SSL", "false"),
};

export const appConfig = {
  nodeEnv: getEnv("NODE_ENV", "development"),
  port: getNumberEnv("APP_PORT", "3000"),
  host: getEnv("APP_HOST", "0.0.0.0"),
};

export const jwtConfig = {
  accessSecret: getEnv("JWT_ACCESS_SECRET"),
  refreshSecret: getEnv("JWT_REFRESH_SECRET"),
  issuer: getEnv("JWT_ISSUER", "microservicio-seguridad"),
  accessExpiresIn: getEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
  refreshExpiresIn: getEnv("JWT_REFRESH_EXPIRES_IN", "7d"),
};

export const emailConfig = {
  provider: getEnv("MAIL_PROVIDER", "smtp"),
  host: getEnv("MAIL_HOST"),
  port: getNumberEnv("MAIL_PORT", "587"),
  secure: getBooleanEnv("MAIL_SECURE", "false"),
  user: getOptionalEnv("MAIL_USER"),
  password: getOptionalEnv("MAIL_PASSWORD"),
  fromEmail: getEnv("MAIL_FROM_EMAIL"),
  fromName: getEnv("MAIL_FROM_NAME", "PAYGO Seguridad"),
};

export const queueConfig = {
  provider: getEnv("QUEUE_PROVIDER", "memory"),
};

export const smsConfig = {
  provider: getEnv("SMS_PROVIDER", "noop"),
  endpoint: getOptionalEnv("SMS_ENDPOINT"),
  token: getOptionalEnv("SMS_TOKEN"),
  timeoutMs: getNumberEnv("SMS_TIMEOUT_MS", "5000"),
};
