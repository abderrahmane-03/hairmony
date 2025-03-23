"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {Link ,useNavigate}from "react-router-dom"
import { CheckCircleIcon, XCircleIcon, EyeIcon, EyeSlashIcon, ArrowPathIcon } from "@heroicons/react/24/outline"

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "client", // "client" or "barber"
    agreed: false,
    barbershopId: "-1", // -1 => create new
    barbershopName: "",
    barbershopAddress: "",
  })

  const [pictureFile, setPictureFile] = useState(null) // user picture
  const [preview, setPreview] = useState(null)
  const [barbershopPic, setBarbershopPic] = useState(null) // barbershop picture
  const [barbershopPicPreview, setBarbershopPicPreview] = useState(null)

  const [barbershops, setBarbershops] = useState([]) // existing barbershops
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  // Basic password checks
  const passwordStrength = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*]/.test(formData.password),
  }

  // Fetch existing barbershops on mount
  useEffect(() => {
    axios
      .get("http://localhost:8443/barbershops")
      .then((res) => setBarbershops(res.data))
      .catch((err) => console.error("Failed to fetch barbershops:", err))
  }, [])

  // Handle text changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  // Handle user profile picture
  const handleUserPictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPictureFile(file)
      setPreview(URL.createObjectURL(file))
      setErrors((prev) => ({ ...prev, picture: "" }))
    }
  }

  // Handle barbershop picture
  const handleBarbershopPictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setBarbershopPic(file)
      setBarbershopPicPreview(URL.createObjectURL(file))
    }
  }

  // Simple validation
  const validateForm = () => {
    const newErrors = {}
    if (!formData.username.trim()) newErrors.username = "Username is required"
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = "Invalid email address"
    }
    if (
      !passwordStrength.length ||
      !passwordStrength.uppercase ||
      !passwordStrength.number ||
      !passwordStrength.special
    ) {
      newErrors.password = "Password does not meet requirements"
    }
    if (!pictureFile) newErrors.picture = "Profile picture is required"
    if (!formData.agreed) newErrors.agreed = "You must agree to terms"

    // If role=barber
    if (formData.role === "barber") {
      if (formData.barbershopId === "-1") {
        // Creating new barbershop
        if (!formData.barbershopName.trim()) newErrors.barbershopName = "Barbershop name is required"
        if (!formData.barbershopAddress.trim()) newErrors.barbershopAddress = "Barbershop address is required"
      } else if (!formData.barbershopId) {
        newErrors.barbershopId = "Select a barbershop or create a new one"
      }
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      // Build multipart form data
      const formDataToSend = new FormData()
      formDataToSend.append("username", formData.username)
      formDataToSend.append("email", formData.email)
      formDataToSend.append("password", formData.password)
      formDataToSend.append("role", formData.role)
      if (pictureFile) {
        formDataToSend.append("picture", pictureFile)
      }

      // If barber, handle barbershop
      if (formData.role === "barber") {
        formDataToSend.append("barbershopId", formData.barbershopId)
        if (formData.barbershopId === "-1") {
          // New barbershop
          formDataToSend.append("barbershopName", formData.barbershopName)
          formDataToSend.append("barbershopAddress", formData.barbershopAddress)
          if (barbershopPic) {
            formDataToSend.append("barbershopPicture", barbershopPic)
          }
        }
      }

      await axios.post("http://localhost:8443/auth/register", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      navigate("/login?registered=true")
    } catch (err) {
      console.error("Registration error:", err)
      setErrors({ server: err.response?.data?.message || "Registration failed." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Your Account</h1>
          <p className="text-gray-600 dark:text-gray-300">Join our community in just a few steps</p>
        </div>

        {errors.server && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-center">
            <XCircleIcon className="w-5 h-5 mr-2" />
            <span className="flex-1">{errors.server}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
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

            {/* Picture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                name="picture"
                className={`w-full px-4 py-3 border ${
                  errors.picture ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all`}
                onChange={handleUserPictureChange}
              />
              {/* Preview */}
              {preview && (
                <img
                  src={preview || "/placeholder.svg"}
                  alt="Preview"
                  className="mt-3 w-24 h-24 object-cover rounded-lg border"
                />
              )}
              {errors.picture && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <XCircleIcon className="w-4 h-4 mr-1" /> {errors.picture}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
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
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {/* Password checks */}
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <XCircleIcon className="w-4 h-4 mr-1" /> {errors.password}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Type</label>
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

          {/* Barbershop Section (only for barbers) */}
          {formData.role === "barber" && (
            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Barbershop Information</h3>

              {/* Barbershop Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Existing Barbershop (or choose Create New)
                </label>
                <select
                  name="barbershopId"
                  value={formData.barbershopId}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${
                    errors.barbershopId ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all`}
                >
                  <option value="">-- Select Barbershop --</option>
                  <option value="-1">Create New</option>
                  {barbershops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
                {errors.barbershopId && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <XCircleIcon className="w-4 h-4 mr-1" /> {errors.barbershopId}
                  </p>
                )}
              </div>

              {/* If creating a new barbershop */}
              {formData.barbershopId === "-1" && (
                <div className="space-y-6 border-t border-blue-200 dark:border-blue-800 pt-6">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">New Barbershop Details</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Barbershop Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Barbershop Name
                      </label>
                      <input
                        name="barbershopName"
                        placeholder="Enter barbershop name"
                        value={formData.barbershopName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border ${
                          errors.barbershopName ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all`}
                      />
                      {errors.barbershopName && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <XCircleIcon className="w-4 h-4 mr-1" /> {errors.barbershopName}
                        </p>
                      )}
                    </div>

                    {/* Barbershop Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Barbershop Address
                      </label>
                      <input
                        name="barbershopAddress"
                        placeholder="Enter barbershop address"
                        value={formData.barbershopAddress}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border ${
                          errors.barbershopAddress ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all`}
                      />
                      {errors.barbershopAddress && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <XCircleIcon className="w-4 h-4 mr-1" /> {errors.barbershopAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Barbershop Picture */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Barbershop Picture (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBarbershopPictureChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all"
                    />
                    {/* Preview */}
                    {barbershopPicPreview && (
                      <img
                        src={barbershopPicPreview || "/placeholder.svg"}
                        alt="Barbershop Preview"
                        className="mt-3 w-24 h-24 object-cover rounded-lg border"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Terms and conditions */}
          <div className="flex items-center">
            <input
              id="agreed"
              name="agreed"
              type="checkbox"
              checked={formData.agreed}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700"
            />
            <label htmlFor="agreed" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
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

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 inline-flex justify-center items-center gap-2 rounded-lg border border-transparent font-semibold bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all ${
              loading ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
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
  )
}

