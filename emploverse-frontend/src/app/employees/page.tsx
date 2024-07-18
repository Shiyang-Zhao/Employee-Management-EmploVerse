"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EmployeeDTO } from "@/models/EmployeeDTO";
import InternalEmployeeAPI from "@/services/internal/EmployeeAPI";
import { useRouter } from "next/navigation";
import UpdateEmployeeForm from "@/components/employee/UpdateEmployeeForm";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/layout/Loading";

export default function Employees() {
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [pageData, setPageData] = useState({
    page: 1,
    size: 10,
    sortBy: "id",
    sortDir: "asc",
  });
  const [loading, setLoading] = useState(false);
  const [allDataFetched, setAllDataFetched] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const observer = useRef<IntersectionObserver>();
  const lastElementRef = useRef<HTMLTableRowElement>(null);

  const fetchEmployees = async () => {
    if (loading || allDataFetched) return;

    setLoading(true);
    try {
      const data = await InternalEmployeeAPI.getEmployeesBySortPage(
        pageData.page,
        pageData.size,
        pageData.sortBy,
        pageData.sortDir
      );

      setEmployees((prev) => [...prev, ...data.content]);
      setAllDataFetched(data.totalPages <= pageData.page);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [pageData.page]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !allDataFetched && !loading) {
          setPageData((prev) => ({ ...prev, page: prev.page + 1 }));
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.1 }
    );

    if (lastElementRef.current)
      observer.current.observe(lastElementRef.current);
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [loading, allDataFetched]);

  const handleEmployeeUpdate = (updatedEmployee: EmployeeDTO) => {
    setEmployees((prevEmployees) =>
      prevEmployees.map((employee) =>
        employee.id === updatedEmployee.id ? updatedEmployee : employee
      )
    );
  };

  const handleRowClick = (id: number) => {
    router.push(`/employees/${id}`);
  };

  const handleEditClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelectedEmployeeId(id);
    const modal = document.getElementById(
      "update_employee_modal"
    ) as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (user && user.employeeId === id) {
      alert("You cannot delete your own employee record.");
      return;
    }
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );
    if (!confirmed) {
      return;
    }
    try {
      await InternalEmployeeAPI.deleteEmployeeById(id);
      setEmployees((prevEmployees) =>
        prevEmployees.filter((employee) => employee.id !== id)
      );
    } catch (error) {
      alert(`Failed to delete the employee with ID: ${id}. ${error}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-8 bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 text-gray-300 relative">
      <Link
        href="/"
        className="absolute top-4 left-4 text-gray-400 font-semibold hover:text-gray-200 transition-colors duration-300"
      >
        Go back to Home
      </Link>
      <h1 className="text-5xl font-extrabold my-4 text-gray-200">Employees</h1>

      <div className="w-full max-w-6xl p-4 bg-gray-800 shadow-xl rounded-lg">
        <table className="min-w-full bg-gray-800 text-gray-300">
          <thead>
            <tr className="bg-gray-700">
              <th className="py-3 px-4 border-b-2 border-gray-600 text-center leading-tight">
                ID
              </th>
              <th className="py-3 px-4 border-b-2 border-gray-600 text-center leading-tight">
                Name
              </th>
              <th className="py-3 px-4 border-b-2 border-gray-600 text-center leading-tight">
                Title
              </th>
              <th className="py-3 px-4 border-b-2 border-gray-600 text-center leading-tight">
                Department
              </th>
              <th className="py-3 px-4 border-b-2 border-gray-600 text-center leading-tight">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, index) => (
              <tr
                key={employee.id}
                ref={index + 1 === employees.length ? lastElementRef : null}
                className="hover:bg-gray-700 cursor-pointer"
                onClick={() => handleRowClick(employee.id)}
              >
                <td className="py-3 px-4 border-b border-gray-600 text-center">
                  {employee.id}
                </td>
                <td className="py-3 px-4 border-b border-gray-600 text-center">
                  {employee.firstName} {employee.lastName}
                </td>
                <td className="py-3 px-4 border-b border-gray-600 text-center">
                  {employee.firstName}
                </td>
                <td className="py-3 px-4 border-b border-gray-600 text-center">
                  {employee.firstName}
                </td>
                <td className="py-3 px-4 border-b border-gray-600 text-center">
                  <div className="space-x-2">
                    <button
                      className="px-3 py-1 bg-cyan-600 text-gray-200 rounded-lg hover:bg-cyan-500 transition-colors duration-300"
                      onClick={(e) => handleEditClick(e, employee.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-gray-200 rounded-lg hover:bg-red-500 transition-colors duration-300"
                      onClick={(e) => handleDeleteClick(e, employee.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && !allDataFetched && <Loading />}
      </div>
      <UpdateEmployeeForm
        id={selectedEmployeeId}
        onEmployeeUpdate={handleEmployeeUpdate}
      />
    </div>
  );
}
