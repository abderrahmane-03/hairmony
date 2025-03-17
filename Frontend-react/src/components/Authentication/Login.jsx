// src/components/Authentication/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { EyeIcon, EyeSlashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

// Example: if you have an AuthService to call your backend
import { login as loginService } from "../../services/AuthService";

// If you want to update global auth state via context
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth(); // from AuthContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Call your AuthService to get { token, role }
      const data = await loginService(formData.username, formData.password);
      // data should be { token, role }

      // 2. Update AuthContext
      login(data.token, data.role);

      // 3. Dispatch "storage" event if you rely on that for cross-tab updates
      window.dispatchEvent(new Event("storage"));

      // 4. Redirect based on role
      if (data.role === "BARBER") {
        navigate("/dashboardbarber");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-center">
            <span className="flex-1">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* USERNAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username or Email
            </label>
            <input
              type="text"
              placeholder="Enter your username or email"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         dark:bg-gray-700 dark:text-gray-100 transition-all"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           dark:bg-gray-700 dark:text-gray-100 transition-all"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 dark:text-gray-500 
                           hover:text-blue-600 dark:hover:text-blue-400"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* REMEMBER ME + FORGOT PASSWORD */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 
                           border-gray-300 rounded dark:bg-gray-700"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 
                         dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot password?
            </Link>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 inline-flex justify-center items-center gap-2 
                        rounded-lg border border-transparent font-semibold 
                        bg-blue-600 text-white hover:bg-blue-700 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 
                        focus:ring-offset-2 transition-all ${
                          isLoading ? "opacity-75 cursor-not-allowed" : ""
                        }`}
          >
            {isLoading ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              "Sign in"
            )}
          </button>

          {/* ALTERNATE SIGN-IN */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 
                         border border-gray-300 dark:border-gray-600 rounded-lg 
                         font-medium text-gray-700 dark:text-gray-300 
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Google SVG icon */}
              Google
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 
                         border border-gray-300 dark:border-gray-600 rounded-lg 
                         font-medium text-gray-700 dark:text-gray-300 
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Facebook SVG icon */}
              Facebook
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 
                         dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
