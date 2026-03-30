export const ROLES = {
    ADMIN: 'admin',
    STAFF: 'staff',
    VEHICLE_OWNER: 'vehicle_owner',
    DRIVER: 'driver',
    CONDUCTOR: 'conductor',
};

export const PERMISSIONS = {
    // Admin permissions
    MANAGE_USERS: 'manage_users',
    ASSIGN_ROLES: 'assign_roles',
    VIEW_REPORTS: 'view_reports',
    APPROVE_REGISTRATIONS: 'approve_registrations',

    // Staff permissions
    ADD_STAFF_DETAILS: 'add_staff_details',
    VIEW_SALARIES: 'view_salaries',
    MANAGE_SALARIES: 'manage_salaries',
    PAY_WAGES: 'pay_wages',
    MANAGE_EXPENSES: 'manage_expenses',
    GENERATE_PAYSLIPS: 'generate_payslips',
    APPLY_SALARY_ADVANCE: 'apply_salary_advance',

    // Vehicle Owner permissions
    ADD_VEHICLE: 'add_vehicle',
    ASSIGN_DRIVER: 'assign_driver',
    ASSIGN_CONDUCTOR: 'assign_conductor',
    APPLY_LOAN: 'apply_loan',
    VIEW_SAVINGS: 'view_savings',
    MAKE_PAYMENTS: 'make_payments',

    // Common permissions
    VIEW_PROFILE: 'view_profile',
    EDIT_PROFILE: 'edit_profile',
    VIEW_TRANSACTIONS: 'view_transactions',
};

export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.ASSIGN_ROLES,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.APPROVE_REGISTRATIONS,
        PERMISSIONS.VIEW_PROFILE,
        PERMISSIONS.EDIT_PROFILE,
        PERMISSIONS.VIEW_TRANSACTIONS,
    ],
    [ROLES.STAFF]: [
        PERMISSIONS.ADD_STAFF_DETAILS,
        PERMISSIONS.VIEW_SALARIES,
        PERMISSIONS.MANAGE_SALARIES,
        PERMISSIONS.PAY_WAGES,
        PERMISSIONS.MANAGE_EXPENSES,
        PERMISSIONS.GENERATE_PAYSLIPS,
        PERMISSIONS.APPLY_SALARY_ADVANCE,
        PERMISSIONS.VIEW_PROFILE,
        PERMISSIONS.EDIT_PROFILE,
        PERMISSIONS.VIEW_TRANSACTIONS,
    ],
    [ROLES.VEHICLE_OWNER]: [
        PERMISSIONS.ADD_VEHICLE,
        PERMISSIONS.ASSIGN_DRIVER,
        PERMISSIONS.ASSIGN_CONDUCTOR,
        PERMISSIONS.APPLY_LOAN,
        PERMISSIONS.VIEW_SAVINGS,
        PERMISSIONS.MAKE_PAYMENTS,
        PERMISSIONS.VIEW_PROFILE,
        PERMISSIONS.EDIT_PROFILE,
        PERMISSIONS.VIEW_TRANSACTIONS,
    ],
    [ROLES.DRIVER]: [
        PERMISSIONS.VIEW_PROFILE,
        PERMISSIONS.EDIT_PROFILE,
        PERMISSIONS.VIEW_TRANSACTIONS,
    ],
    [ROLES.CONDUCTOR]: [
        PERMISSIONS.VIEW_PROFILE,
        PERMISSIONS.EDIT_PROFILE,
        PERMISSIONS.VIEW_TRANSACTIONS,
    ],
    [ROLES.ACTUARY]: [
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.VIEW_PROFILE,
        PERMISSIONS.EDIT_PROFILE,
        PERMISSIONS.VIEW_TRANSACTIONS,
    ],
};
