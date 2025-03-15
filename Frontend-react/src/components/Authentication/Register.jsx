// RegisterForm.jsx
import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircleIcon, XCircleIcon, EyeIcon, EyeSlashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "client",
    agreed: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const passwordStrength = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*]/.test(formData.password)
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) 
      newErrors.email = "Invalid email address";
    if (!passwordStrength.length || !passwordStrength.uppercase || 
        !passwordStrength.number || !passwordStrength.special) 
      newErrors.password = "Password does not meet requirements";
    if (!formData.agreed) newErrors.agreed = "You must agree to the terms";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:8443/auth/register", formData);
      navigate("/login?registered=true");
    } catch (err) {
      setErrors({
        server: err.response?.data?.message || "Registration failed. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Join our community in just a few steps
          </p>
        </div>

        {errors.server && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-center">
            <XCircleIcon className="w-5 h-5 mr-2" />
            <span className="flex-1">{errors.server}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                name="username"
                placeholder="Enter your username"
                className={`w-full px-4 py-3 border ${
                  errors.username ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all`}
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <XCircleIcon className="w-4 h-4 mr-1" /> {errors.username}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className={`w-full px-4 py-3 border ${
                  errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <XCircleIcon className="w-4 h-4 mr-1" /> {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  className={`w-full px-4 py-3 pr-12 border ${
                    errors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all`}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  {passwordStrength.length ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className="text-sm">8+ characters</span>
                </div>
                <div className="flex items-center">
                  {passwordStrength.uppercase ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className="text-sm">Uppercase letter</span>
                </div>
                <div className="flex items-center">
                  {passwordStrength.number ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className="text-sm">Number</span>
                </div>
                <div className="flex items-center">
                  {passwordStrength.special ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className="text-sm">Special character</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["client", "barber"].map((role) => (
                  <label
                    key={role}
                    className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.role === role
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="agreed"
              name="agreed"
              type="checkbox"
              checked={formData.agreed}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700"
            />
            <label
              htmlFor="agreed"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              I agree to the{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.agreed && (
            <p className="text-sm text-red-500 flex items-center">
              <XCircleIcon className="w-4 h-4 mr-1" /> {errors.agreed}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 inline-flex justify-center items-center gap-2 rounded-lg border border-transparent font-semibold bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all ${
              loading ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;