"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log("Form data:", { name, email, password, passwordConfirmation });

    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const result = await register(name, email, password, passwordConfirmation);

    console.log("Registration result:", result);

    if (result.success) {
      // Use window.location.href for a full page reload to ensure auth state is updated
      window.location.href = "/";
    } else {
      setError(result.message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <section className="relative z-10 overflow-hidden pt-36 pb-16 md:pb-20 lg:pt-[180px] lg:pb-28">
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="shadow-three dark:bg-dark mx-auto max-w-[500px] rounded-sm bg-white px-6 py-10 sm:p-[60px]">
                <h3 className="mb-3 text-center text-2xl font-bold text-black sm:text-3xl dark:text-white">
                  Create your account
                </h3>

                {error && (
                  <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
                    {error}
                  </div>
                )}

                <div className="mb-8 flex items-center justify-center">
                  <span className="bg-body-color/50 hidden h-[1px] w-full max-w-[60px] sm:block"></span>
                  <p className="text-body-color w-full px-5 text-center text-base font-medium">
                    Register with your email
                  </p>
                  <span className="bg-body-color/50 hidden h-[1px] w-full max-w-[60px] sm:block"></span>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-8">
                    <label
                      htmlFor="name"
                      className="text-dark mb-3 block text-sm dark:text-white"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
                    />
                  </div>

                  <div className="mb-8">
                    <label
                      htmlFor="email"
                      className="text-dark mb-3 block text-sm dark:text-white"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
                    />
                  </div>

                  <div className="mb-8">
                    <label
                      htmlFor="password"
                      className="text-dark mb-3 block text-sm dark:text-white"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
                    />
                  </div>

                  <div className="mb-8">
                    <label
                      htmlFor="password_confirmation"
                      className="text-dark mb-3 block text-sm dark:text-white"
                    >
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="password_confirmation"
                      placeholder="Confirm your Password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                      className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
                    />
                  </div>

                  <div className="mb-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="shadow-submit dark:shadow-submit-dark bg-primary hover:bg-primary/90 flex w-full items-center justify-center rounded-xs px-9 py-4 text-base font-medium text-white duration-300 disabled:opacity-50"
                    >
                      {isLoading ? "Creating account..." : "Sign up"}
                    </button>
                  </div>
                </form>

                <p className="text-body-color text-center text-base font-medium">
                  Already have an account?{" "}
                  <Link href="/signin" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
