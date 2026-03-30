import React, { useState, useEffect } from 'react';
import axiosInstance from '../context/axiosInstance';
import Swal from 'sweetalert2';

const ExpenseTracking = () => {
    const [userRole, setUserRole] = useState('');
    const [userName, setUserName] = useState('');
    const [salaryExpenses, setSalaryExpenses] = useState([]);
    const [otherExpenses, setOtherExpenses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        fetchUserRole();
        fetchExpenses();
    }, []);

    const fetchUserRole = async (retryAttempt = 0) => {
        try {
            const response = await axiosInstance.get('/staff/details');
            setUserRole(response.data.position);
            setUserName(response.data.first_name);
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'An unexpected error occurred while fetching user details';
            Swal.fire({ icon: 'error', title: 'Error', text: errorMessage });
            if (retryAttempt < 3) {
                setRetryCount(retryAttempt + 1);
                fetchUserRole(retryAttempt + 1);
            }
        }
    };

    const fetchExpenses = async (retryAttempt = 0) => {
        try {
            const response = await axiosInstance.get('/staff/all-expenses');
            const { salaryExpenses, otherExpenses } = response.data;
            if (!Array.isArray(salaryExpenses) || !Array.isArray(otherExpenses)) throw new Error('Unexpected response format');
            setSalaryExpenses(salaryExpenses);
            setOtherExpenses(otherExpenses);
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'An unexpected error occurred while fetching expenses';
            Swal.fire({ icon: 'error', title: 'Error', text: errorMessage });
            if (retryAttempt < 3) {
                setRetryCount(retryAttempt + 1);
                setTimeout(() => fetchExpenses(retryAttempt + 1), 2000);
            }
        }
    };

    const handleSearch = async () => { /* Optional */ };
    const handleExport = async () => { /* Optional */ };

    return (
        <div className="content-wrapper min-h-screen bg-gray-100 p-6">
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h1 className="text-3xl font-bold mb-2">Welcome, {userName}</h1>
                <p className="text-lg text-gray-600">Role: <span className="font-semibold text-green-600">{userRole}</span></p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Expense Tracking</h2>

                <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-1/2 px-4 py-2 border rounded-md shadow-sm"
                        placeholder="Search by name or type..."
                    />
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleSearch}
                    >
                        Search
                    </button>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleExport}
                    >
                        Export
                    </button>
                </div>

                {(userRole === 'chairman' || userRole === 'treasurer') && (
                    <div className="overflow-x-auto mb-8">
                        <h3 className="text-xl font-bold mb-2">Salaries and Salary Advances</h3>
                        <table className="w-full table-auto border-collapse bg-white text-sm shadow-sm">
                            <thead className="bg-gray-100 text-left text-gray-600">
                                <tr>
                                    <th className="px-4 py-2 border">Name</th>
                                    <th className="px-4 py-2 border">Expense Type</th>
                                    <th className="px-4 py-2 border">Amount</th>
                                    <th className="px-4 py-2 border">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salaryExpenses.map((expense) => (
                                    <tr key={expense.expense_id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-2">{expense.user_name || 'N/A'}</td>
                                        <td className="px-4 py-2">{expense.expense_type}</td>
                                        <td className="px-4 py-2">KSh {expense.amount}</td>
                                        <td className="px-4 py-2">{new Date(expense.date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {(userRole === 'chiefwhip' || userRole === 'secretary' || userRole === 'chairman' || userRole === 'treasurer') && (
                    <div className="overflow-x-auto mb-8">
                        <h3 className="text-xl font-bold mb-2">Other Expenses</h3>
                        <table className="w-full table-auto border-collapse bg-white text-sm shadow-sm">
                            <thead className="bg-gray-100 text-left text-gray-600">
                                <tr>
                                    <th className="px-4 py-2 border">Expense Type</th>
                                    <th className="px-4 py-2 border">Amount</th>
                                    <th className="px-4 py-2 border">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {otherExpenses.map((expense) => (
                                    <tr key={expense.expense_id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-2">{expense.expense_type}</td>
                                        <td className="px-4 py-2">KSh {expense.amount}</td>
                                        <td className="px-4 py-2">{new Date(expense.date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {userRole === 'treasurer' && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Budget Overview</h3>
                    <div className="text-gray-600">
                        <p>Budget vs Actuals graphs coming soon...</p>
                        {/* Future implementation: Insert Pie/Bar charts here */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseTracking;