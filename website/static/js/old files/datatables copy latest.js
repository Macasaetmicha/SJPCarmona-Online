const createTable = (selector, ajaxUrl, columns) => {
    return $(selector).DataTable({
        paging: true,
        searching: true,
        ordering: true,
        ajax: ajaxUrl,
        columns: columns
    });
};

// Setup data table columns
const recordsColumns = [
    {
        data: null,
        render: function (data, type, row) {
            return `
                <button class="btn btn-primary find-btn" data-id="${row.id}" data-bs-toggle="modal" data-bs-target="#recordsModal">
                    <i class="fa-solid fa-info fa-fw"></i>
                </button>
            `;
        },
        orderable: false,
        searchable: false
    },
    { data: 'first_name' },
    { data: 'middle_name' },
    { data: 'last_name' },
    {
        data: 'birthday',
        render: function (data, type, row) {
            return formatDateToLong(data);
        }
    },
    { data: 'ligitivity' },
    { data: 'birthplace' },
    // { data: 'status' },
    { 
        data: null, 
        render: function(data, type, row) {
            return `${row.address}, ${row.brgy}, ${row.citymun}, ${row.province}`;
        } 
    }
];

const baptismColumns = [
    {
        data: null,
        render: function (data, type, row) {
            return `
                <button class="btn btn-primary find-btn-bapt" data-id="${row.id}" data-bs-toggle="modal" data-bs-target="#showBaptModal">
                    <i class="fa-solid fa-info fa-fw"></i>
                </button>
                <a href="baptism/edit/${row.id}" class="mt-1 edit-btn-bapt-trigger btn btn-warning btn-xs" data-id="${row.id}">
                    <i class="fa-solid fa-edit fa-fw"></i>
                </a>
                <button class="mt-1 delete-btn-bapt btn btn-primary delete-btn" data-id="${row.id}" data-page="deleteBaptism">
                    <i class="fa-solid fa-trash fa-fw"></i>
                </button>
            `;
        },
        orderable: false,
        searchable: false
    },
    {
        data: 'baptism_date',
        render: function (data, type, row) {
            return data ? formatDateToLong(data) : 'N/A'; 
        }
    },
    { data: 'record.first_name' },
    { data: 'record.middle_name' },
    { data: 'record.last_name' },
    {
        data: 'record.birthday',
        render: function (data, type, row) {
            return data ? formatDateToLong(data) : 'N/A'; 
        }
    },
    { 
        data: null, 
        render: function(data, type, row) {
            return `${row.record.address}, ${row.record.brgy}, ${row.record.citymun}, ${row.record.province}`;
        } 
    },
    { 
        data: null, 
        render: function(data, type, row) {
            return row.father ? `${row.father.first_name} ${row.father.middle_name || ''} ${row.father.last_name}`.trim() : 'N/A';
        }
    },
    { 
        data: null, 
        render: function(data, type, row) {
            return row.mother ? `${row.mother.first_name} ${row.mother.middle_name || ''} ${row.mother.last_name}`.trim() : 'N/A';
        }
    },
    { data: 'priest.name' }
];

const confirmationColumns = [
    {
        data: null,
        render: function (data, type, row) {
            return `
                <button class="btn btn-primary find-btn-conf" data-id="${row.id}" data-bs-toggle="modal" data-bs-target="#showConfModal">
                    <i class="fa-solid fa-info fa-fw"></i>
                </button>
                <a href="confirmation/edit/${row.id}" class="mt-1 edit-btn-conf-trigger btn btn-warning btn-xs" data-id="${row.id}">
                    <i class="fa-solid fa-edit fa-fw"></i>
                </a>
                <button class="mt-1 delete-btn-conf btn btn-primary delete-btn" data-id="${row.id}" data-page="deleteConfirmation">
                    <i class="fa-solid fa-trash fa-fw"></i>
                </button>
            `;
        },
        orderable: false,
        searchable: false
    },
    {
        data: 'confirmation_date',
        render: function (data, type, row) {
            return formatDateToLong(data);
        }
    },
    { data: 'record.first_name' },
    { data: 'record.middle_name' },
    { data: 'record.last_name' },
    {
        data: 'record.birthday',
        render: function (data, type, row) {
            return data ? formatDateToLong(data) : 'N/A'; 
        }
    },
    { 
        data: null, 
        render: function(data, type, row) {
            return `${row.record.address}, ${row.record.brgy}, ${row.record.citymun}, ${row.record.province}`;
        } 
    },
    { 
        data: null, 
        render: function(data, type, row) {
            return row.father ? `${row.father.first_name} ${row.father.middle_name || ''} ${row.father.last_name}`.trim() : 'N/A';
        }
    },
    { 
        data: null, 
        render: function(data, type, row) {
            return row.mother ? `${row.mother.first_name} ${row.mother.middle_name || ''} ${row.mother.last_name}`.trim() : 'N/A';
        }
    },
    { data: 'priest.name' }
];

