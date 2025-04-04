
import React from "react";
import RegisterForm from "@/components/auth/RegisterForm";

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center text-white font-bold">
              TN
            </div>
            <span className="text-2xl font-bold text-emerald-700">Tax Ninja</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-800">Create Your Account</h1>
          <p className="text-gray-500">Register to start automating your GST filings</p>
        </div>
        
        <RegisterForm />
        
        <p className="text-center mt-8 text-sm text-gray-500">
          Already have an account? <a href="/login" className="text-emerald-600 hover:underline">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
