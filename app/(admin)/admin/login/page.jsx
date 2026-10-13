'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation.js'
import { adminLogin } from '@/app/api/admin.js'
import logo from '@/app/assets/logo.png' 
import { adminLoginPageStyles as s } from '@/app/assets/dummyStyles.jsx' 
import Image from 'next/image'

const page = () => {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const { data } = await adminLogin(form);
            if (data.token) {
                localStorage.setItem("adminToken", data.token);
            };
            router.push("/admin/dashboard");

        } catch (error) {
            setMessage(error.response?.data?.message || "Admin login failed");

        } finally {
            setLoading(false);
        };
    }

    return (
        <div className={s.pageContainer}>
            <div className={s.card}>
                <div className={s.leftPanel}>
                    <div className={s.leftContent}>
                        <p className={s.leftEyebrow}>System Access</p>
                        <div className={s.leftLogoRow}>
                            <Image
                                src={logo}
                                alt='image'
                                className={s.leftLogoImg}
                                width={0}
                                height={0}
                            />
                        </div>

                        <h1 className={s.leftHeading}>
                            BookMe
                            <br />
                            <span className={s.leftHeadingAccent}>Admin</span>
                        </h1>
                        <p className={s.leftDescription}>
                            Money movement, user overview and payout request. Monitor the platform from one desk.
                        </p>
                    </div>
                </div>

                <div className={s.rightPanel}>
                    <h2 className={s.formTitle}>Admin Login</h2>
                    <p className={s.formSubtitle}>
                        Enter your credential to access the dashboard
                    </p>

                    {message && <div className={s.messageBox}>{message}</div>}

                    <form onSubmit={handleSubmit} className={s.form}>
                        <div>
                            <label className={s.inputLabel}>Email address</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(event) => setForm((prev) => ({ ...prev, email: email.target.value }))}
                                className={s.textInput}
                                placeholder='Enter admin email'
                                required
                            />

                            <div>
                                <label className={s.inputLabel}>Password</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                                    className={s.textInput}
                                    placeholder='00000000'
                                    required
                                />
                            </div>

                            <button type='submit' disabled={loading} className={s.submitButton}>
                                {loading ? "Authenticating..." : "Secure Login"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default page