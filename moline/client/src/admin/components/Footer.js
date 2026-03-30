import React from 'react'

function Footer() {
    return (
        <div>
            <div className="card-footer">
                <div className="row">
                    <div className="col-sm-3 col-6">
                        <div className="description-block border-right">
                            <span className="description-percentage text-success"><i className="fas fa-caret-up" /> 17%</span>
                            <h5 className="description-header">$35,210.43</h5>
                            <span className="description-text">TOTAL REVENUE</span>
                        </div>
                        {/* /.description-block */}
                    </div>
                    {/* /.col */}
                    <div className="col-sm-3 col-6">
                        <div className="description-block border-right">
                            <span className="description-percentage text-warning"><i className="fas fa-caret-left" /> 0%</span>
                            <h5 className="description-header">$10,390.90</h5>
                            <span className="description-text">TOTAL COST</span>
                        </div>
                        {/* /.description-block */}
                    </div>
                    {/* /.col */}
                    <div className="col-sm-3 col-6">
                        <div className="description-block border-right">
                            <span className="description-percentage text-success"><i className="fas fa-caret-up" /> 20%</span>
                            <h5 className="description-header">$24,813.53</h5>
                            <span className="description-text">TOTAL PROFIT</span>
                        </div>
                        {/* /.description-block */}
                    </div>
                    {/* /.col */}
                    <div className="col-sm-3 col-6">
                        <div className="description-block">
                            <span className="description-percentage text-danger"><i className="fas fa-caret-down" /> 18%</span>
                            <h5 className="description-header">1200</h5>
                            <span className="description-text">GOAL COMPLETIONS</span>
                        </div>
                        {/* /.description-block */}
                    </div>
                </div>
                {/* /.row */}
            </div>
            {/* /.card-footer */}

        </div>
    )
}

export default Footer