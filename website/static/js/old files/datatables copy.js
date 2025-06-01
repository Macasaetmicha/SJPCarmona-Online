document.addEventListener('DOMContentLoaded', function () {
    // const dashRequestTable = $('#dashRequestTable').DataTable({
    //     ajax: {
    //         url: '/',
    //         dataSrc: ''
    //     },
    //     columns: [

    //         { data: 'client' },
    //         { data: 'name' },
    //         { data: 'request' },
    //         {
    //             data: 'release',
    //             render: function (data, type, row) {
    //                 return formatDateToLong(data);
    //             }
    //         }
    //     ]
    // });

    // $('#dashRequestTable').on('click', '.find-btn', function () {
    //     const id = $(this).data('id');
    //     const rowData = dashRequestTable.row($(this).parents('tr')).data();
    //     // Populate the info modal with data
    //     $('#dashReqClient').text(`${rowData.fname} ${rowData.mname} ${rowData.lname}`);
    //     $('#dashReqName').text(`${rowData.fname} ${rowData.mname} ${rowData.lname}`);
    //     $('#dashReqRequest').text(rowData.request);
    //     $('#dashReqRelease').text(formatDateToLong(rowData.release));
    // });

    const recordTable = $('#recordTable').DataTable({
        ajax: {
            url: '/records',
            dataSrc: ''
        },
        columns: [
            {
                data: null,
                render: function (data, type, row) {
                    return `
                        <button class="btn btn-primary find-btn" data-id="${row.id}">
                            <i class="fa-solid fa-info fa-fw"></i>
                        </button>
                    `;
                },
                orderable: false,
                searchable: false
            },
            { data: 'fname' },
            { data: 'mname' },
            { data: 'lname' },
            {
                data: 'birthday',
                render: function (data, type, row) {
                    return formatDateToLong(data);
                }
            },
            { data: 'ligitivity' },
            { data: 'birthplace' },
            { data: 'address' }
        ]
    });

    $('#recordTable').on('click', '.find-btn', function () {
        const id = $(this).data('id');
        const rowData = recordTable.row($(this).parents('tr')).data();
        // Populate the info modal with data
        $('#recClientName').text(`${rowData.fname} ${rowData.mname} ${rowData.lname}`);
        $('#recClientBday').text(formatDateToLong(rowData.birthday));
        $('#recClientBplace').text(rowData.birthplace);
        $('#recClientLigitivity').text(rowData.ligitivity);
        $('#recClientAddress').text(rowData.address);
        
        $('#recMoName').text(`${rowData.mother_fname} ${rowData.mother_mname} ${rowData.mother_lname}`);
        $('#recMoBday').text(formatDateToLong(rowData.mother_birthday));
        $('#recMoBplace').text(rowData.mother_bplace);
        $('#recMoAddress').text(rowData.mother_address);

        $('#recFaName').text(`${rowData.father_fname} ${rowData.father_mname} ${rowData.father_lname}`);
        $('#recFaBday').text(formatDateToLong(rowData.father_birthday));
        $('#recFaBplace').text(rowData.father_bplace);
        $('#recFaAddress').text(rowData.father_address);

        $('#deathIndex').text(rowData.death_index);
        $('#deathBook').text(rowData.death_book);
        $('#deathPage').text(rowData.death_page);
        $('#deathLine').text(rowData.death_line);
        $('#confIndex').text(rowData.conf_index);
        $('#confBook').text(rowData.conf_book);
        $('#confPage').text(rowData.conf_page);
        $('#confLine').text(rowData.conf_line);
        
        // Show the modal
        $('#modalsearch').modal('show');
    });


    // Function to format date to YYYY-MM-DD
    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Function to format date to "MM/DD/YYYY"
    function formatDateToMMDDYYYY(dateString) {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }

    // Function to format date to "Month DD, YYYY"
    function formatDateToLong(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    function calculateAge(birthday) {
        let birthDate = new Date(birthday);
        let today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();

        let monthDiff = today.getMonth() - birthDate.getMonth();
        let dayDiff = today.getDate() - birthDate.getDate();
    
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--;
        }
        return age;
    }

    window.formatDate = formatDate;
    window.formatDateToLong = formatDateToLong;
});


