# MOLINE
Matatu SACCO Finance and Staff Management System

# Moline Matatu SACCO System

## A transport company where owners of vehicles remit as follows on a daily basis, (*) indicate must be remitted, the rest are optional:-

- `250KES` for operations*
- `250KES` for insurance*
- remaining  for savings
- loan payment through deduction from savings (if one has a loan)

Money is sent through **MPESA** (First payment of 15,000 made through MPESA and daily remittance as well.); for instance the vehicle owner can send `2000KES`, system should automatically allocate `250` to operations docket, `250` to insurance docket and the other monies to savings which help a member acquire a loan since loan is given based on your savings.

## Requirements to register on the system for all users include:-

- National ID Number (scanned copy be uploaded as well)
- First Name
- Last Name
- Gender
- Email address
- Phone number
- Address

Once the users have submitted their registration details, their registration status will remain pending approval until when they pay initial joining capital of KES.15,000 then admin verifies payment in the system then approve them and they can now access the system.They'll get an email notification.The vehicle owners will then proceed to add their vehicles, assign the respective drivers which the admin can in the future assign and unassign to a different vehicle. 

**SOME LOGICS**

The vehicles will be called Matatus (a popular Kenyan name for vehicles transporting people from point to point). Singular is Matatu. 

Members of the SACCO are allowed to take loans except the drivers. Savings are only done by the matatu owners when they pay excesses of the minimum daily remittance required of them. A matatu owner can have more than one matatu.

There are two types of loans; the **Normal Loan** and the **Emergency Loan**. 

For one to qualify for the Normal Loan, s/he should be fully registered and must have paid a sum of `KES 15000` as share capital and must have savings which must amount to the loan they want to take as a loan.They must also have a matatu registered under their name in order to qualify for a normal loan.The emergency loan has a maximum value of `KES 30000`. If a matatu owner wants a loan that is more than their current savings, then s/he must nominate a guarantor or guarantors whose savings can add up to the amount s/he needs.

A matatu owner is allowed to apply for the two loans separately as well.

Each matatu owner pays a given value e.g. `250KES` daily towards the insurance docket for each vehicle. This money is for the vehicle's insurance that must be a given value e.g. `6500KES` by the following month same date. So the insurance  for each vehicle is active until the same date the next month after which the actuary officer will suspend the vehicle if the total amount in the insurance docket is less than the set amount e.g. 6500KES.

Each matatu will have a one specific status on registration into the system:-
 
- Active (In operation and no balances due for the Insurance docket), 
- Inactive if Suspended (When insurance has expired and/or not paid for or if the amount in the Insurance docket is less than the set value e.g. `6500KES` on the expiry date)

The system should be able to give various reports including but not limited to:

- Matatu owners and their various details
- Matatus and their details
- Drivers and their details
- Various Docket balances
- Loans and balances
- Savings
- Financial reports *etc*

The **reports** need be easily generated using date ranges, `printed`, `csv`, `pdf`.

Once one makes a payment, s/he should receive an email on how the system has allocated the money sent and balances for dockets.