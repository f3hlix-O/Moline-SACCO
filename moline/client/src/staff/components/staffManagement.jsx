import axiosInstance from '../../context/axiosInstance';

const fetchSalary = async () => {
    try {
        const response = await axiosInstance.get('/staff/salary');
        return response.data.salary;
    } catch (error) {
        console.error('Error fetching salary:', error);
        throw new Error('Failed to fetch salary');
    }
};

const fetchUserPosition = async () => {
    try {
        const response = await axiosInstance.get('/staff/position');
        return response.data.position.toLowerCase();
    } catch (error) {
        console.error('Error fetching user position:', error);
        throw new Error('Failed to fetch user position');
    }
};

const fetchStaffDetails = async () => {
    try {
        const response = await axiosInstance.get('/staff/all-details');
        return response.data;
    } catch (error) {
        console.error('Error fetching staff details:', error);
        throw new Error('Failed to fetch staff details');
    }
};

const fetchSalaryAdvanceApplications = async () => {
    try {
        const response = await axiosInstance.get('/staff/salary-advance-applications');
        return response.data;
    } catch (error) {
        console.error('Error fetching salary advance applications:', error);
        throw new Error('Failed to fetch salary advance applications');
    }
};

const applyForAdvanceSalary = async ({ amount, userId }) => {
    try {
        const response = await axiosInstance.post('/staff/apply-advance', {
            amount,
            expenseType: 'salaryAdvance',
            userId
        });
        return response.data;
    } catch (error) {
        console.error('Error applying for advance salary:', error);
        throw new Error('Failed to apply for advance salary');
    }
};
const paySalary = async (staffDetails) => {
  try {
      const salaryPayments = staffDetails.map((staff) => {
          const advanceAmount = staff.salary / 2;
          const finalSalary = staff.salary - advanceAmount;

          return {
              userId: staff.user_id,
              salary: staff.salary,
              advanceAmount,
              finalSalary,
              paymentType: 'Salary Payment',
              date: new Date().toISOString(),
          };
      });

      const response = await axiosInstance.post('/staff/pay-salary', { salaryPayments });

      if (response.status === 200) {
          return {
              success: true,
              message: response.data.message || 'Salaries paid successfully',
              receipt: response.data.receipt, 
          };
      } else {
          throw new Error(response.data.error || 'Failed to process salary payments');
      }
  } catch (error) {
      console.error('Error paying salaries:', error);
      throw new Error(error.message || 'An error occurred while paying salaries');
  }
};

export{
  fetchSalary,
  fetchUserPosition,
  fetchStaffDetails,
  fetchSalaryAdvanceApplications,
  applyForAdvanceSalary,
  paySalary
}