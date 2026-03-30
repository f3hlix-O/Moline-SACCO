import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillAlt, faPiggyBank, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  PieController,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { exportData, printData } from '../../utils/export'; 
import { format } from 'date-fns';
import { fetchFinancialDetails } from '../components/financial';

ChartJS.register(
  Title, Tooltip, Legend, ArcElement, PointElement,
  PieController, CategoryScale, LinearScale, BarElement,
);

function FinancialReport() {
  const [financialDetails, setFinancialDetails] = useState([]);
  const [activeTab, setActiveTab] = useState('loans');

  useEffect(() => {
    (async () => {
      const data = await fetchFinancialDetails();
      setFinancialDetails(data);
    })();
  }, []);

  // Split data sets
  const loansData   = financialDetails.filter(d => d.loan_id != null);
  const savingsData = financialDetails.filter(d => d.savings_amount != null);
  const insData     = financialDetails; // all records

  // Columns definitions
  const loansCols = [
    { header: 'Loan ID',      field: 'loan_id' },
    { header: 'Plate No.',    field: 'number_plate' },
    { header: 'Issued (KES)', field: 'loan_amount_issued' },
    { header: 'Type',         field: 'loan_type' },
    { header: 'Due (KES)',    field: 'loan_amount_due' },
    { header: 'Date Issued',  field: 'loan_created_at' },
  ];
  const savingsCols = [
    { header: 'Plate No.',    field: 'number_plate' },
    { header: 'Savings (KES)',field: 'savings_amount' },
  ];
  const insCols = [
    { header: 'Plate No.',    field: 'number_plate' },
    { header: 'Paid (KES)',   field: 'insurance_amount' },
    { header: 'Next Renewal', field: 'insurance_expiry' },
    { header: 'Status',       field: 'status' },
  ];

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
  };

  const renderTab = (type) => {
    let data, cols, title;
    if (type === 'loans') {
      data = loansData; cols = loansCols; title = 'Loans Report';
    } else if (type === 'savings') {
      data = savingsData; cols = savingsCols; title = 'Savings Report';
    } else {
      data = insData;    cols = insCols;   title = 'Insurance Report';
    }

    return (
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between">
          <h3 className="card-title">{title}</h3>
          <div className="btn-group">
            {['txt','csv','xlsx','pdf'].map(fmt => (
              <button
                key={fmt}
                className="btn btn-info btn-sm"
                onClick={() => exportData(fmt, data, cols, title)}
              >
                <i className="fas fa-download"></i> {fmt.toUpperCase()}
              </button>
            ))}
            <button
              className="btn btn-info btn-sm"
              onClick={() => printData(data, cols)}  
            >
              <i className="fas fa-print"></i> Print
            </button>
          </div>
        </div>
        <div className="card-body">
          <table className="table table-bordered table-hover">
            <thead>
              <tr>{cols.map(c => <th key={c.field}>{c.header}</th>)}</tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {cols.map(c => (
                    <td key={c.field}>
                      {c.field.includes('date')
                        ? format(new Date(row[c.field]), 'yyyy-MM-dd')
                        : row[c.field]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {/* Optional footer for loans and savings */}
            {(type === 'loans' || type === 'savings') && (
              <tfoot>
                <tr>
                  <th>Total</th>
                  {cols.slice(1).map((c, idx) => {
                    if (c.field.endsWith('_issued') || c.field.endsWith('_due')) {
                      const sum = data.reduce((a, d) => a + (d[c.field]||0), 0);
                      return <th key={c.field}>{sum.toLocaleString()}</th>;
                    }
                    if (c.field === 'savings_amount') {
                      const sum = data.reduce((a, d) => a + (d.savings_amount||0), 0);
                      return <th key={c.field}>{sum.toLocaleString()}</th>;
                    }
                    return <th key={c.field}></th>;
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {/* Example chart for loans */}
        {type === 'loans' && (
          <div className="card-body" style={{ height: 300 }}>
            <Bar
              data={{
                labels: ['Jan','Feb','Mar','Apr','May','Jun'],
                datasets: [
                  { label:'Loans', data: [30,50,40,60,80,70], backgroundColor:'rgba(255,99,132,0.5)' }
                ]
              }}
              options={chartOpts}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="content-wrapper p-4">
      <div className="d-flex justify-content-around mb-4">
        {[
          { key:'loans',   icon: faMoneyBillAlt, label:'Loans'    },
          { key:'savings', icon: faPiggyBank,   label:'Savings'  },
          { key:'insurance', icon: faShieldAlt, label:'Insurance' }
        ].map(tab => (
          <div
            key={tab.key}
            className={`text-center p-3 rounded ${activeTab===tab.key?'bg-primary text-white':'bg-light'}`}
            style={{ cursor: 'pointer', width: 120 }}
            onClick={() => setActiveTab(tab.key)}
          >
            <FontAwesomeIcon icon={tab.icon} size="2x" />
            <p className="mt-2 mb-0">{tab.label}</p>
          </div>
        ))}
      </div>
      {renderTab(activeTab)}
    </div>
  );
}

export default FinancialReport;
