import { FormEvent, useEffect, useState } from "react";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type ApiResult = {
  status: number;
  ok: boolean;
  method: string;
  url: string;
  body: JsonValue | string | null;
};

type TesterFormProps = {
  title: string;
  subtitle: string;
  onSubmit: () => Promise<void>;
  children: React.ReactNode;
  actionLabel?: string;
};

const storageKeys = {
  apiBaseUrl: "ms-playground-api-base-url",
  accessToken: "ms-playground-access-token",
  refreshToken: "ms-playground-refresh-token",
};

const defaultBaseUrl = "http://localhost:3000";

function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(
    localStorage.getItem(storageKeys.apiBaseUrl) ?? defaultBaseUrl,
  );
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem(storageKeys.accessToken) ?? "",
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem(storageKeys.refreshToken) ?? "",
  );

  const [registerForm, setRegisterForm] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    celular: "",
    clave: "",
  });
  const [loginForm, setLoginForm] = useState({
    correo: "",
    clave: "",
  });
  const [confirmEmailCode, setConfirmEmailCode] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [resetForm, setResetForm] = useState({
    correo: "",
    codigo: "",
    nuevaClave: "",
  });
  const [changePasswordForm, setChangePasswordForm] = useState({
    claveActual: "",
    nuevaClave: "",
  });
  const [genericForm, setGenericForm] = useState({
    method: "GET",
    path: "/health",
    useAuth: true,
    body: "",
  });
  const [lastResult, setLastResult] = useState<ApiResult | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(storageKeys.apiBaseUrl, apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    localStorage.setItem(storageKeys.accessToken, accessToken);
  }, [accessToken]);

  useEffect(() => {
    localStorage.setItem(storageKeys.refreshToken, refreshToken);
  }, [refreshToken]);

  async function request<TBody extends JsonValue | undefined>({
    method,
    path,
    body,
    useAuth = false,
  }: {
    method: string;
    path: string;
    body?: TBody;
    useAuth?: boolean;
  }): Promise<ApiResult> {
    const url = `${apiBaseUrl.replace(/\/$/, "")}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(useAuth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    const parsedBody = tryParseJson(text);

    const result: ApiResult = {
      status: response.status,
      ok: response.ok,
      method,
      url,
      body: parsedBody,
    };

    const discoveredTokens = extractTokens(parsedBody);
    if (discoveredTokens.accessToken) {
      setAccessToken(discoveredTokens.accessToken);
    }
    if (discoveredTokens.refreshToken) {
      setRefreshToken(discoveredTokens.refreshToken);
    }

    setLastResult(result);
    return result;
  }

  async function runAction(label: string, action: () => Promise<void>) {
    setPendingLabel(label);
    try {
      await action();
    } finally {
      setPendingLabel(null);
    }
  }

  async function handleRegister() {
    await request({
      method: "POST",
      path: "/api/personas/register-local",
      body: {
        ...registerForm,
        celular: registerForm.celular.trim() || null,
      },
    });
  }

  async function handleLogin() {
    await request({
      method: "POST",
      path: "/api/auth/login-local",
      body: loginForm,
    });
  }

  async function handleRefresh() {
    await request({
      method: "POST",
      path: "/api/auth/refresh",
      body: { refreshToken },
    });
  }

  async function handleLogout() {
    await request({
      method: "POST",
      path: "/api/auth/logout",
      body: { refreshToken },
    });
  }

  async function handleLogoutGlobal() {
    await request({
      method: "POST",
      path: "/api/auth/logout-global",
      useAuth: true,
    });
  }

  async function handleMe() {
    await request({
      method: "GET",
      path: "/api/auth/me",
      useAuth: true,
    });
  }

  async function handleSendVerification() {
    await request({
      method: "POST",
      path: "/api/auth/verificar-correo/enviar",
      useAuth: true,
    });
  }

  async function handleConfirmVerification() {
    await request({
      method: "POST",
      path: "/api/auth/verificar-correo/confirmar",
      useAuth: true,
      body: { codigo: confirmEmailCode },
    });
  }

  async function handleRequestRecovery() {
    await request({
      method: "POST",
      path: "/api/auth/recuperar-clave",
      body: { correo: recoveryEmail },
    });
  }

  async function handleResetPassword() {
    await request({
      method: "POST",
      path: "/api/auth/restablecer-clave",
      body: resetForm,
    });
  }

  async function handleChangePassword() {
    await request({
      method: "POST",
      path: "/api/auth/cambiar-clave",
      useAuth: true,
      body: changePasswordForm,
    });
  }

  async function handleGenericRequest() {
    const parsedBody =
      genericForm.body.trim() === "" ? undefined : (tryParseJson(genericForm.body) as JsonValue);

    await request({
      method: genericForm.method,
      path: genericForm.path,
      useAuth: genericForm.useAuth,
      body: parsedBody,
    });
  }

  function clearTokens() {
    setAccessToken("");
    setRefreshToken("");
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <span className="eyebrow">React Playground</span>
          <h1>Pruebas rápidas para tu microservicio de seguridad</h1>
          <p>
            Registra usuarios, inicia sesión, refresca tokens y dispara endpoints protegidos
            desde una sola pantalla.
          </p>
        </div>
        <div className="hero-card">
          <label className="field">
            <span>Base URL del API</span>
            <input
              value={apiBaseUrl}
              onChange={(event) => setApiBaseUrl(event.target.value)}
              placeholder="http://localhost:3000"
            />
          </label>
          <label className="field">
            <span>Access token</span>
            <textarea
              rows={4}
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="Se llena automáticamente al hacer login"
            />
          </label>
          <label className="field">
            <span>Refresh token</span>
            <textarea
              rows={3}
              value={refreshToken}
              onChange={(event) => setRefreshToken(event.target.value)}
              placeholder="Se llena automáticamente al hacer login"
            />
          </label>
          <button className="ghost-button" type="button" onClick={clearTokens}>
            Limpiar tokens
          </button>
        </div>
      </section>

      <section className="layout">
        <div className="column">
          <TesterForm
            title="Registro local"
            subtitle="POST /api/personas/register-local"
            onSubmit={() => runAction("Registrando usuario", handleRegister)}
            actionLabel={pendingLabel === "Registrando usuario" ? "Enviando..." : "Registrar"}
          >
            <div className="grid">
              <Field
                label="Nombres"
                value={registerForm.nombres}
                onChange={(value) => setRegisterForm((current) => ({ ...current, nombres: value }))}
              />
              <Field
                label="Apellidos"
                value={registerForm.apellidos}
                onChange={(value) =>
                  setRegisterForm((current) => ({ ...current, apellidos: value }))
                }
              />
              <Field
                label="Correo"
                type="email"
                value={registerForm.correo}
                onChange={(value) => setRegisterForm((current) => ({ ...current, correo: value }))}
              />
              <Field
                label="Celular"
                value={registerForm.celular}
                onChange={(value) => setRegisterForm((current) => ({ ...current, celular: value }))}
              />
              <Field
                label="Clave"
                type="password"
                value={registerForm.clave}
                onChange={(value) => setRegisterForm((current) => ({ ...current, clave: value }))}
              />
            </div>
          </TesterForm>

          <TesterForm
            title="Inicio de sesión"
            subtitle="POST /api/auth/login-local"
            onSubmit={() => runAction("Iniciando sesión", handleLogin)}
            actionLabel={pendingLabel === "Iniciando sesión" ? "Consultando..." : "Iniciar sesión"}
          >
            <div className="grid">
              <Field
                label="Correo"
                type="email"
                value={loginForm.correo}
                onChange={(value) => setLoginForm((current) => ({ ...current, correo: value }))}
              />
              <Field
                label="Clave"
                type="password"
                value={loginForm.clave}
                onChange={(value) => setLoginForm((current) => ({ ...current, clave: value }))}
              />
            </div>
          </TesterForm>

          <TesterForm
            title="Sesión y tokens"
            subtitle="Refresh, logout, logout global y perfil"
            onSubmit={() => Promise.resolve()}
            actionLabel="Listo"
          >
            <div className="action-row">
              <button type="button" onClick={() => runAction("Refrescando token", handleRefresh)}>
                {pendingLabel === "Refrescando token" ? "Refrescando..." : "Refresh"}
              </button>
              <button type="button" onClick={() => runAction("Consultando perfil", handleMe)}>
                {pendingLabel === "Consultando perfil" ? "Consultando..." : "Ver /me"}
              </button>
              <button type="button" onClick={() => runAction("Cerrando sesión", handleLogout)}>
                {pendingLabel === "Cerrando sesión" ? "Cerrando..." : "Logout"}
              </button>
              <button
                type="button"
                onClick={() => runAction("Cerrando todas las sesiones", handleLogoutGlobal)}
              >
                {pendingLabel === "Cerrando todas las sesiones" ? "Cerrando..." : "Logout global"}
              </button>
            </div>
          </TesterForm>
        </div>

        <div className="column">
          <TesterForm
            title="Verificación de correo"
            subtitle="Enviar y confirmar código con sesión autenticada"
            onSubmit={() => runAction("Confirmando correo", handleConfirmVerification)}
            actionLabel={pendingLabel === "Confirmando correo" ? "Confirmando..." : "Confirmar"}
          >
            <div className="action-row">
              <button
                type="button"
                onClick={() => runAction("Enviando verificación", handleSendVerification)}
              >
                {pendingLabel === "Enviando verificación" ? "Enviando..." : "Enviar código"}
              </button>
            </div>
            <Field
              label="Código"
              value={confirmEmailCode}
              onChange={setConfirmEmailCode}
            />
          </TesterForm>

          <TesterForm
            title="Recuperación de clave"
            subtitle="Solicitar código y luego restablecer"
            onSubmit={() => runAction("Restableciendo clave", handleResetPassword)}
            actionLabel={pendingLabel === "Restableciendo clave" ? "Procesando..." : "Restablecer"}
          >
            <Field
              label="Correo para recuperación"
              type="email"
              value={recoveryEmail}
              onChange={setRecoveryEmail}
            />
            <div className="action-row">
              <button
                type="button"
                onClick={() => runAction("Solicitando recuperación", handleRequestRecovery)}
              >
                {pendingLabel === "Solicitando recuperación" ? "Enviando..." : "Solicitar código"}
              </button>
            </div>
            <div className="grid">
              <Field
                label="Correo"
                type="email"
                value={resetForm.correo}
                onChange={(value) => setResetForm((current) => ({ ...current, correo: value }))}
              />
              <Field
                label="Código"
                value={resetForm.codigo}
                onChange={(value) => setResetForm((current) => ({ ...current, codigo: value }))}
              />
              <Field
                label="Nueva clave"
                type="password"
                value={resetForm.nuevaClave}
                onChange={(value) =>
                  setResetForm((current) => ({ ...current, nuevaClave: value }))
                }
              />
            </div>
          </TesterForm>

          <TesterForm
            title="Cambio de clave"
            subtitle="POST /api/auth/cambiar-clave"
            onSubmit={() => runAction("Cambiando clave", handleChangePassword)}
            actionLabel={pendingLabel === "Cambiando clave" ? "Actualizando..." : "Cambiar clave"}
          >
            <div className="grid">
              <Field
                label="Clave actual"
                type="password"
                value={changePasswordForm.claveActual}
                onChange={(value) =>
                  setChangePasswordForm((current) => ({ ...current, claveActual: value }))
                }
              />
              <Field
                label="Nueva clave"
                type="password"
                value={changePasswordForm.nuevaClave}
                onChange={(value) =>
                  setChangePasswordForm((current) => ({ ...current, nuevaClave: value }))
                }
              />
            </div>
          </TesterForm>
        </div>
      </section>

      <section className="layout">
        <div className="column wide">
          <TesterForm
            title="Request manual"
            subtitle="Úsalo para probar endpoints extra del módulo de seguridad"
            onSubmit={() => runAction("Ejecutando request manual", handleGenericRequest)}
            actionLabel={pendingLabel === "Ejecutando request manual" ? "Enviando..." : "Enviar request"}
          >
            <div className="grid grid-tight">
              <label className="field">
                <span>Método</span>
                <select
                  value={genericForm.method}
                  onChange={(event) =>
                    setGenericForm((current) => ({ ...current, method: event.target.value }))
                  }
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>PATCH</option>
                  <option>DELETE</option>
                </select>
              </label>
              <Field
                label="Ruta"
                value={genericForm.path}
                onChange={(value) => setGenericForm((current) => ({ ...current, path: value }))}
              />
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={genericForm.useAuth}
                onChange={(event) =>
                  setGenericForm((current) => ({ ...current, useAuth: event.target.checked }))
                }
              />
              <span>Enviar access token como Bearer</span>
            </label>
            <label className="field">
              <span>Body JSON</span>
              <textarea
                rows={8}
                value={genericForm.body}
                onChange={(event) =>
                  setGenericForm((current) => ({ ...current, body: event.target.value }))
                }
                placeholder='{"idRol":"..."}'
              />
            </label>
          </TesterForm>
        </div>

        <aside className="column response-panel">
          <div className="result-card">
            <span className="eyebrow">Última respuesta</span>
            {lastResult ? (
              <>
                <div className={`status ${lastResult.ok ? "ok" : "error"}`}>
                  <strong>{lastResult.status}</strong>
                  <span>
                    {lastResult.method} {lastResult.url}
                  </span>
                </div>
                <pre>{formatJson(lastResult.body)}</pre>
              </>
            ) : (
              <p>
                Aquí verás el payload devuelto por el backend, incluidos errores de validación y
                respuestas exitosas.
              </p>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

function TesterForm({
  title,
  subtitle,
  onSubmit,
  children,
  actionLabel = "Enviar",
}: TesterFormProps) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit();
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="card-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="card-content">{children}</div>
      <button type="submit">{actionLabel}</button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function tryParseJson(value: string): JsonValue | string | null {
  if (value.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(value) as JsonValue;
  } catch {
    return value;
  }
}

function formatJson(value: JsonValue | string | null): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function extractTokens(body: JsonValue | string | null): {
  accessToken?: string;
  refreshToken?: string;
} {
  if (!body || typeof body === "string") {
    return {};
  }

  const accessToken = deepFindString(body, "accessToken");
  const refreshToken = deepFindString(body, "refreshToken");

  return { accessToken, refreshToken };
}

function deepFindString(value: JsonValue, key: string): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = deepFindString(item, key);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  if (value && typeof value === "object") {
    if (typeof value[key] === "string") {
      return value[key] as string;
    }

    for (const nested of Object.values(value)) {
      if (nested !== null && typeof nested !== "boolean" && typeof nested !== "number") {
        const found = deepFindString(nested as JsonValue, key);
        if (found) {
          return found;
        }
      }
    }
  }

  return undefined;
}

export default App;