const weddingColumns = [
    {
        data: null,
        render: function (data, type, row) {
            return `
                <button class="btn btn-primary find-btn-wedd" data-id="${row.id}" data-bs-toggle="modal" data-bs-target="#showWeddModal">
                    <i class="fa-solid fa-info fa-fw"></i>
                </button>
                <a href="wedding/edit/${row.id}" class="mt-1 edit-btn-wedd-trigger btn btn-warning btn-xs" data-id="${row.id}">
                    <i class="fa-solid fa-edit fa-fw"></i>
                </a>
                <button class="mt-1 delete-btn-wedd btn btn-primary delete-btn" data-id="${row.id}" data-page="deleteWedding">
                    <i class="fa-solid fa-trash fa-fw"></i>
                </button>
            `;
        },
        orderable: false,
        searchable: false
    },
    { data: 'wedding_date' },
    { 
        data: null, 
        render: function(data, type, row) {
            return row.groom ? `${row.groom.first_name} ${row.groom.middle_name || ''} ${row.groom.last_name}`.trim() : 'N/A';
        }
    },
    {
        data: 'groom.birthday',
        render: function (data, type, row) {
            return data ? formatDateToLong(data) : 'N/A'; 
        }
    },
    { 
        data: null, 
        render: function(data, type, row) {
            return `${row.groom.address}, ${row.groom.brgy}, ${row.groom.citymun}, ${row.groom.province}`;
        } 
    },
    { 
        data: null, 
        render: function(data, type, row) {
            return row.bride ? `${row.bride.first_name} ${row.bride.middle_name || ''} ${row.bride.last_name}`.trim() : 'N/A';
        }
    },
    {
        data: 'bride.birthday',
        render: function (data, type, row) {
            return data ? formatDateToLong(data) : 'N/A'; 
        }
    },
    { 
        data: null, 
        render: function(data, type, row) {
            return `${row.bride.address}, ${row.bride.brgy}, ${row.bride.citymun}, ${row.bride.province}`;
        } 
    },
    { data: 'priest.name' }
];

const deathColumns = [
    {
        data: null,
        render: function (data, type, row) {
            return `
                <button class="btn btn-primary find-btn-death" data-id="${row.id}" data-bs-toggle="modal" data-bs-target="#showDeathModal">
                    <i class="fa-solid fa-info fa-fw"></i>
                </button>
                <a href="death/edit/${row.id}" class="mt-1 edit-btn-death-trigger btn btn-warning btn-xs" data-id="${row.id}">
                    <i class="fa-solid fa-edit fa-fw"></i>
                </a>
                <button class="mt-1 delete-btn-death btn btn-primary delete-btn" data-id="${row.id}" data-page="deleteDeath">
                    <i class="fa-solid fa-trash fa-fw"></i>
                </button>
            `;
        },
        orderable: false,
        searchable: false
    },
    {
        data: 'death_date',
        render: function (data, type, row) {
            return data ? formatDateToLong(data) : 'N/A'; 
        }
    },
    { data: 'record.first_name' },
    { data: 'record.middle_name' },
    { data: 'record.last_name' },
    {
        data: 'record.birthday',
        render: function (data, type, row) {
            return data ? formatDateToLong(data) : 'N/A'; 
        }
    },
    { 
        data: null, 
        render: function(data, type, row) {
            return `${row.record.address}, ${row.record.brgy}, ${row.record.citymun}, ${row.record.province}`;
        } 
    },
    { 
        data: null, 
        render: function(data, type, row) {
            return row.father ? `${row.father.first_name} ${row.father.middle_name || ''} ${row.father.last_name}`.trim() : 'N/A';
        }
    },
    { 
        data: null, 
        render: function(data, type, row) {
            return row.mother ? `${row.mother.first_name} ${row.mother.middle_name || ''} ${row.mother.last_name}`.trim() : 'N/A';
        }
    },
    { data: 'priest.name' }
];

