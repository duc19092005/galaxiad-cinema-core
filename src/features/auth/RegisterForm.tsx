import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Dùng để chuyển trang

import {
    Clapperboard,
    User,
    Mail,
    CreditCard,
    Phone,
    Calendar,
    Lock,
    Loader2,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { identityAxios } from '../../api/axiosClient';
import type { RegisterRequest, ApiErrorResponse } from '../../types/auth.types';

interface FormData {
    fullName: string;
    email: string;
    identityCard: string;
    phoneNumber: string;
    birthDate: string;
    password: string;
    confirmPassword: string;
}

// --- Component InputField tái sử dụng ---
const InputField = ({
    label,
    name,
    type = 'text',
    icon: Icon,
    placeholder,
    value,
    onChange,
    colSpan = 'col-span-1', // Mặc định chiếm 1 cột
}: {
    label: string;
    name: keyof FormData;
    type?: string;
    icon: React.ElementType;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    colSpan?: string;
}) => (
    <div className={`flex flex-col ${colSpan}`}>
        <label
            htmlFor={name}
            className="mb-2 text-sm font-medium text-gray-300"
        >
            {label}
        </label>
        <div className="relative group">
            {/* Icon */}
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Icon className="w-5 h-5 text-gray-500 transition-colors group-focus-within:text-red-500" />
            </div>
            {/* Input */}
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full py-3.5 pl-12 pr-4 text-white placeholder-gray-500 bg-gray-800 border border-gray-700 rounded-lg outline-none focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)] focus:ring-1 focus:ring-red-600 transition-all duration-200"
                required
            />
        </div>
    </div>
);

// --- Main Component ---
const RegisterForm: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        identityCard: '',
        phoneNumber: '',
        birthDate: '',
        password: '',
        confirmPassword: '',
    });

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (formData.password !== formData.confirmPassword) {
            setErrorMsg('Passwords do not match!');
            return;
        }

        try {
            setLoading(true);
            const payload: RegisterRequest = {
                userName: formData.fullName,
                userEmail: formData.email,
                identityCode: formData.identityCard,
                phoneNumber: formData.phoneNumber,
                userPassword: formData.password,
                userRepassword: formData.confirmPassword,
                dateOfBirth: formData.birthDate ? new Date(formData.birthDate).toISOString() : new Date().toISOString()
            };

            const res = await authApi.regularRegister(payload);

            if (res.isSuccess) {
                toast.success(res.message || 'Registration successful!');
                navigate('/login');
            }

        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response) {
                const data = error.response.data as ApiErrorResponse;
                setErrorMsg(data.message || 'Authentication error from server.');
            } else {
                setErrorMsg('Unable to connect to the server.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            // BE handles both login and register via the same redirect
            const response = await identityAxios.get('/IdentityAccess/google-login?platform=web');
            const data = response.data;
            
            if (data.isSuccess) {
                window.location.href = data.data.redirectUrl; 
            } else {
                setErrorMsg('Failed to initialize Google Registration.');
                setLoading(false);
            }
        } catch (error) {
            console.error("Registration init fail", error);
            setErrorMsg('Failed to connect to Google service.');
            setLoading(false);
        }
    };

    return (
        <div className="relative w-full min-h-screen overflow-hidden bg-black font-sans selection:bg-red-600 selection:text-white">

            {/* Background Layer */}
            <div
                className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop')",
                }}
            ></div>

            <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

            {/* Main Content */}
            <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 overflow-y-auto">
                <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-500">
                    <div className="relative">
                        {/* Red Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-2xl blur-lg opacity-30"></div>

                        <div className="relative bg-black/80 border border-gray-800 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl">

                            {/* Header */}
                            <div className="flex flex-col items-center mb-8 text-center">
                                <div className="p-3 bg-red-600/20 rounded-full mb-4 border border-red-600/40 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                                    <Clapperboard className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-[0.2em] drop-shadow-md">
                                    Member Registration
                                </h1>
                                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-red-600 to-transparent mt-3 mb-2"></div>
                                <p className="text-gray-400 text-sm font-medium tracking-wide">
                                    Join us now to receive exclusive ticket & snack offers
                                </p>
                            </div>

                            {/* Status Messages */}
                            {errorMsg && (
                                <div className="mb-6 p-4 rounded-lg bg-red-900/40 border border-red-500/50 flex items-center text-red-100 animate-pulse">
                                    <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
                                    <span className="text-sm font-medium">{errorMsg}</span>
                                </div>
                            )}

                            {/* Form Content */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Full Name" name="fullName" icon={User} placeholder="e.g. John Doe" value={formData.fullName} onChange={handleChange} colSpan="md:col-span-2" />

                                    <InputField label="Email Address" name="email" type="email" icon={Mail} placeholder="john@example.com" value={formData.email} onChange={handleChange} colSpan="md:col-span-2" />

                                    <InputField label="Identity Code / ID" name="identityCard" icon={CreditCard} placeholder="Your ID number" value={formData.identityCard} onChange={handleChange} colSpan="md:col-span-2" />

                                    <InputField label="Phone Number" name="phoneNumber" type="tel" icon={Phone} placeholder="090..." value={formData.phoneNumber} onChange={handleChange} />

                                    <InputField label="Date of Birth" name="birthDate" type="date" icon={Calendar} value={formData.birthDate} onChange={handleChange} />

                                    <InputField label="Password" name="password" type="password" icon={Lock} placeholder="••••••••" value={formData.password} onChange={handleChange} />

                                    <InputField label="Confirm Password" name="confirmPassword" type="password" icon={Lock} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} />
                                </div>

                                <div className="mt-6 text-center text-lg text-gray-500">
                                    Already have a account ? <Link to="/login" className="text-red-500 hover:text-red-400 font-bold transition-colors">Sign in here</Link>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`group relative w-full mt-8 py-4 overflow-hidden rounded-xl text-white font-black uppercase tracking-[0.15em] shadow-[0_4px_20px_rgba(220,38,38,0.5)] ring-1 ring-white/10
                                    ${loading ? 'bg-red-900 cursor-not-allowed opacity-80' : 'bg-red-700 transition-all hover:scale-[1.02] hover:bg-red-600 hover:shadow-[0_6px_30px_rgba(220,38,38,0.7)] active:scale-95'}
                                    `}
                                >
                                    {!loading && (
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
                                    )}

                                    <div className="flex items-center justify-center gap-3">
                                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                        <span className="relative text-lg">
                                            {loading ? 'Processing...' : 'Register Now'}
                                        </span>
                                    </div>
                                </button>
                            </form>

                            <div className="relative flex items-center justify-center mt-8 mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-700/80"></div>
                                </div>
                                <div className="relative px-4 text-xs font-semibold tracking-widest text-gray-400 uppercase bg-black">
                                    OR REGISTER WITH
                                </div>
                            </div>

                            <button 
                                type="button" 
                                disabled={loading} 
                                onClick={handleGoogleLogin} 
                                className={`relative flex items-center justify-center w-full py-3.5 mb-2 overflow-hidden rounded-xl bg-white text-gray-900 font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(255,255,255,0.1)] ring-1 ring-white/20 transition-all hover:scale-[1.02] hover:bg-gray-100 hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)] active:scale-95 ${loading ? 'cursor-not-allowed opacity-80' : ''}`}
                            >
                                <div className="flex items-center justify-center gap-3 w-full">
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                                    ) : (
                                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                            <path fill="none" d="M0 0h48v48H0z"></path>
                                        </svg>
                                    )}
                                    <span className="text-sm font-bold uppercase tracking-wider">
                                        {loading ? 'Processing...' : 'Google Account'}
                                    </span>
                                </div>
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;