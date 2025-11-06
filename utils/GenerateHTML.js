import dayjs from 'dayjs';
import image from '../assets/logo.jpg';
export default function generateHTML(quotationData) {
  console.log(quotationData);
  const currentDate = dayjs().format('DD/MM/YYYY');
  const formatDate = date => dayjs(date).format('DD-MM-YYYY');
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 30px; font-size: 12px; }
      .company-header-section { display: flex; align-items: center; background-color: #2196F3; padding: 15px; margin-bottom: 20px; }
      .company-logo { width: 80px; height: 80px; margin-right: 20px; }
      .company-details { flex: 1; color: white; text-align: center; }
      .company-name { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; }
      .company-address { font-size: 11px; line-height: 1.5; }

      .top-info { text-align: right; margin-bottom: 30px; }
      .top-info table { margin-left: auto; border-collapse: collapse; }
      .top-info td { padding: 5px 10px; border: 1px solid #333; }
      .top-info td:first-child { font-weight: bold; background-color: #f5f5f5; }

      .header-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
      .quotation-to { flex: 1; }
      .quotation-to-header { background-color: #2196F3; color: white; padding: 8px; font-weight: bold; margin-bottom: 10px; }
      .company-info { flex: 1; text-align: right; }
      .company-header { background-color: #2196F3; color: white; padding: 8px; font-weight: bold; text-align: right; margin-bottom: 10px; }
      .info-text { margin: 3px 0; line-height: 1.6; }

      .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .items-table th { background-color: #2196F3; color: white; padding: 10px; text-align: left; border: 1px solid #2196F3; font-size: 11px; }
      .items-table td { border: 1px solid #ddd; padding: 10px; }
      .items-table tbody tr:nth-child(even) { background-color: #f9f9f9; }

      .totals-section { margin-top: 10px; }
      .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
      .total-label { font-weight: bold; }
      .total-value { background-color: #2196F3; color: white; padding: 5px 15px; min-width: 150px; text-align: right; }

      .terms-section { margin-top: 30px; }
      .terms-header { background-color: #2196F3; color: white; padding: 8px; font-weight: bold; margin-bottom: 10px; }
      .terms-list { margin: 10px 0; }
      .terms-list p { margin: 5px 0; line-height: 1.6; }

      .signature-section { margin-top: 30px; border-top: 1px solid #333; padding-top: 10px; }
      .note { margin: 15px 0; font-size: 11px; }

      .footer { margin-top: 30px; text-align: center; font-style: italic; color: #666; }
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

    <div class="top-info">
      <table>
        <tr>
          <td>DATE:</td>
          <td>${currentDate}</td>
        </tr>
        <tr>
          <td>QUOTE #</td>
          <td>${quotationData.id}</td>
        </tr>
        <tr>
          <td>Customer ID</td>
          <td>${quotationData.customerId || 'N/A'}</td>
        </tr>
        <tr>
          <td>Delivery Date:</td>
          <td>${formatDate(quotationData.deliveryDate)}</td>
        </tr>
      </table>
    </div>

    <div class="header-row">
      <div class="quotation-to">
        <div class="quotation-to-header">Quotation To,</div>
        <div class="info-text"><strong>${
          quotationData.customerName
        }</strong></div>
        <div class="info-text">${
          quotationData.projectDescription || 'Project Management Director'
        }</div>
        <div class="info-text">${quotationData.customerAddress}</div>
        <div class="info-text">Tel: ${
          quotationData.customerContactNo || 'N/A'
        }</div>
        <div class="info-text">Email: ${quotationData.customerEmail || ''}</div>
      </div>

      <div class="company-info">
        <div class="company-header">Company Information</div>
        <div class="info-text">Tirupathur, Tamil Nadu 635601</div>
        <div class="info-text">Tel: 086809 74194</div>
        <div class="info-text">Prepared by: Admin</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Description</th>
          <th>Quantity</th>
          <th>Rate Per Unit</th>
          <th>Total Amount</th>
        </tr>
      </thead>
      <tbody>
  `;

  quotationData.items.forEach(item => {
    html += `
        <tr>
          <td>${item.itemName}</td>
          <td>${item.itemDescription || ''}</td>
          <td>${item.quantity} ${item.unit?.shortName || ''}</td>
          <td>₹${item.rateMrp.toLocaleString('en-IN')}</td>
          <td>₹${item.totalCost.toLocaleString('en-IN')}</td>
        </tr>
    `;
  });

  html += `
      </tbody>
    </table>

    <div class="totals-section">
    <div class="totals-row">
      <div class="total-label">TOTAL BUDGET</div>
      <div class="total-value">₹${Number(
        quotationData.totalBudget,
      ).toLocaleString('en-IN')}</div>
    </div>
      <div class="totals-row">
        <div class="total-label">TOTAL AMOUNT</div>
        <div class="total-value">₹${Number(
          quotationData.totalBudget - quotationData.discount,
        ).toLocaleString('en-IN')}</div>
      </div>
      <div class="totals-row">
        <div class="total-label">DISCOUNT</div>
        <div class="total-value">₹${Number(
          quotationData.discount,
        ).toLocaleString('en-IN')}</div>
      </div>
    </div>

    <div class="terms-section">
      <div class="terms-header">TERMS AND CONDITIONS</div>
      <div class="terms-list">
        <p>1. Customer will be billed after indicating acceptance of this</p>
        <p>2. Payment has to be fully paid upon receipt</p>
        <p>3. Advance payment required for urgent cases</p>
      </div>

      <div class="signature-section">
        <p><strong>Customer Acceptance (sign below):</strong></p>
        <p>x _________________________________________________</p>
        <div class="note">Note: Above rates are negotiable and price depends on quantity</div>
      </div>
    </div>

    <div class="footer">
      <p>Thank You For Your Business!</p>
    </div>
  </body>
  </html>
  `;
  return html;
}
