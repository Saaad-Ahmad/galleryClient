import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { BASE_URL } from "../config";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Handle input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/auth/signup`, formData);
      if (res.status >= 200 && res.status < 300) {
        // Auto-login after signup
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
          email: formData.email,
          password: formData.password,
        });

        if (loginRes.data.token) {
          localStorage.setItem("token", loginRes.data.token);
          alert("Account created and logged in successfully!");
          navigate("/profile");
        }
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side (Text Section) */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-500 items-center justify-center p-10 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-sm text-center"
        >
          <h1 className="text-5xl font-bold mb-4">Join Us</h1>
          <p className="text-lg opacity-90">
            Create your account and start your journey with us today.
          </p>
        </motion.div>
      </div>

      {/* Right Side (Signup Form) */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-1 items-center justify-center bg-gray-50 p-6"
      >
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
            Create Account
          </h2>

          {error && (
            <p className="text-red-500 text-center mb-4 font-medium">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition duration-150"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition duration-150"
              />
            </div>

            {/* Password + Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition duration-150 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-5">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-blue-600 hover:underline font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
