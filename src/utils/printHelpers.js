// src/utils/printHelpers.js

export function triggerPrint() {
  window.print();
}

export function printElement(elementId) {
  const elem = document.getElementById(elementId);
  if (!elem) {
    window.print();
    return;
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>In Phiếu / Biên Bản Nghiệp Vụ</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif, sans-serif;
            margin: 20mm 15mm;
            color: #111;
            font-size: 13pt;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
          }
          .header-left, .header-right {
            text-align: center;
          }
          .title {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 20px 0 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            border: 1px solid #333;
            padding: 8px 10px;
            font-size: 11pt;
          }
          th {
            background-color: #f2f2f2;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            text-align: center;
          }
          .sig-block {
            width: 30%;
          }
          .sig-space {
            height: 70px;
          }
          @media print {
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
          }
        </style>
      </head>
      <body>
        ${elem.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 350);
}
