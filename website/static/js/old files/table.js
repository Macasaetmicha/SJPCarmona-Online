document.addEventListener('DOMContentLoaded', function () {
    function copyAllTableData(dataTable) {
        console.log('The Copy button was pressed.');

        const data = dataTable.rows().data(); // Get all rows, not just visible
        const headers = dataTable.columns().header().toArray().map(th => th.innerText.trim());

        // Remove 'Action' column
        const actionIndex = headers.findIndex(header => header.toLowerCase() === 'action');
        if (actionIndex !== -1) headers.splice(actionIndex, 1);

        let tableText = headers.join('\t') + '\n';

        data.each(row => {
            const rowData = row.filter((_, i) => i !== actionIndex); // remove Action column
            tableText += rowData.join('\t') + '\n';
        });
        navigator.clipboard.writeText(tableText)
        .then(() => {
            toastr.success('All data copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy:', err);
            toastr.error('Failed to copy to clipboard.');
        });
    }


    // Function to export table to PDF
    function exportTableToPDF(table, fileName) {
        console.log('The PDF button was pressed.');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');

        const tableClone = table.cloneNode(true);

        // Remove the first column from the table
        const headers = tableClone.querySelectorAll('thead tr th');
        const rows = tableClone.querySelectorAll('tbody tr');

        if (headers.length > 0) {
            headers[0].remove();
        }

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                cells[0].remove();
            }
        });

        // Export table
        doc.autoTable({
            html: tableClone,
            startY: 10,
            theme: 'grid',
            headStyles: {
                fillColor: [169, 169, 169],
                textColor: [0, 0, 0],
                lineWidth: 0.3,
                lineColor: [0, 0, 0],
                halign: 'center', 
                valign: 'middle'  
            },
            styles: {
                lineWidth: 0.3,
                lineColor: [0, 0, 0],
                halign: 'center', 
                valign: 'middle'  
            },
            showHead: 'everyPage',
        });

        // Save PDF
        doc.save(`${fileName}.pdf`);
    }

    // Function to export table to Excel
    function exportTableToExcel(table, fileName) {
        console.log('Exporting DataTable...');
    
        let data = [];
    
        let headerRow = [];
        let subHeaderRow = [];
        let columnsToRemove = []; // Store indices of columns to remove
    
        let headerCells = table.querySelectorAll('thead tr:first-child th');
        let subHeaderCells = table.querySelectorAll('thead tr:nth-child(2) th');
    
        let subIndex = 0; // Track subheader index manually
    
        headerCells.forEach((cell, index) => {
            let mainText = cell.innerText.trim();
            let rowspan = parseInt(cell.getAttribute('rowspan') || "1", 10);
            let colspan = parseInt(cell.getAttribute('colspan') || "1", 10);
    
            // Check if this column is an "Action" column
            if (mainText.toLowerCase() === "action") {
                columnsToRemove.push(index);
                return; // Skip adding this column
            }
    
            for (let i = 0; i < colspan; i++) {
                headerRow.push(mainText);
            }
    
            if (colspan >= 2) {
                for (let i = 0; i < colspan && subIndex < subHeaderCells.length; i++) {
                    subHeaderRow.push(subHeaderCells[subIndex].innerText.trim());
                    subIndex++;
                }
            } else if (rowspan >= 2) {
                subHeaderRow.push("");
            } else {
                subHeaderRow.push("");
            }
        });
    
        // Extract table body data while removing "Action" columns
        table.querySelectorAll('tbody tr').forEach((row) => {
            let rowData = [];
            row.querySelectorAll('td').forEach((cell, cellIndex) => {
                if (!columnsToRemove.includes(cellIndex)) {
                    rowData.push(cell.innerText.trim());
                }
            });
            data.push(rowData);
        });
    
        // Combine headers and body data
        let finalData = [headerRow, subHeaderRow, ...data];
    
        // Create worksheet and workbook
        const worksheet = XLSX.utils.aoa_to_sheet(finalData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'DataTable');
    
        // Export file
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    }

    // Attach event listeners to buttons
    document.querySelectorAll('.btn-copy').forEach(button => {
        button.addEventListener('click', function () {
            const tableId = this.getAttribute('data-table');
            const table = document.getElementById(tableId);
            if (table) {
                copyAllTableData(table);
            } else {
                console.error('Table not found:', tableId);
            }
        });
    });

    document.querySelectorAll('.btn-pdf').forEach(button => {
        button.addEventListener('click', function () {
            const tableId = this.getAttribute('data-table');
            const table = document.getElementById(tableId);
            const fileName = this.getAttribute('data-table-name') || 'Table';
            console.log('Filename:', fileName);
            if (table) {
                exportTableToPDF(table, fileName);
            } else {
                console.error('Table not found:', tableId);
            }
        });
    });

    document.querySelectorAll('.btn-xcs').forEach(button => {
        button.addEventListener('click', function () {
            const tableId = this.getAttribute('data-table');
            const table = document.getElementById(tableId);
            const fileName = this.getAttribute('data-table-name') || 'Table';
            console.log('Filename:', fileName);
            if (table) {
                exportTableToExcel(table, fileName);
            } else {
                console.error('Table not found:', tableId);
            }
        });
    });

});