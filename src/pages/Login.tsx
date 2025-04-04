
import React from "react";
import LoginForm from "@/components/auth/LoginForm";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center text-white font-bold">
              TN
            </div>
            <span className="text-2xl font-bold text-emerald-700">Tax Ninja</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500">Login to access your GST filing dashboard</p>
        </div>
        
        <LoginForm />
        
        <p className="text-center mt-8 text-sm text-gray-500">
          New to Tax Ninja? <a href="/" className="text-emerald-600 hover:underline">Learn more</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
