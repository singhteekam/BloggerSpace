import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContactUs from "components/HomePage/ContactUs.js";
import { MemoryRouter } from "react-router-dom";
// import axios from "axios";
import { toast } from "react-toastify";

jest.mock("axios");

jest.mock("react-toastify", () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe("ContactUs Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("1. render form fields and text correctly", () => {
    render(
      <MemoryRouter>
        <ContactUs />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/Enter email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter mobile/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your message/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Send Message/i)).toBeInTheDocument();
  });

  test("2. shows validation toast if email or message is empty", () => {
    render(
      <MemoryRouter>
        <ContactUs />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Send Message/i));
    expect(toast.info).toHaveBeenCalledWith("Please fill mandatory fields");
  });

  test("3. copies email to clipboard and shows success toast", () => {
    render(
      <MemoryRouter>
        <ContactUs />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Copy Email/i));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "singhteekam.in@gmail.com"
    );
    expect(toast.success).toHaveBeenCalledWith("Email Copied to clipboard");
  });

  test("4. copy facebook link to clipboard and shows success toast", () => {
    render(
      <MemoryRouter>
        <ContactUs />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Copy Link/i));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://www.facebook.com/profile.php?id=61573089591301&mibextid=JRoKGi"
    );
    expect(toast.success).toHaveBeenCalledWith(
      "Link Copied to clipboard"
    );
  });
});
