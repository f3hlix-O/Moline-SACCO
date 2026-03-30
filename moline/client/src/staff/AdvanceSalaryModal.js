import React from 'react';

const AdvanceSalaryModal = ({ show, handleClose, handleApply, advanceAmount }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-xl font-semibold mb-4">Apply for Advance Salary</h3>
                <form onSubmit={handleApply}>
                    <div className="mb-4">
                        <label htmlFor="advanceAmount" className="block text-sm font-medium text-gray-700">Advance Amount (half of salary):</label>
                        <input
                            type="number"
                            id="advanceAmount"
                            name="advanceAmount"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            readOnly
                            value={advanceAmount}
                        />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="btn btn-primary bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">Apply</button>
                        <button type="button" className="btn btn-secondary bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" onClick={handleClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdvanceSalaryModal;
