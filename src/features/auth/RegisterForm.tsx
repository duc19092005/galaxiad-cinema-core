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

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;