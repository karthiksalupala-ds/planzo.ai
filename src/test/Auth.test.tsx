import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Auth from "../pages/Auth";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import { supabase } from "@/integrations/supabase/client";

// Mock hooks
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => {
  const mock = {
    hasSupabaseConfig: true,
    supabaseConfigError: null,
    supabase: {
      auth: {
        signInWithOAuth: vi.fn(),
      },
    },
  };
  return mock;
});

describe("Auth Page Buttons Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies Login/Signup toggle button functionality", () => {
    render(
      <BrowserRouter>
        <Auth />
     </BrowserRouter>
    );
    
    // Default is Login
    const toggleBtn = screen.getByText("Sign Up");
    fireEvent.click(toggleBtn);
    
    // Should be Signup now (Button text changes to Create Account)
    expect(screen.getByText("Create Account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Display name")).toBeInTheDocument();
  });

  it("verifies Submit button triggers authentication", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Email address"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });
    
    const submitBtn = screen.getByRole("button", { name: /^Sign In$/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("test@test.com", "password123");
    });
  });

  it("verifies Sign Up button triggers registration", async () => {
    mockSignUp.mockResolvedValue({ error: null });
    
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    // Switch to Sign Up mode
    const toggleBtn = screen.getByText("Sign Up");
    fireEvent.click(toggleBtn);

    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText("Email address"), { target: { value: "newuser@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByPlaceholderText("Display name"), { target: { value: "New User" } });

    const submitBtn = screen.getByRole("button", { name: /^Create Account$/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith("newuser@test.com", "password123", "New User");
    });
  });

  it("verifies Google Login button triggers OAuth", async () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    const googleBtn = screen.getByText(/Continue with Google/i);
    fireEvent.click(googleBtn);

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
      })
    );
  });

  it("verifies Forgot Password link navigation", () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    const forgotPasswordLink = screen.getByText(/Forgot/i);
    fireEvent.click(forgotPasswordLink);

    expect(mockNavigate).toHaveBeenCalledWith("/forgot-password");
  });
});