import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Hospital,
  ShieldCheck,
  CalendarCheck,
  Users,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const roleRoutes = {
  PATIENT: "/patient/dashboard",
  DOCTOR: "/doctor/dashboard",
  NURSE: "/nurse/dashboard",
  ADMIN: "/admin/dashboard",
  LAB_TECH: "/labtech/dashboard",
  PHARMACIST: "/pharmacist/dashboard",
};

const features = [
  { icon: <ShieldCheck />, text: "Advanced Patient Care" },
  { icon: <CalendarCheck />, text: "Smart Appointments" },
  { icon: <Users />, text: "Multi-Role Management" },
  { icon: <BarChart3 />, text: "Real-time Analytics" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) navigate(roleRoutes[user.role], { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await login(email, password);
      if (res?.success) {
        navigate(roleRoutes[res.user.role], { replace: true });
      } else {
        setError(res?.message || "Invalid credentials");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2">

      {/* LEFT PANEL */}
      <div className="hidden md:flex flex-col justify-center px-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />

        <div className="relative z-10 max-w-lg space-y-10 animate-fadeIn">
          <div>
            <Hospital className="w-16 h-16 mb-6 drop-shadow-lg" />
            <h1 className="text-4xl font-bold">HMS Portal</h1>
            <p className="text-lg text-white/80 mt-2">
              Integrated Healthcare Management System
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 hover:translate-x-2 transition"
              >
                <span className="text-2xl">{f.icon}</span>
                <span className="font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-white/80 leading-relaxed">
            Secure, scalable, and designed for modern hospitals and healthcare professionals.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-center justify-center px-6 sm:px-10">
        <div className="w-full max-w-md space-y-8 animate-slideUp">

          <div>
            <h2 className="text-3xl font-bold text-indigo-600">
              Welcome Back
            </h2>
            <p className="text-gray-500 mt-2">
              Login to access your medical dashboard
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                className="w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            {/* Remember & Forgot */}
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-indigo-600" />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-indigo-600 font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Button */}
            <button
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg disabled:opacity-60"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            New to our hospital?{" "}
            <Link
              to="/signup"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
