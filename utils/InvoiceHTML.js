import dayjs from 'dayjs';

export default function generateInvoiceHTML(projectData) {
  const currentDate = dayjs().format('DD/MM/YYYY');
  const formatDate = date => dayjs(date).format('DD-MM-YYYY');

  // Calculate totals
  const itemsTotal = projectData.projectItems.reduce(
    (sum, item) => sum + item.totalCost,
    0,
  );

  const paymentsInTotal = projectData.paymentsIn.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  const paymentsOutTotal = projectData.paymentsOut.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  const grandTotal = projectData.grandTotal;
  const netRemaining =
    grandTotal - (projectData.discount || 0) - paymentsInTotal;

  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { 
        font-family: Arial, sans-serif; 
        margin: 30px; 
        font-size: 12px; 
      }
      
      .company-header-section { 
        display: flex; 
        align-items: center; 
        background-color: #2196F3; 
        padding: 15px; 
        margin-bottom: 20px; 
      }
      
      .company-logo { 
        width: 80px; 
        height: 80px; 
        margin-right: 20px; 
      }
      
      .company-details { 
        flex: 1; 
        color: white; 
        text-align: center; 
      }
      
      .company-name { 
        font-size: 24px; 
        font-weight: bold; 
        text-transform: uppercase; 
        margin-bottom: 8px; 
      }
      
      .company-address { 
        font-size: 11px; 
        line-height: 1.5; 
      }
      
      .invoice-title {
        text-align: center;
        font-size: 28px;
        font-weight: bold;
        color: #2196F3;
        margin: 20px 0;
        text-transform: uppercase;
      }
      
      .top-info { text-align: right; margin-bottom: 30px; }
      
      .top-info table { 
        margin-left: auto; 
        border-collapse: collapse; 
      }
      
      .top-info td { 
        padding: 5px 10px; 
        border: 1px solid #333; 
      }
      
      .top-info td:first-child { 
        font-weight: bold; 
        background-color: #f5f5f5; 
      }
      
      .header-row { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 20px; 
      }
      
      .invoice-to { 
        flex: 1; 
      }
      
      .invoice-to-header { 
        background-color: #2196F3; 
        color: white; 
        padding: 8px; 
        font-weight: bold; 
        margin-bottom: 10px; 
      }
      
      .company-info { flex: 1; text-align: center; }
      .company-header { background-color: #2196F3; color: white; padding: 8px; font-weight: bold; text-align: center; margin-bottom: 10px; }
      .table-header { background-color: #2196F3; color: white; padding: 8px; font-weight: bold; text-align: right; height: 15px; }
      .info-text { 
        margin: 3px 0; 
        line-height: 1.6; 
      }
      
      .section-header {
        background-color: #2196F3;
        color: white;
        padding: 10px;
        font-weight: bold;
        font-size: 14px;
        margin-top: 20px;
        margin-bottom: 10px;
      }
      
      .items-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 10px 0; 
      }
      
      .items-table th { 
        background-color: #2196F3; 
        color: white; 
        padding: 10px; 
        text-align: left; 
        border: 1px solid #2196F3; 
        font-size: 11px; 
      }
      
      .items-table td { 
        border: 1px solid #ddd; 
        padding: 10px; 
      }
      
      .items-table tbody tr:nth-child(even) { 
        background-color: #f9f9f9; 
      }
      
      .payment-table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
      }
      
      .payment-table th {
        background-color: #27ae60;
        color: white;
        padding: 8px;
        text-align: left;
        border: 1px solid #27ae60;
        font-size: 11px;
      }
      
      .payment-table.out th {
        background-color: #726c6cff;
        border: 1px solid #e74c3c;
      }
      
      .payment-table td {
        border: 1px solid #ddd;
        padding: 8px;
        font-size: 11px;
      }
      
      .payment-table tbody tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      
      .totals-section { 
        margin-top: 20px;
        border-top: 2px solid #333;
        padding-top: 10px;
      }
      
      .totals-row { 
        display: flex; 
        justify-content: space-between; 
        padding: 8px 0;
        border-bottom: 1px solid #ddd;
      }
      
      .totals-row.grand-total {
        border-top: 2px solid #333;
        border-bottom: 2px solid #333;
        padding: 12px 0;
        margin-top: 5px;
      }
      
      .total-label { 
        font-weight: bold;
        font-size: 13px;
      }
      
      .total-value { 
       
        color: black; 
        padding: 5px 15px; 
        min-width: 150px; 
        text-align: right;
        font-weight: bold;
      }
      
      .total-value.positive {
       
        color:black
      }
      
      .total-value.negative {
       
        color:black
      }
      
      .notes-section {
        margin-top: 30px;
        padding: 15px;
        background-color: #f9f9f9;
        border-left: 4px solid #2196F3;
      }
      
      .signature-section { 
        margin-top: 40px; 
        display: flex;
        justify-content: space-between;
      }
      
      .signature-box {
        width: 45%;
        text-align: center;
      }
      
      .signature-line {
        border-top: 2px solid #333;
        margin-top: 60px;
        padding-top: 10px;
        font-weight: bold;
      }
      
      .footer { 
        margin-top: 40px; 
        text-align: center; 
        font-style: italic; 
        color: #666;
        border-top: 1px solid #ddd;
        padding-top: 15px;
      }
      
      .no-data {
        text-align: center;
        color: #999;
        font-style: italic;
        padding: 15px;
      }
    </style>
  </head>
  <body>
    <div class="company-header-section">
      <img src="https://storage.track-new.com/2eb0d4c1-4b3e-4045-a9a1-6e6bc649c093/website/WebsiteLogo/2024/12/1000056689.jpg" alt="Company Logo" class="company-logo" />
      <div class="company-details">
        <div class="company-name">INDIAN STEEL COMPANY</div>
        <div class="company-address">
          No.3/30A, Krishnagiri Main Rd, near Hotel Hills, Tirupathur, Tamil Nadu 635601<br/>
          Phone: 086809 74194
        </div>
      </div>
    </div>
    
    
    
    
    <div class="header-row">
      <div class="invoice-to">
        <div class="invoice-to-header">Bill To,</div>
        <div class="info-text"><strong>${
          projectData.customerName
        }</strong></div>
        <div class="info-text">${projectData.projectDescription || ''}</div>
        <div class="info-text">${projectData.customerAddress || ''}</div>
        <div class="info-text">Tel: ${
          projectData.customerContactNo || 'N/A'
        }</div>
        <div class="info-text">Email: ${projectData.customerEmail || ''}</div>
      </div>
      
      <div class="company-info">
        <div class="company-header">Company Information</div>
        <div class="info-text">Tirupathur, Tamil Nadu 635601</div>
        <div class="info-text">Tel: 086809 74194</div>
        <div class="info-text">Prepared by: Admin</div>
      </div>
      <div class="top-info">
    <div class = "table-header"></div>
      <table>
        <tr>
          <td>DATE:</td>
          <td>${currentDate}</td>
        </tr>
        <tr>
          <td>Customer ID</td>
          <td>${projectData.customerId || 'N/A'}</td>
        </tr>
      </table>
    </div>
    </div>
    
    

    <div class="section-header">PROJECT ITEMS</div>
    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Description</th>
          <th>Quantity</th>
          <th>Rate Per Unit</th>
          <th>Tax</th>
          <th>Total Amount</th>
        </tr>
      </thead>
      <tbody>
  `;
  console.log(projectData);
  projectData.projectItems.forEach(item => {
    html += `
        <tr>
          <td>${item.itemName}</td>
          <td>${item.itemDescription || '-'}</td>
          <td>${item.quantity} ${item.unit?.shortName || ''}</td>
          <td>₹${item.rateMrp.toLocaleString('en-IN')}</td>
          <td>${item.taxPercentage}%</td>
          <td>₹${item.totalCost.toLocaleString('en-IN')}</td>
        </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  // Payments In Section
  // if (projectData.paymentsIn && projectData.paymentsIn.length > 0) {
  //   html += `
  //   <div class="section-header" style="background-color: #27ae60;">PAYMENTS RECEIVED</div>
  //   <table class="payment-table">
  //     <thead>
  //       <tr>
  //         <th>Date</th>
  //         <th>Type</th>
  //         <th>Notes</th>
  //         <th>Amount</th>
  //       </tr>
  //     </thead>
  //     <tbody>
  //   `;

  //   projectData.paymentsIn.forEach(payment => {
  //     html += `
  //       <tr>
  //         <td>${formatDate(payment.paymentDate)}</td>
  //         <td>${payment.type}</td>
  //         <td>${payment.notes || '-'}</td>
  //         <td style="text-align: right; color: #27ae60; font-weight: bold;">₹${payment.amount.toLocaleString(
  //           'en-IN',
  //         )}</td>
  //       </tr>
  //     `;
  //   });

  //   html += `
  //     </tbody>
  //   </table>
  //   `;
  // }

  // // Payments Out Section
  // if (projectData.paymentsOut && projectData.paymentsOut.length > 0) {
  //   html += `
  //   <div class="section-header" style="background-color: #e74c3c;">PAYMENTS MADE</div>
  //   <table class="payment-table out">
  //     <thead>
  //       <tr>
  //         <th>Date</th>
  //         <th>Type</th>
  //         <th>Notes</th>
  //         <th>Amount</th>
  //       </tr>
  //     </thead>
  //     <tbody>
  //   `;

  //   projectData.paymentsOut.forEach(payment => {
  //     html += `
  //       <tr>
  //         <td>${formatDate(payment.paymentDate)}</td>
  //         <td>${payment.type}</td>
  //         <td>${payment.notes || '-'}</td>
  //         <td style="text-align: right; color: #e74c3c; font-weight: bold;">₹${payment.amount.toLocaleString(
  //           'en-IN',
  //         )}</td>
  //       </tr>
  //     `;
  //   });

  //   html += `
  //     </tbody>
  //   </table>
  //   `;
  // }

  //  <div class="totals-row">
  //       <div class="total-label">TOTAL PAYMENTS MADE</div>
  //       <div class="total-value negative">₹${paymentsOutTotal.toLocaleString(
  //         'en-IN',
  //       )}</div>
  //     </div>

  html += `
    <div class="totals-section">
      <div class="totals-row">
        <div class="total-label" style="font-size: 16px;">ITEMS TOTAL</div>
        <div class="total-value" style="font-size: 16px;">₹${itemsTotal.toLocaleString(
          'en-IN',
        )}</div>
      </div>

      <div class="totals-row grand-total">
        <div class="total-label" style="font-size: 16px;">DISCOUNT</div>
        <div class="total-value" style="font-size: 16px;">₹${projectData.discount.toLocaleString(
          'en-IN',
        )}</div>
      </div>

      <div class="totals-row grand-total">
        <div class="total-label" style="font-size: 16px;">GRAND TOTAL</div>
        <div class="total-value" style="font-size: 16px;">₹${(
          grandTotal - projectData.discount
        ).toLocaleString('en-IN')}</div>
      </div>
      
      <div class="totals-row">
        <div class="total-label" style="font-size: 16px;">TOTAL PAYMENTS RECEIVED</div>
        <div class="total-value positive" style="font-size: 16px;">₹${paymentsInTotal.toLocaleString(
          'en-IN',
        )}</div>
      </div>
      
      
      <div class="totals-row grand-total">
        <div class="total-label" style="font-size: 16px; color: ${
          netRemaining > 0 ? '#e74c3c' : '#27ae60'
        };">
          ${netRemaining > 0 ? 'BALANCE DUE' : 'BALANCE (PAID IN FULL)'}
        </div>
        <div class="total-value ${
          netRemaining > 0 ? 'negative' : 'positive'
        }" style="font-size: 16px;">
          ₹${Math.abs(netRemaining).toLocaleString('en-IN')}
          ${netRemaining < 0 ? ' (Extra Paid)' : ''}
        </div>
      </div>
    </div>
    
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line">Customer Signature</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">Authorized Signature</div>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Thank You For Your Business!</strong></p>
      <p style="font-size: 10px; margin-top: 10px;">
        This is a computer-generated invoice and does not require a physical signature.
      </p>
    </div>
  </body>
  </html>
  `;

  return html;
}