const priestColumns = [
    {
        data: null,
        render: function (data, type, row) {
            return `
                <button class="btn btn-primary find-btn-priest" data-id="${row.id}" data-bs-toggle="modal" data-bs-target="#showPriestModal">
                    <i class="fa-solid fa-info fa-fw"></i>
                </button>
                <button class="btn btn-primary edit-btn-priest edit-btn" data-id="${row.id}" data-bs-toggle="modal" data-bs-target="#editPriestModal">
                    <i class="fa-solid fa-edit fa-fw"></i>
                </button>
                <button class="mt-1 delete-btn-priest btn btn-primary delete-btn" data-id="${row.id}" data-page="deletePriest">
                    <i class="fa-solid fa-trash fa-fw"></i>
                </button>
            `;
        },
        orderable: false,
        searchable: false
    },
    { data: 'name' },
    { data: 'position' },
    { data: 'church' },
    { data: 'status' }
];

const tables = {}; // Store multiple table instances

$(document).ready(function() {
    tables.recordTable = createTable('#recordTable', '/api_db/records', recordsColumns);
    tables.baptismTable = createTable('#baptismTable', '/api_db/baptism', baptismColumns);
    tables.confirmationTable = createTable('#confirmationTable', '/api_db/confirmation', confirmationColumns);
    tables.weddingTable = createTable('#weddingTable', '/api_db/wedding', weddingColumns);
    tables.deathTable = createTable('#deathTable', '/api_db/death', deathColumns);
    tables.priestTable = createTable('#priestTable', '/api_db/priest', priestColumns);


    tables.recordTable.on('draw.dt', function() {
        $('#recordTable tbody').off('click', '.find-btn').on('click', '.find-btn', function() {
            let rowData = tables.recordTable.row($(this).closest('tr')).data();

            console.log(rowData)
            
            if (rowData) {
                $('#recClientName').text(`${rowData.first_name} ${rowData.middle_name} ${rowData.last_name}`);
                $('#recClientBday').text(formatDateToLong(rowData.birthday));
                $('#recClientLigitivity').text(rowData.ligitivity);
                $('#recClientBplace').text(rowData.birthplace);
                $('#recClientAddress').text(rowData.address);                  
                $('#recClientBrgy').text(rowData.brgy);
                $('#recClientCityMun').text(rowData.citymun);
                $('#recClientProv').text(rowData.province);
                $('#recClientReg').text(rowData.region);
                
                // Populate mother details
                $('#recMoName').text(`${rowData.mother?.first_name || 'N/A'} ${rowData.mother?.middle_name || ''} ${rowData.mother?.last_name || ''}`);
                $('#recMoBday').text(formatDateToLong(rowData.mother?.birthday) || 'N/A');
                $('#recMoBplace').text(rowData.mother?.birthplace || 'N/A');
                $('#recMoAddress').text(rowData.mother?.address || 'N/A');
                
                // Populate father details
                $('#recFaName').text(`${rowData.father?.first_name || 'N/A'} ${rowData.father?.middle_name || ''} ${rowData.father?.last_name || ''}`);
                $('#recFaBday').text(formatDateToLong(rowData.father?.birthday) || 'N/A');
                $('#recFaBplace').text(rowData.father?.birthplace || 'N/A');
                $('#recFaAddress').text(rowData.father?.address || 'N/A');
                
                // Populate Baptism details
                $('#baptIndex').text(rowData.ceremonies.baptism?.index || 'N/A');
                $('#baptBook').text(rowData.ceremonies.baptism?.book || 'N/A');
                $('#baptPage').text(rowData.ceremonies.baptism?.page || 'N/A');
                $('#baptLine').text(rowData.ceremonies.baptism?.line || 'N/A');
                
                // Populate Confirmation details
                $('#confIndex').text(rowData.ceremonies.confirmation?.index || 'N/A');
                $('#confBook').text(rowData.ceremonies.confirmation?.book || 'N/A');
                $('#confPage').text(rowData.ceremonies.confirmation?.page || 'N/A');
                $('#confLine').text(rowData.ceremonies.confirmation?.line || 'N/A');
                
                // Populate Wedding details
                $('#wedIndex').text(rowData.ceremonies.wedding?.index || 'N/A');
                $('#wedBook').text(rowData.ceremonies.wedding?.book || 'N/A');
                $('#wedPage').text(rowData.ceremonies.wedding?.page || 'N/A');
                $('#wedLine').text(rowData.ceremonies.wedding?.line || 'N/A');
                
                // Populate Death details
                $('#deathIndex').text(rowData.ceremonies.death?.index || 'N/A');
                $('#deathBook').text(rowData.ceremonies.death?.book || 'N/A');
                $('#deathPage').text(rowData.ceremonies.death?.page || 'N/A');
                $('#deathLine').text(rowData.ceremonies.death?.line || 'N/A');
               
            }
        });
    });

    tables.baptismTable.on('draw.dt', function() {
        $('#baptismTable tbody').off('click', '.find-btn-bapt').on('click', '.find-btn-bapt', function() {
            let rowData = tables.baptismTable.row($(this).closest('tr')).data();
    
            if (rowData) {
                $('#baptClientName').text(`${rowData.record.first_name } ${rowData.record.middle_name} ${rowData.record.last_name}`);
                $('#baptClientBday').text(formatDateToLong(rowData.record.birthday));
                $('#baptClientBplace').text(rowData.record.birthplace);
                $('#baptClientLigitivity').text(rowData.record.ligitivity);
                $('#baptClientAddress').text(rowData.record.address);
                $('#baptClientBrgy').text(rowData.record.brgy);
                $('#baptClientCityMun').text(rowData.record.citymun);
                $('#baptClientProv').text(rowData.record.province);
                $('#baptClientReg').text(rowData.record.region);
                console.log(rowData)
                
                // Populate Baptism details
                $('#baptDate').text(formatDateToLong(rowData.baptism_date));
                $('#baptPriest').text(rowData.priest.name);
                $('#baptSponsA').text(rowData.sponsorA);
                $('#baptSponsResA').text(rowData.residenceA);
                $('#baptSponsB').text(rowData.sponsorB);
                $('#baptSponsResB').text(rowData.residenceA);

                //Populate Record details
                $('#baptIndex').text(rowData.rec_index || 'N/A');
                $('#baptBook').text(rowData.rec_book || 'N/A');
                $('#baptPage').text(rowData.rec_page || 'N/A');
                $('#baptLine').text(rowData.rec_line || 'N/A');
               
            }
        });
    });

    tables.confirmationTable.on('draw.dt', function() {
        $('#confirmationTable tbody').off('click', '.find-btn-conf').on('click', '.find-btn-conf', function() {
            let rowData = tables.confirmationTable.row($(this).closest('tr')).data();
    
            if (rowData) {
                $('#confClientName').text(`${rowData.record.first_name } ${rowData.record.middle_name} ${rowData.record.last_name}`);
                $('#confClientBday').text(formatDateToLong(rowData.record.birthday));
                $('#confClientBplace').text(rowData.record.birthplace);
                $('#confClientLigitivity').text(rowData.record.ligitivity);
                $('#confClientAddress').text(rowData.record.address);

                $('#confClientBrgy').text(rowData.record.brgy);
                $('#confClientCityMun').text(rowData.record.citymun);
                $('#confClientProv').text(rowData.record.province);
                $('#confClientReg').text(rowData.record.region);

                $('#confBaptChurch').text(rowData.church_baptized);
                
                // Populate Baptism details
                $('#confDate').text(formatDateToLong(rowData.confirmation_date));
                $('#confPriest').text(rowData.priest.name);
                $('#confSponsA').text(rowData.sponsorA);
                $('#confSponsB').text(rowData.sponsorB);
             
                //Populate Record details
                $('#confIndex').text(rowData.rec_index || 'N/A');
                $('#confBook').text(rowData.rec_book || 'N/A');
                $('#confPage').text(rowData.rec_page || 'N/A');
                $('#confLine').text(rowData.rec_line || 'N/A');
               
            }
        });
    });

    tables.weddingTable.on('draw.dt', function() {
        $('#weddingTable tbody').off('click', '.find-btn-wedd').on('click', '.find-btn-wedd', function() {
            let rowData = tables.weddingTable.row($(this).closest('tr')).data();
    
            if (rowData) {
                $('#weddGroomName').text(`${rowData.groom.first_name } ${rowData.groom.middle_name} ${rowData.groom.last_name}`);
                $('#weddGroomBday').text(formatDateToLong(rowData.groom.birthday));
                $('#weddGroomBplace').text(rowData.groom.birthplace);
                $('#weddGroomLigitivity').text(rowData.groom.ligitivity);
                $('#weddGroomAddress').text(rowData.groom.address);
                $('#weddGroomClientBrgy').text(rowData.groom.brgy);
                $('#weddGroomClientCityMun').text(rowData.groom.citymun);
                $('#weddGroomClientProv').text(rowData.groom.province);
                $('#weddGroomClientReg').text(rowData.groom.region);

                $('#weddBrideName').text(`${rowData.bride.first_name } ${rowData.bride.middle_name} ${rowData.bride.last_name}`);
                $('#weddBrideBday').text(formatDateToLong(rowData.bride.birthday));
                $('#weddBrideBplace').text(rowData.bride.birthplace);
                $('#weddBrideLigitivity').text(rowData.bride.ligitivity);
                $('#weddBrideAddress').text(rowData.bride.address);
                $('#weddBrideClientBrgy').text(rowData.bride.brgy);
                $('#weddBrideClientCityMun').text(rowData.bride.citymun);
                $('#weddBrideClientProv').text(rowData.bride.province);
                $('#weddBrideClientReg').text(rowData.bride.region);
                
                // Populate Baptism details
                $('#weddDate').text(formatDateToLong(rowData.baptism_date));
                $('#weddPriest').text(rowData.priest.name);
                $('#weddSponsA').text(rowData.sponsorA);
                $('#weddSponsB').text(rowData.sponsorB);
                $('#licenseNumber').text(rowData.license_number);
                $('#civilDate').text(rowData.civil_date);
                $('#civilPlace').text(rowData.civil_place);
             
                //Populate Record details
                $('#weddIndex').text(rowData.rec_index || 'N/A');
                $('#weddBook').text(rowData.rec_book || 'N/A');
                $('#weddPage').text(rowData.rec_page || 'N/A');
                $('#weddLine').text(rowData.rec_line || 'N/A');
               
            }
        });
    });

    tables.deathTable.on('draw.dt', function() {
        $('#deathTable tbody').off('click', '.find-btn-death').on('click', '.find-btn-death', function() {
            let rowData = tables.deathTable.row($(this).closest('tr')).data();
    
            if (rowData) {
                $('#deathClientName').text(`${rowData.record.first_name } ${rowData.record.middle_name} ${rowData.record.last_name}`);
                $('#deathClientBday').text(formatDateToLong(rowData.record.birthday));
                $('#deathClientBplace').text(rowData.record.birthplace);
                $('#deathClientLigitivity').text(rowData.record.ligitivity);
                $('#deathClientAddress').text(rowData.record.address);

                $('#deathClientBrgy').text(rowData.record.brgy);
                $('#deathClientCityMun').text(rowData.record.citymun);
                $('#deathClientProv').text(rowData.record.province);
                $('#deathClientReg').text(rowData.record.region);
                console.log(rowData)
                
                // Populate Baptism details
                $('#deathDate').text(formatDateToLong(rowData.deathism_date));
                $('#deathPriest').text(rowData.priest.name);
                $('#burialDate').text(formatDateToLong(rowData.burial_date));
                $('#contact_person').text(rowData.contact_person);
                $('#cp_address').text(rowData.cp_address);
                $('#deathCause').text(rowData.cause_of_death);
                $('#burialPlace').text(rowData.burial_place);

                //Populate Record details
                $('#deathIndex').text(rowData.rec_index || 'N/A');
                $('#deathBook').text(rowData.rec_book || 'N/A');
                $('#deathPage').text(rowData.rec_page || 'N/A');
                $('#deathLine').text(rowData.rec_line || 'N/A');
               
            }
        });
    });

    tables.priestTable.on('draw.dt', function() {
        $('#priestTable tbody').off('click', '.find-btn-priest').on('click', '.find-btn-priest', function() {
            let rowData = tables.priestTable.row($(this).closest('tr')).data();
    
            if (rowData) {
                $('#priestName').text(rowData.name);
                $('#priestPosition').text(rowData.position);
                $('#priestChurch').text(rowData.church);
                $('#priestStatus').text(rowData.status);
                $('#priestBapt').text(rowData.baptisms || '0');
                $('#priestConf').text(rowData.confirmations || '0');
                $('#priestWedd').text(rowData.weddings || '0');
                $('#priestDeath').text(rowData.deaths || '0');
                console.log(rowData)
               
            }
        });
    });
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

//function to format date to "yyyy-mm-dd"
function formatFormDate(dateString) {
    let date = new Date(dateString);
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, "0"); 
    let day = String(date.getDate()).padStart(2, "0"); 
    return `${year}-${month}-${day}`;
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
window.formatFormDate = formatFormDate;

