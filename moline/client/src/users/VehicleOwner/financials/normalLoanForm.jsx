import React from 'react'

function normalLoanForm() {
    return (
        <div className="card">
            {loanType && (
                <div className="loan-form">
                    <h4>{loanType === 'normal' ? 'Normal Loan Application' : 'Emergency Loan Application'}</h4>
                    <form onSubmit={handleSubmitApplication}>
                        <div className="form-group">
                            <label>Loan Amount (KES):</label>
                            <input
                                type="number"
                                name="loanAmount"
                                className="form-control"
                                max={loanType === 'normal' ? maxNormalLoan : maxEmergencyLoan}
                                required
                            />
                        </div>
                        {loanType === 'emergency' && (
                            <div className="form-group">
                                <label>Guarantor(s):</label>
                                <textarea
                                    name="guarantor"
                                    className="form-control"
                                    placeholder="Enter guarantor details"
                                    required
                                ></textarea>
                            </div>
                        )}
                        <div className="form-group">
                            <label>Select Matatu:</label>
                            <select name="matatuId" className="form-control" required>
                                <option value="">Select Matatu</option>
                                {matatuLoans.map(matatu => (
                                    <option key={matatu.matatuId} value={matatu.matatuId}>
                                        {matatu.numberPlate} - Max Loan: KES {matatu.maxLoanAmount}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {loanType === 'emergency' && (
                            <div className="form-group">
                                <button type="button" className="btn btn-warning">
                                    Apply for Emergency Loan
                                </button>
                            </div>
                        )}

                        <button type="submit" className="btn btn-success">Submit Application</button>
                    </form>
                </div>
            )}
        </div>
    )
}
export default normalLoanForm