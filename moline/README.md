# MATIS
Matatu SACCO Finance and Staff Management System

# Moline Sacco System

## A transport company where owners of vehicles remit as follows on a daily basis, * indicate must be remitted, the rest are optional:-

- `250KES` for operations*
- `250KES` for insurance*
- a minimum of `300KES` for savings
- daily loan payment (if one has a loan)

Money is sent through **MPESA** (A paybill is available and the account number will be the vehicle registration number e.g. `KCD256T`); for instance the vehicle owner can send `2000KES`, system should automatically allocate `250` to operations docket, `250` to insurance docket and the other monies to loan (if there's an outstanding loan) or to savings (if one has no loan)

## Requirements to register on the system for all users include:-

- National ID Number (scanned copy be uploaded as well)
- First Name
- Last Name
- Gender
- Other Names
- Email address
- Phone number
- Address

Once the users have submitted their registration details, their registration status will remain pending until when the system admin will approve them, then assign them a role (Admin, Staff, Vehicle Owner, Driver, Conductor/Turn Boy, Actuary). They'll get an email notification. The Roles will be having various permissions on the system. Those assigned Staff role will also be assigned a position in the company (Chairperson, Secretary, Treasurer, Chief Whip etc.) The vehicle owners will then proceed to add their vehicles, assign the respective drivers and conductors/turn boys. 

Those assigned as Staff will now be required to upload or add the following details:

Bank Name, Bank Account number, NHIF Number, and Passport Photo(To be Uploaded).

**SOME LOGICS**

The vehicles will be called Matatus (a popular Kenyan name for vehicles transporting people from point to point). Singular is Matatu. 

A Matatu owner and Staff are the only ones allowed to take loans. Savings are only done by the matatu owners. A matatu owner can also be a staff and can have more than one matatu.

There are two types of loans; the **Normal Loan** and the **Emergency Loan**. 

For one to qualify for the Normal Loan, s/he should be fully registered and must have paid a sum of `KES 15000` as share capital and must have savings. One can apply a normal of up-to the amounts saved and not more. The emergency loan has a maximum value of `KES 30000`. If a matatu owner wants a loan that is more than their current savings, then s/he must nominate a guarantor or guarantors whose savings can add up to the amount s/he needs.

A matatu owner is allowed to apply for the two loans separately as well.

Each matatu owner pays a given value e.g. `250KES` daily towards the insurance docket for each vehicle. This money is for the vehicle's insurance that must be a given value e.g. `6500KES` by the following month same date. So the insurance  for each vehicle is active until the same date the next month after which the actuary officer will suspend the vehicle if the total amount in the insurance docket is less than the set amount e.g. 6500KES.

Each matatu will have a one specific status on registration into the system:-
 
- Active (In operation and no balances due for the Insurance docket), 
- Inactive (If the owner removes it from the company) or
- Suspended (When insurance has expired and/or not paid for or if the amount in the Insurance docket is less than the set value e.g. `6500KES` on the expiry date)

The staff will have **Salaries** paid to their accounts but **NHIF** (National Health Insurance Fund) or **SHIF** (Social Health Insurance Fund) amounts will be deducted each month before salaries are paid and payslips generated.

Apart from `Salaries`, there are also `Wages` that are paid on a daily basis to individuals who work in the office. 

## There are also other expenses incured like office rent, water bills, electricity etc.

The system should be able to give various reports including but not limited to:

- Matatu owners and their various details
- Matatus and their details
- Drivers, Conductors and their details
- Incomes
- Expenses
- Various Docket balances
- Loans and balances
- Savings
- Financial reports
- Suspended matatus *etc*

The **reports** need be easily generated using date ranges, `printed`, `csv`, `pdf` and easily `sent to email`

Once one makes a payment, s/he should receive an email on how the system has allocated the money sent and balances for docket stating loan due if any as well.

Staff who are salaried can ask/apply for advance salary, which shall later be deducted from monthly salary