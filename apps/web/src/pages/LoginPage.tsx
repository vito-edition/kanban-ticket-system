import type { FC } from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useLogin, useRegister } from "../hooks/useAuth";
import { useAuthStore } from "../store/authStore";

interface LoginForm { email: string; password: string; }
interface RegisterForm { name: string; email: string; password: string; confirmPassword: string; }

export const LoginPage: FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              K
            </div>
            <span className="text-2xl font-bold text-white">KanbanFlow</span>
          </div>
          <p className="text-gray-400">Manage your projects with ease</p>
        </div>

        <div className="card p-8">
          <div className="flex mb-6 border-b">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  mode === m
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {mode === "login" ? <LoginForm onSuccess={() => navigate("/")} /> : <RegisterForm onSuccess={() => navigate("/")} />}
        </div>

        <p className="text-center mt-6 text-xs text-gray-500">
          Demo: admin@example.com / Admin@12345!
        </p>
      </div>
    </div>
  );
};

const LoginForm: FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const login = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    await login.mutateAsync(data);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Email</label>
        <input type="email" className="input" placeholder="you@example.com" {...register("email", { required: true })} />
      </div>
      <div>
        <label className="label">Password</label>
        <input type="password" className="input" placeholder="••••••••" {...register("password", { required: true })} />
      </div>
      <button type="submit" disabled={login.isPending} className="btn-primary w-full">
        {login.isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
};

const RegisterForm: FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const register_ = useRegister();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();

  const onSubmit = async ({ confirmPassword, ...data }: RegisterForm) => {
    await register_.mutateAsync(data);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Name</label>
        <input className="input" placeholder="Your name" {...register("name", { required: true, minLength: 2 })} />
      </div>
      <div>
        <label className="label">Email</label>
        <input type="email" className="input" placeholder="you@example.com" {...register("email", { required: true })} />
      </div>
      <div>
        <label className="label">Password</label>
        <input type="password" className="input" placeholder="8+ chars, uppercase, number, symbol" {...register("password", { required: true, minLength: 8 })} />
      </div>
      <div>
        <label className="label">Confirm Password</label>
        <input
          type="password"
          className="input"
          placeholder="Repeat password"
          {...register("confirmPassword", {
            required: true,
            validate: (v) => v === watch("password") || "Passwords do not match",
          })}
        />
        {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>}
      </div>
      <button type="submit" disabled={register_.isPending} className="btn-primary w-full">
        {register_.isPending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
};
