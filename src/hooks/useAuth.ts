"use client";

import { useState, useEffect } from "react";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  goal?: "strength" | "cardio" | "general_health";
  isOnboarded: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("vitalis_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, name: string) => {
    setLoading(true);
    // Mock API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockUser: UserProfile = {
      id: "usr_mock_123",
      email,
      name,
      isOnboarded: false,
    };
    setUser(mockUser);
    localStorage.setItem("vitalis_user", JSON.stringify(mockUser));
    setLoading(false);
    return mockUser;
  };

  const signup = async (email: string, name: string) => {
    return login(email, name);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("vitalis_user");
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("vitalis_user", JSON.stringify(updatedUser));
    setLoading(false);
    return updatedUser;
  };

  const completeOnboarding = async (onboardingData: {
    age: number;
    heightCm: number;
    weightKg: number;
    goal: UserProfile["goal"];
  }) => {
    return updateProfile({
      ...onboardingData,
      isOnboarded: true,
    });
  };

  return {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    completeOnboarding,
  };
}
