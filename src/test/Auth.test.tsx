import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Auth from "../pages/Auth";
import { MemoryRouter } from "react-router-dom";
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
  const renderAuth = () =>
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Auth />
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies Login/Signup toggle button functionality", () => {
    renderAuth();
    
    // Default is Login. Toggle to Create account using the tab button.
    const toggleTab = screen.getAllByRole("button", { name: /^Create account$/ }).find(b => b.getAttribute("type") === "button");
    expect(toggleTab).toBeDefined();
    fireEvent.click(toggleTab!);
    
    // Should be Signup now (Submit button text is Create account)
    const submitBtn = screen.getAllByRole("button", { name: /^Create account$/ }).find(b => b.getAttribute("type") === "submit");
    expect(submitBtn).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Display name")).toBeInTheDocument();
  });

  it("verifies Submit button triggers authentication", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    
    renderAuth();

    fireEvent.change(screen.getByPlaceholderText("Email address"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });
    
    const submitBtn = screen.getAllByRole("button", { name: /^Sign in$/ }).find(b => b.getAttribute("type") === "submit");
    expect(submitBtn).toBeDefined();
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("test@test.com", "password123");
    });
  });

  it("verifies Sign Up button triggers registration", async () => {
    mockSignUp.mockResolvedValue({ error: null });
    
    renderAuth();

    // Switch to Sign Up mode using the tab button
    const toggleTab = screen.getAllByRole("button", { name: /^Create account$/ }).find(b => b.getAttribute("type") === "button");
    expect(toggleTab).toBeDefined();
    fireEvent.click(toggleTab!);

    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText("Email address"), { target: { value: "newuser@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByPlaceholderText("Display name"), { target: { value: "New User" } });

    const submitBtn = screen.getAllByRole("button", { name: /^Create account$/ }).find(b => b.getAttribute("type") === "submit");
    expect(submitBtn).toBeDefined();
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith("newuser@test.com", "password123", "New User");
    });
  });

  it("verifies Google Login button triggers OAuth", async () => {
    renderAuth();

    const googleBtn = screen.getByText(/Continue with Google/i);
    await act(async () => {
      fireEvent.click(googleBtn);
    });

    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "google",
        })
      );
    });
  });

  it("verifies Forgot Password link navigation", () => {
    renderAuth();

    const forgotPasswordLink = screen.getByText(/Forgot/i);
    fireEvent.click(forgotPasswordLink);

    expect(mockNavigate).toHaveBeenCalledWith("/forgot-password");
  });
});
