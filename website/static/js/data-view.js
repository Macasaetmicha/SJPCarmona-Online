$(document).ready(function() {
    const positionLabels = {
        "parish_priest": "Parish Priest",
        "guest_priest": "Guest Priest",
        "bishop": "Bishop"
    };
    
    $(document).on('click', '.find-btn-rec', function() {
        const recordId = $(this).data('id');
        console.log('Record ID:', recordId);

        fetch(`/api_db/record/view/${recordId}`)
            .then(res => res.json())
            .then(data => {
                console.log('Fetched data:', data);
                if (data && data.data) {
                    const recordData = data.data[0];

                    $('#recClientName').text(`${recordData.first_name} ${recordData.middle_name} ${recordData.last_name}`);
                    $('#recClientBday').text(formatDateToLong(recordData.birthday));
                    $('#recClientLigitivity').text(recordData.ligitivity);
                    $('#recClientBplace').text(recordData.birthplace);
                    $('#recClientAddress').text(recordData.address);                  
                    $('#recClientBrgy').text(recordData.brgy.desc);
                    $('#recClientCityMun').text(recordData.citymun.desc);
                    $('#recClientProv').text(recordData.province.desc);
                    $('#recClientReg').text(recordData.region.desc);
                    
                    $('#recMoName').text(`${recordData.mother?.first_name || 'N/A'} ${recordData.mother?.middle_name || ''} ${recordData.mother?.last_name || ''}`);
                    $('#recMoBday').text(formatDateToLong(recordData.mother?.birthday) || 'N/A');
                    $('#recMoBplace').text(recordData.mother?.birthplace || 'N/A');
                    $('#recMoAddress').text(recordData.mother?.address || 'N/A');
                    
                    $('#recFaName').text(`${recordData.father?.first_name || 'N/A'} ${recordData.father?.middle_name || ''} ${recordData.father?.last_name || ''}`);
                    $('#recFaBday').text(formatDateToLong(recordData.father?.birthday) || 'N/A');
                    $('#recFaBplace').text(recordData.father?.birthplace || 'N/A');
                    $('#recFaAddress').text(recordData.father?.address || 'N/A');
                    
                    $('#baptIndex').text(recordData.ceremonies.baptism?.index || '-');
                    $('#baptBook').text(recordData.ceremonies.baptism?.book || '-');
                    $('#baptPage').text(recordData.ceremonies.baptism?.page || '-');
                    $('#baptLine').text(recordData.ceremonies.baptism?.line || '-');
                    
                    $('#confIndex').text(recordData.ceremonies.confirmation?.index || '-');
                    $('#confBook').text(recordData.ceremonies.confirmation?.book || '-');
                    $('#confPage').text(recordData.ceremonies.confirmation?.page || '-');
                    $('#confLine').text(recordData.ceremonies.confirmation?.line || '-');
                    
                    const weddingData = recordData.ceremonies.wedding;

                    $('#wedIndex').text(weddingData?.groom?.index || weddingData?.bride?.index || '-');
                    $('#wedBook').text(weddingData?.groom?.book || weddingData?.bride?.book || '-');
                    $('#wedPage').text(weddingData?.groom?.page || weddingData?.bride?.page || '-');
                    $('#wedLine').text(weddingData?.groom?.line || weddingData?.bride?.line || '-');

                    
                    $('#deathIndex').text(recordData.ceremonies.death?.index || '-');
                    $('#deathBook').text(recordData.ceremonies.death?.book || '-');
                    $('#deathPage').text(recordData.ceremonies.death?.page || '-');
                    $('#deathLine').text(recordData.ceremonies.death?.line || '-');
                    } else {
                        console.error('No data found for this record.');
                    }
            })
            .catch(err => {
                console.error('Error fetching record details:', err);
            });
    });

    $(document).on('click', '.find-btn-bapt', function() {
        const baptismId = $(this).data('id');
        console.log('Baptism ID:', baptismId);

        fetch(`/api_db/baptism/view/${baptismId}`)
            .then(res => res.json())
            .then(data => {
                console.log('Fetched data:', data);
                if (data && data.data) {
                    const baptismData = data.data[0];

                    $('#baptClientName').text(`${baptismData.record.first_name } ${baptismData.record.middle_name} ${baptismData.record.last_name}`);
                    $('#baptClientBday').text(formatDateToLong(baptismData.record.birthday));
                    $('#baptClientBplace').text(baptismData.record.birthplace);
                    $('#baptClientLigitivity').text(baptismData.record.ligitivity);
                    $('#baptClientAddress').text(baptismData.record.address);
                    $('#baptClientBrgy').text(baptismData.record.brgy);
                    $('#baptClientCityMun').text(baptismData.record.citymun);
                    $('#baptClientProv').text(baptismData.record.province);
                    $('#baptClientReg').text(baptismData.record.region);
                    console.log(baptismData)
                    
                    $('#baptDate').text(formatDateToLong(baptismData.baptism_date));
                    $('#baptPriest').text(baptismData.priest.name);
                    $('#baptSponsA').text(baptismData.sponsorA);
                    $('#baptSponsResA').text(baptismData.residenceA);
                    $('#baptSponsB').text(baptismData.sponsorB);
                    $('#baptSponsResB').text(baptismData.residenceB);
    
                    $('#baptIndex').text(baptismData.rec_index || 'N/A');
                    $('#baptBook').text(baptismData.rec_book || 'N/A');
                    $('#baptPage').text(baptismData.rec_page || 'N/A');
                    $('#baptLine').text(baptismData.rec_line || 'N/A');
                } else {
                    console.error('No data found for this baptism.');
                }
            })
            .catch(err => {
                console.error('Error fetching baptism details:', err);
            });
    });

    $(document).on('click', '.find-btn-conf', function() {
        const confirmationId = $(this).data('id');
        console.log('Confirmation ID:', confirmationId);

        fetch(`/api_db/confirmation/view/${confirmationId}`)
            .then(res => res.json())
            .then(data => {
                console.log('Fetched data:', data);
                if (data && data.data) {
                    const confirmationData = data.data[0];

                    $('#confClientName').text(`${confirmationData.record.first_name } ${confirmationData.record.middle_name} ${confirmationData.record.last_name}`);
                    $('#confClientBday').text(formatDateToLong(confirmationData.record.birthday));
                    $('#confClientBplace').text(confirmationData.record.birthplace);
                    $('#confClientLigitivity').text(confirmationData.record.ligitivity);
                    $('#confClientAddress').text(confirmationData.record.address);

                    $('#confClientBrgy').text(confirmationData.record.brgy);
                    $('#confClientCityMun').text(confirmationData.record.citymun);
                    $('#confClientProv').text(confirmationData.record.province);
                    $('#confClientReg').text(confirmationData.record.region);

                    $('#confBaptChurch').text(confirmationData.church_baptized);
                    
                    $('#confDate').text(formatDateToLong(confirmationData.confirmation_date));
                    $('#confPriest').text(confirmationData.priest.name);
                    $('#confSponsA').text(confirmationData.sponsorA);
                    $('#confSponsB').text(confirmationData.sponsorB);
                
                    $('#confIndex').text(confirmationData.rec_index || 'N/A');
                    $('#confBook').text(confirmationData.rec_book || 'N/A');
                    $('#confPage').text(confirmationData.rec_page || 'N/A');
                    $('#confLine').text(confirmationData.rec_line || 'N/A');
                } else {
                    console.error('No data found for this Confirmation.');
                }
            })
            .catch(err => {
                console.error('Error fetching Confirmation details:', err);
            });
    });

    $(document).on('click', '.find-btn-wedd', function() {
        const weddingId = $(this).data('id');
        console.log('Wedding ID:', weddingId);

        fetch(`/api_db/wedding/view/${weddingId}`)
            .then(res => res.json())
            .then(data => {
                console.log('Fetched data:', data);
                if (data && data.data) {
                    const weddingData = data.data[0];

                    $('#weddGroomName').text(`${weddingData.groom.first_name } ${weddingData.groom.middle_name} ${weddingData.groom.last_name}`);
                    $('#weddGroomBday').text(formatDateToLong(weddingData.groom.birthday));
                    $('#weddGroomBplace').text(weddingData.groom.birthplace);
                    $('#weddGroomLigitivity').text(weddingData.groom.ligitivity);
                    $('#weddGroomAddress').text(weddingData.groom.address);
                    $('#weddGroomClientBrgy').text(weddingData.groom.brgy);
                    $('#weddGroomClientCityMun').text(weddingData.groom.citymun);
                    $('#weddGroomClientProv').text(weddingData.groom.province);
                    $('#weddGroomClientReg').text(weddingData.groom.region);
    
                    $('#weddBrideName').text(`${weddingData.bride.first_name } ${weddingData.bride.middle_name} ${weddingData.bride.last_name}`);
                    $('#weddBrideBday').text(formatDateToLong(weddingData.bride.birthday));
                    $('#weddBrideBplace').text(weddingData.bride.birthplace);
                    $('#weddBrideLigitivity').text(weddingData.bride.ligitivity);
                    $('#weddBrideAddress').text(weddingData.bride.address);
                    $('#weddBrideClientBrgy').text(weddingData.bride.brgy);
                    $('#weddBrideClientCityMun').text(weddingData.bride.citymun);
                    $('#weddBrideClientProv').text(weddingData.bride.province);
                    $('#weddBrideClientReg').text(weddingData.bride.region);
                    
                    $('#weddDate').text(formatDateToLong(weddingData.wedding_date));
                    $('#weddPriest').text(weddingData.priest.name);
                    $('#weddSponsA').text(weddingData.sponsorA);
                    $('#weddSponsB').text(weddingData.sponsorB);
                    $('#licenseNumber').text(weddingData.license_number);
                    $('#civilDate').text(formatDateToLong(weddingData.civil_date));
                    $('#civilPlace').text(weddingData.civil_place);
                 
                    $('#weddIndex').text(weddingData.rec_index || 'N/A');
                    $('#weddBook').text(weddingData.rec_book || 'N/A');
                    $('#weddPage').text(weddingData.rec_page || 'N/A');
                    $('#weddLine').text(weddingData.rec_line || 'N/A');
                } else {
                    console.error('No data found for this Wedding.');
                }
            })
            .catch(err => {
                console.error('Error fetching Wedding details:', err);
            });
    });

    $(document).on('click', '.find-btn-death', function() {
        const deathId = $(this).data('id');
        console.log('Death ID:', deathId);

        fetch(`/api_db/death/view/${deathId}`)
            .then(res => res.json())
            .then(data => {
                console.log('Fetched data:', data);
                if (data && data.data) {
                    const deathData = data.data[0];

                    $('#deathClientName').text(`${deathData.record.first_name } ${deathData.record.middle_name} ${deathData.record.last_name}`);
                    $('#deathClientBday').text(formatDateToLong(deathData.record.birthday));
                    $('#deathClientBplace').text(deathData.record.birthplace);
                    $('#deathClientLigitivity').text(deathData.record.ligitivity);
                    $('#deathClientAddress').text(deathData.record.address);

                    $('#deathClientBrgy').text(deathData.record.brgy);
                    $('#deathClientCityMun').text(deathData.record.citymun);
                    $('#deathClientProv').text(deathData.record.province);
                    $('#deathClientReg').text(deathData.record.region);
                    console.log(deathData)
                    
                    $('#deathDate').text(formatDateToLong(deathData.death_date));
                    $('#deathPriest').text(deathData.priest.name);
                    $('#burialDate').text(formatDateToLong(deathData.burial_date));
                    $('#contact_person').text(deathData.contact_person);
                    $('#cp_address').text(deathData.cp_address);
                    $('#deathCause').text(deathData.cause_of_death);
                    $('#burialPlace').text(deathData.burial_place);

                    $('#deathIndex').text(deathData.rec_index || 'N/A');
                    $('#deathBook').text(deathData.rec_book || 'N/A');
                    $('#deathPage').text(deathData.rec_page || 'N/A');
                    $('#deathLine').text(deathData.rec_line || 'N/A');
                } else {
                    console.error('No data found for this death.');
                }
            })
            .catch(err => {
                console.error('Error fetching death details:', err);
            });
    });

    $(document).on('click', '.find-btn-priest', function() {
        const priestId = $(this).data('id');
        console.log('Priest ID:', priestId);

        fetch(`/api_db/priest/view/${priestId}`)
            .then(res => res.json())
            .then(data => {
                console.log('Fetched data:', data);
                if (data && data.data) {
                    const priestData = data.data[0];
                    $('#priestName').text(priestData.name);
                    $('#priestPosition').text(positionLabels[priestData.position] || priestData.position);
                    $('#priestChurch').text(priestData.church);
                    $('#priestStatus').text(priestData.status);
                    $('#priestBapt').text(priestData.baptisms || '0');
                    $('#priestConf').text(priestData.confirmations || '0');
                    $('#priestWedd').text(priestData.weddings || '0');
                    $('#priestDeath').text(priestData.deaths || '0');
                } else {
                    console.error('No data found for this Priest.');
                }
            })
            .catch(err => {
                console.error('Error fetching priest details:', err);
            });
    });

    $(document).on('click', '.find-btn-request', function() {
        const requestId = $(this).data('id');
        console.log('Reuest ID:', requestId);

        fetch(`/api_db/request/view/${requestId}`)
            .then(res => res.json())
            .then(data => {
                console.log('Fetched data:', data);
                if (data && data.data) {
                    const reqData = data.data[0];
                    $('#requestor').text(`${reqData.user.first_name } ${reqData.user.last_name}`);
                    $('#requestDate').text(formatDateToLong(reqData.requested_at));
                    $('#rec_name').text(toTitleCase(reqData.rec_name || 'N/A'));
                    $('#email').text(reqData.user.email || 'N/A');
                    $('#cont_no').text(reqData.user.cont_no || 'N/A');
                    $('#rec_name').text(toTitleCase(reqData.rec_name || 'N/A'));
                    $('#relationship').text(toTitleCase(reqData.relationship));
                    $('#ceremony').text(toTitleCase(reqData.ceremony));
                    $('#cer_date').text(formatDatePartsToLong(reqData.cer_year, reqData.cer_month, reqData.cer_day));
                    $('#status').text(toTitleCase(reqData.status));
                    $('#pickup_date').text(formatDateToLong(reqData.pickup_date));
                    $('#remarks').text(reqData.remarks || 'N/A');
                    $('#process_date').text(reqData.processed_at ? formatDateToLong(reqData.processed_at) : 'N/A');


                } else {
                    console.error('No data found for this Priest.');
                }
            })
            .catch(err => {
                console.error('Error fetching priest details:', err);
            });
    });
});

function toTitleCase(str) {
    return str?.toLowerCase().replace(/\b\w/g, char => char.toUpperCase()) || 'N/A';
}

function formatDatePartsToLong(year, month, day) {
    if (!year) return 'Unknown Date';

    const parts = [];

    if (month) {
        const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });
        parts.push(monthName);
    }

    if (day) {
        parts.push(day);
    }

    parts.push(year);

    return parts.join(' ');
}
