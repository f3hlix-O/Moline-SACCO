import axiosInstance from '../../context/axiosInstance';
import Swal from 'sweetalert2';
import { getRoutes } from '../../users/components/fleet';

const fetchMatatus = async () => {
    try {
        const response = await axiosInstance.get('/matatus');
        const data = await response.data;
    } catch (error) {
        console.error('Error fetching matatus:', error);
        return [];
    }
};

const fetchMatatuDetais = async () => {
    try {
        const response = await axiosInstance.get('/reports/matatuDetails');
        const data = response.data;
        return data;
    } catch (error) {
        console.error('Error fetching matatu data:', error);
        return [];
    }
};

const fetchDrivers = async () => {
    try {
        const response = await axiosInstance.get('/matatus/drivers');
        return response.data;
    } catch (error) {
        console.error('Error fetching drivers:', error);
        return [];
    }
};

const assignDrivers = async (matatuId, drivers, setMatatus) => {
    const { value: selectedDriver } = await Swal.fire({
        title: 'Assign Driver',
        input: 'select',
        inputOptions: drivers.reduce((options, driver) => {
            options[driver.user_id] = driver.first_name;
            return options;
        }, {}),
        inputPlaceholder: 'Select a driver',
        showCancelButton: true,
    });

    if (selectedDriver) {
        try {
            const response = await axiosInstance.post(`/matatus/${matatuId}/assignDriver`, { driverId: selectedDriver });

            if (response.status == 200) {
                Swal.fire('Driver Assigned', 'Driver assigned successfully', 'success');
                const updatedMatatus = await fetchMatatuDetais();
                setMatatus(updatedMatatus);
            } else {
                throw new Error('Failed to assign driver');
            }
        } catch (error) {
            console.error('Error assigning driver:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while assigning the driver. Please try again later.',
            });
        }
    }
};

const editMatatu = async (matatuData, setMatatus) => {
    try {
        const { value: formValues } = await Swal.fire({
            title: 'Edit Matatu',
            html: `
                <div class="form-group">
                    <label for="plateNumber">Plate Number:</label>
                    <input type="text" id="plateNumber" class="form-control" value="${matatuData.number_plate}" />
                </div>
                <div class="form-group">
                    <label for="status">Status:</label>
                    <input type="text" id="status" class="form-control" value="${matatuData.status}" />
                </div>
                <div class="form-group">
                    <label for="insurance">Insurance Status:</label>
                    <input type="text" id="insurance" class="form-control" value="${matatuData.insurance_status}" />
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save Changes',
            focusConfirm: false,
            preConfirm: () => {
                const updatedPlateNumber = document.getElementById('plateNumber').value;
                const updatedStatus = document.getElementById('status').value;
                const updatedInsurance = document.getElementById('insurance').value;

                if (!updatedPlateNumber || !updatedStatus || !updatedInsurance) {
                    Swal.showValidationMessage('Please fill in all fields');
                    return false;
                }

                return {
                    plate_number: updatedPlateNumber,
                    status: updatedStatus,
                    insurance_status: updatedInsurance
                };
            }
        });

        if (formValues) {
            const updateResponse = await axiosInstance.post(`/matatus/${matatuData.matatu_id}/update`, formValues);

            if (updateResponse.status >= 200 && updateResponse.status < 300) {
                Swal.fire('Changes Saved', 'Matatu information updated successfully', 'success');
                const updatedMatatus = await fetchMatatuDetais();
                setMatatus(updatedMatatus);
            } else {
                throw new Error('Failed to update matatu information');
            }
        }
    } catch (error) {
        console.error('Error editing matatu:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while editing matatu information. Please try again later.',
        });
    }
};

const deleteMatatu = async (matatuId, setMatatus) => {
    try {
        const response = await axiosInstance.delete(`/matatus/${matatuId}`);
        if (response.status >= 200 && response.status < 300) {
            Swal.fire({
                icon: 'success',
                title: 'Matatu Deleted',
                text: 'Matatu has been deleted successfully.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
            });
            const updatedMatatus = await fetchMatatuDetais();
            setMatatus(updatedMatatus); 
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to delete the matatu.',
            });
        }
    } catch (error) {
        console.error('Error deleting matatu:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while deleting the matatu. Please try again later.',
        });
    }
};

const resetStatus = async (matatuId, setMatatus) => {
    try {
        const response = await axiosInstance.post(`/matatus/${matatuId}/resetStatus`);
        if (response.status >= 200 && response.status < 300) {
            Swal.fire({
                icon: 'success',
                title: 'Status Reset',
                text: 'Status has been reset successfully.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
            });
            const updatedMatatus = await fetchMatatuDetais();
            setMatatus(updatedMatatus);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to reset the status.',
            });
        }
    } catch (error) {
        console.error('Error resetting status:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while resetting the status. Please try again later.',
        });
    }
};

const approveMatatu = async (matatuId, setMatatus) => {
    try {
        const response = await axiosInstance.post(`/matatus/${matatuId}/approve`);
        if (response.status >= 200 && response.status < 300) {
            Swal.fire({
                icon: 'success',
                title: 'Matatu Approved',
                text: 'Matatu has been approved successfully.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
            });
            const updatedMatatus = await fetchMatatuDetais();
            setMatatus(updatedMatatus);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to approve the matatu.',
            });
        }
    } catch (error) {
        console.error('Error approving matatu:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while approving the matatu. Please try again later.',
        });
    }
};

const addRoute = async (routeData) => {
    try{
        const response = await axiosInstance.post('/matatus/addRoute', routeData);
        return response.status === 201;
    } catch (error) {
        console.error('Error adding route:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while adding new route. Please try again later.',
        });
    }
};

const deleteRoute = async (routeId, setRoutes) => {
    Swal.fire({
        title: "Are you sure?",
        text: "This action cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "delete!",
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await axiosInstance.delete(`/matatus/deleteRoute/${routeId}`);
                if (response.status === 200) {
                    Swal.fire("Deleted!", "The route has been removed.", "success");
                    const updatedRoutes = await getRoutes();
                    setRoutes(updatedRoutes);
                }
            } catch (error) {
                console.error("Error deleting route:", error);
                Swal.fire("Error", "Failed to delete the route. Try again.", "error");
            }
        }
    });
};

export {
    fetchMatatus,
    fetchMatatuDetais,
    assignDrivers,
    fetchDrivers,
    deleteMatatu,
    editMatatu,
    approveMatatu,
    resetStatus,
    addRoute,
    deleteRoute
}