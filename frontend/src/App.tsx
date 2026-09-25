import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileDown,
  LayoutGrid,
  LoaderCircle,
  LogOut,
  Menu,
  Receipt,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { api, post } from "./api";
import { ErrorBox, Loading } from "./components";
import { BillingPage, CustomersPage, ExportsPage } from "./pages";
import type { User } from "./types";

type Section = "reports" | "charges" | "customers" | "exports";
const navigation = [
  { id: "reports", label: "Relatórios", icon: BarChart3 },
  { id: "charges", label: "Cobranças", icon: Receipt },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "exports", label: "Exportações", icon: FileDown },
] as const;
const sectionFromHash = (): Section =>
  navigation.find((n) => "#" + n.id === window.location.hash)?.id ?? "reports";

function Login({ loggedIn }: { loggedIn: (user: User) => void }) {
  const [email, setEmail] = useState("admin@clara.local");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await api("/sanctum/csrf-cookie");
      const result = await post<{ user: User }>("/api/login", {
        email,
        password,
      });
      loggedIn(result.user);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login">
      <div className="login-story">
        <a className="brand" href="#">
          <span className="brand-icon">c</span>clara
          <span className="brand-dot">.</span>
        </a>
        <div className="login-story-body">
          <span className="login-kicker">
            MENOS COMPLEXIDADE. MAIS CLAREZA.
          </span>
          <h1>
            Seu faturamento.
            <br />
            Sob uma nova
            <br />
            <em>perspectiva.</em>
          </h1>
          <p>
            Clientes, cobranças e relatórios.
            <br />
            Tudo conectado para você seguir em frente.
          </p>
          <div className="login-illustration">
            <div className="illustration-icon">
              <BarChart3 size={25} />
            </div>
            <div>
              <span>Organização que faz a diferença</span>
              <strong>Cada detalhe, no seu lugar.</strong>
            </div>
            <CheckCircle2 size={23} />
          </div>
        </div>
        <small>Clara · Gestão de faturamento</small>
      </div>
      <div className="login-panel">
        <form onSubmit={submit}>
          <span className="login-mini-logo">
            <LayoutGrid size={24} />
          </span>
          <h2>Bom ter você por aqui.</h2>
          <p>Entre na sua conta para acompanhar seu negócio.</p>
          <ErrorBox error={error} />
          <label>
            E-mail
            <input
              autoComplete="username"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              autoComplete="current-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
            />
          </label>
          <button className="button primary" disabled={busy}>
            {busy ? (
              <LoaderCircle size={18} className="spin" />
            ) : (
              <>
                Entrar na plataforma <ArrowRight size={18} />
              </>
            )}
          </button>
          <div className="demo-access">
            <ShieldCheck size={19} />
            <div>
              <strong>Acesso de demonstração</strong>
              <span>admin@clara.local · senha: Clara@2026!</span>
            </div>
          </div>
          <small className="login-bottom">
            Um espaço seguro para as finanças do seu negócio.
          </small>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User>();
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");
  const [section, setSection] = useState<Section>(sectionFromHash);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    api<{ user: User }>("/api/user")
      .then((data) => setUser(data.user))
      .catch((e) => {
        if (e.status !== 401)
          setBootError(
            "Não foi possível conectar à API. Verifique se o backend está em execução.",
          );
      })
      .finally(() => setBooting(false));
    const expired = () => setUser(undefined);
    const hashChanged = () => {
      setSection(sectionFromHash());
      setMenu(false);
    };
    window.addEventListener("session-expired", expired);
    window.addEventListener("hashchange", hashChanged);
    return () => {
      window.removeEventListener("session-expired", expired);
      window.removeEventListener("hashchange", hashChanged);
    };
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    if (section === "exports" && user) {
      const timer = setInterval(() => setTick((v) => v + 1), 5000);
      return () => clearInterval(timer);
    }
  }, [section, user]);
  async function logout() {
    try {
      await post("/api/logout", {});
      setUser(undefined);
    } catch {
      setToast("Não foi possível encerrar a sessão. Tente novamente.");
    }
  }
  if (booting)
    return (
      <div className="boot">
        <Loading />
      </div>
    );
  if (!user)
    return (
      <>
        {bootError && (
          <div className="connection-warning" role="alert">
            {bootError}
          </div>
        )}
        <Login loggedIn={setUser} />
      </>
    );
  return (
    <div className="app-shell">
      {menu && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <a className="brand" href="#reports">
          <span className="brand-icon">c</span>clara
          <span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">
            <LayoutGrid size={18} />
          </span>
          <div>
            <strong>Meu negócio</strong>
            <small>Gestão de faturamento</small>
          </div>
        </div>
        <span className="nav-caption">PRINCIPAL</span>
        <nav>
          {navigation.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={"#" + id}
              aria-current={section === id ? "page" : undefined}
              className={section === id ? "active" : ""}
            >
              <Icon size={19} />
              <span>{label}</span>
              {section === id && <span className="active-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-icon">
            <CircleHelp size={20} />
          </span>
          <strong>Clareza em cada decisão.</strong>
          <p>
            Use os filtros para olhar de perto o que importa para o seu negócio.
          </p>
        </div>
        <div className="sidebar-user">
          <span className="user-avatar">
            {user.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>{user.name}</strong>
            <small>Conta autenticada</small>
          </div>
          <button aria-label="Sair da conta" onClick={logout}>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menu"
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            <span className="muted">Meu negócio</span>
            <ChevronRight size={14} />
            <strong>{navigation.find((n) => n.id === section)?.label}</strong>
          </div>
          <span className="topbar-status">
            <span /> Ambiente de demonstração
          </span>
        </header>
        <main>
          {section === "reports" && (
            <BillingPage key="reports" report notify={setToast} />
          )}{" "}
          {section === "charges" && (
            <BillingPage key="charges" report={false} notify={setToast} />
          )}{" "}
          {section === "customers" && <CustomersPage notify={setToast} />}{" "}
          {section === "exports" && <ExportsPage tick={tick} />}
          <footer className="main-footer">
            <span>Clara © {new Date().getFullYear()} · Tudo mais claro.</span>
            <span>Feito para simplificar seu dia.</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={20} />
          {toast}
          <button
            className="icon-button"
            aria-label="Fechar mensagem"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
