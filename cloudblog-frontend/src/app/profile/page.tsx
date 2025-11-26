"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Breadcrumb from "@/components/Common/Breadcrumb";

const ProfilePage = () => {
  const { user, loading: authLoading, updateProfile } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
    image: "",
  });

  useEffect(() => {
    // Redirect to signin if not authenticated
    if (!authLoading && !user) {
      router.push("/signin");
      return;
    }

    // Redirect Admin to dashboard
    if (!authLoading && user?.role === "Admin") {
      router.push("/dashboard");
      return;
    }

    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        designation: user.designation || "",
        image: user.image || "",
      });
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing) {
      return; // Prevent submission if not in editing mode
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("http://127.0.0.1:8000/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          designation: formData.designation,
          image: formData.image,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || "Failed to update profile");
        return;
      }

      const result = await response.json();

      setIsEditing(false);
      alert(result.message || "Profile updated successfully");
      // Update local user state
      if (result.user) {
        setFormData({
          name: result.user.name || "",
          email: result.user.email || "",
          designation: result.user.designation || "",
          image: result.user.image || "",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  // Don't render if not authenticated or Admin
  if (authLoading || !user || user.role === "Admin") {
    return null;
  }

  return (
    <>
      <Breadcrumb
        pageName="My Profile"
        description="View and manage your profile information"
      />

      <section className="pt-[120px] pb-[120px]">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="dark:bg-dark dark:border-stroke-dark rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
              {/* Profile Header */}
              <div className="mb-8 flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full">
                    {formData.image ? (
                      <Image
                        src={formData.image}
                        alt={formData.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="bg-primary flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                        {formData.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-dark text-2xl font-bold dark:text-white">
                      {formData.name}
                    </h2>
                    {formData.designation && (
                      <p className="text-body-color dark:text-body-color-dark mt-1">
                        {formData.designation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit Profile Button - Next to profile header */}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="bg-primary hover:bg-primary/90 rounded-md px-8 py-3 text-base font-semibold text-white transition duration-300"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label
                    htmlFor="name"
                    className="text-dark mb-2 block text-sm font-semibold dark:text-white"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="text-body-color focus:border-primary dark:border-stroke-dark dark:text-body-color-dark w-full rounded-md border border-gray-200 px-4 py-3 text-base transition outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="email"
                    className="text-dark mb-2 block text-sm font-semibold dark:text-white"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="text-body-color focus:border-primary dark:border-stroke-dark dark:text-body-color-dark w-full rounded-md border border-gray-200 px-4 py-3 text-base transition outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="designation"
                    className="text-dark mb-2 block text-sm font-semibold dark:text-white"
                  >
                    Designation / Job Title
                  </label>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="text-body-color focus:border-primary dark:border-stroke-dark dark:text-body-color-dark w-full rounded-md border border-gray-200 px-4 py-3 text-base transition outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800"
                  />
                </div>

                <div className="mb-8">
                  <label
                    htmlFor="image"
                    className="text-dark mb-2 block text-sm font-semibold dark:text-white"
                  >
                    Profile Image URL
                  </label>
                  <input
                    type="url"
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="text-body-color focus:border-primary dark:border-stroke-dark dark:text-body-color-dark w-full rounded-md border border-gray-200 px-4 py-3 text-base transition outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800"
                    placeholder="https://example.com/your-image.jpg"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {isEditing && (
                    <>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 rounded-md px-8 py-3 text-base font-semibold text-white transition duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          if (user) {
                            setFormData({
                              name: user.name || "",
                              email: user.email || "",
                              designation: (user as any).designation || "",
                              image: (user as any).image || "",
                            });
                          }
                        }}
                        className="text-body-color dark:border-stroke-dark dark:text-body-color-dark rounded-md border border-gray-300 px-8 py-3 text-base font-semibold transition duration-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProfilePage;
