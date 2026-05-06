import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TaskSubmissionsPage from "../TaskSubmissionsPage";
import axiosInstance from "../../api/axiosInstance";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock axios
vi.mock("../../api/axiosInstance", () => ({
    default: {
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

describe("TaskSubmissionsPage - Admin Remarks", () => {
    it("renders remarks textarea and updates state", async () => {
        // Mock data
        const mockTask = { _id: "task1", title: "Test Task" };
        const mockSubmissions = [
            {
                _id: "sub1",
                status: "SUBMITTED",
                ambassadorId: { firstName: "John", lastName: "Doe" },
                submittedAt: new Date().toISOString(),
                responses: [],
                content: "Here is my work",
                links: [],
                proofFiles: [],
            },
        ];

        (axiosInstance.get as any).mockResolvedValueOnce({ data: mockTask });
        (axiosInstance.get as any).mockResolvedValueOnce({ data: mockSubmissions });

        render(
            <MemoryRouter initialEntries={["/tasks/submissions/task1"]}>
                <Routes>
                    <Route path="/tasks/submissions/:id" element={<TaskSubmissionsPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.getByText("Test Task")).toBeInTheDocument();
        });

        // Check for textarea
        const textarea = screen.getByPlaceholderText("Provide feedback for the fellow...");
        expect(textarea).toBeInTheDocument();

        // Simulate typing
        fireEvent.change(textarea, { target: { value: "Good effort!" } });
        expect(textarea).toHaveValue("Good effort!");

        // Simulate Verify (Approve)
        const approveBtn = screen.getByText("Approve");
        fireEvent.click(approveBtn);

        // Verify API call includes feedback
        await waitFor(() => {
            expect(axiosInstance.patch).toHaveBeenCalledWith(
                "/tasks/submissions/sub1/verify",
                expect.objectContaining({
                    status: "COMPLETED",
                    feedback: "Good effort!",
                })
            );
        });
    });
});
