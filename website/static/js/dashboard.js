document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    const dateDisplay = document.getElementById('current-date');

    if (!calendarEl) {
        console.error('Element with ID "calendar" not found.');
        return;
    }

    let openDetailDate = null;

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        eventSources: [
        {
            url: '/api_db/get-schedule',
            method: 'GET',
            failure: () => toastr.error("Failed to load schedule events")
        },
        {
            url: '/api_db/get-request',
            method: 'GET',
            failure: () => toastr.error("Failed to load request events"),
            success: function(data) {
                return data.data.map(ev => ({
                    ...ev,
                    title: `REQUEST`.toUpperCase()
                }));
            }
        }
        ],
        headerToolbar: false,
        height: 'auto',

        datesSet: function(info) {
            const date = new Date(info.view.currentStart);
            const options = { month: 'long', year: 'numeric' };
            dateDisplay.textContent = date.toLocaleDateString(undefined, options);
        },

        dateClick: function(info) {
            const clickedDate = info.dateStr;

            if (openDetailDate === clickedDate) {
                document.querySelectorAll('.fc-custom-detail-row').forEach(el => el.remove());
                openDetailDate = null;
                return;
            }

            document.querySelectorAll('.fc-custom-detail-row').forEach(el => el.remove());

            const clicked = new Date(clickedDate);
            clicked.setHours(0, 0, 0, 0);

            const eventsForDate = calendar.getEvents().filter(event => {
                const start = new Date(event.start);
                let end = new Date(event.end || event.start);

                if (event.allDay && end.getHours() === 0 && end.getMinutes() === 0) {
                    end.setDate(end.getDate() - 1);
                }

                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);

                return clicked >= start && clicked <= end;
            });

            const detailRow = document.createElement('tr');
            detailRow.className = 'fc-custom-detail-row';

            const detailCell = document.createElement('td');
            detailCell.colSpan = 7;

            if (eventsForDate.length > 0) {
                const parishEvents = eventsForDate.filter(ev => {
                    return !ev.classNames.includes("event-request") && !ev.classNames.includes("event-holiday");
                });

                const requestEvents = eventsForDate.filter(ev => ev.classNames.includes("event-request"));
                const holidayEvents = eventsForDate.filter(ev => ev.classNames.includes("event-holiday"));

                const formatDate = (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const formatTime = (date) => date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

                const formatDateTime = (date) => `${formatDate(date)} (${formatTime(date)})`;

                let parishItems = '';
                if (parishEvents.length > 0) {
                    const sortedParishEvents = parishEvents.sort((a, b) => a.start - b.start);

                    parishItems = sortedParishEvents.map(ev => {
                        const start = ev.start;
                        const end = ev.end;
                        const description = ev.extendedProps.description || '';

                        let timeDisplay = '';
                        if (start && end) {
                            const isSameDay = start.toDateString() === end.toDateString();
                            if (
                                start.getHours() === 0 && start.getMinutes() === 0 &&
                                end.getHours() === 23 && end.getMinutes() === 59
                            ) {
                                timeDisplay = `All day`;
                            } else if (isSameDay) {
                                timeDisplay = `${formatTime(start)} - ${formatTime(end)}`;
                            } else {
                                timeDisplay = `${formatDateTime(start)} - ${formatDateTime(end)}`;
                            }
                        }

                        return `
                            <li>
                                <em>${timeDisplay}</em> ${ev.title}<br>
                                <small class="text-muted">${description}</small>
                            </li>`;
                    }).join('');
                }


                const toTitleCase = str => str.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

                let requestItems = '';
                if (requestEvents.length > 0) {
                    const groupedRequests = requestEvents.reduce((groups, ev) => {
                        const status = ev.extendedProps.status || 'Unknown'; 
                        if (!groups[status]) {
                            groups[status] = [];
                        }
                        groups[status].push(ev);
                        return groups;
                    }, {});

                    for (let status in groupedRequests) {
                        const requests = groupedRequests[status];
                        
                        let requestListItems = '';
                        const sortedRequests = requests.sort((a, b) => new Date(a.start) - new Date(b.start));

                        requestListItems = sortedRequests.map(ev => {
                            const ceremony = ev.extendedProps.ceremony 
                                ? toTitleCase(ev.extendedProps.ceremony) 
                                : '';
                            const recName = ev.extendedProps.rec_name || '';
                            const requestor = ev.extendedProps.requestor || '';
                            const cerDate = ev.extendedProps.cer_date 
                                ? new Date(ev.extendedProps.cer_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                                : '';

                            return ` 
                                <li>
                                    <em>${requestor}</em> – ${ceremony} (${cerDate}) for <strong>${recName}</strong>
                                </li>`;
                        }).join('');

                        requestItems += `
                            <em>${toTitleCase(status)}</em>
                            <ul>
                                ${requestListItems}
                            </ul>`;
                    }
                }



                let holidayItems = '';
                if (holidayEvents.length > 0) {
                    holidayItems = holidayEvents.map(ev => {
                        const title = ev.title || 'Holiday';
                        return `
                            <li>
                                <strong>Holiday:</strong> <em>${title}</em>
                            </li>`;
                    }).join('');
                }

                let requestSection = '';
                if (requestItems) {
                    requestSection = `
                        <strong>Documents for Release:</strong>
                        <ul>
                            ${requestItems}
                        </ul>`;
                }

                let holidaySection = '';
                if (holidayItems) {
                    holidaySection = `
                        <strong>Holidays:</strong>
                        <ul>
                            ${holidayItems}
                        </ul>`;
                }

                let scheduleSection = '';
                if (parishItems) {
                    scheduleSection = `
                        <strong>Schedules for ${new Date(clickedDate).toDateString()}:</strong>
                        <ul>
                            ${parishItems}
                        </ul>`;
                }


                detailCell.innerHTML = holidaySection + scheduleSection + requestSection;
            } else {
                detailCell.innerHTML = `<em>No schedules for ${new Date(clickedDate).toDateString()}</em>`;
            }



            detailRow.appendChild(detailCell);

            const dayCell = document.querySelector(`.fc-daygrid-day[data-date="${clickedDate}"]`);
            if (dayCell) {
                const row = dayCell.closest('tr');
                if (row && row.parentNode) {
                    row.parentNode.insertBefore(detailRow, row.nextSibling);
                }
            }

            openDetailDate = clickedDate;
        },

        dayCellDidMount: function(info) {
            const day = info.date.getDay(); 

            if (day >= 3 && day <= 5) { 
                info.el.classList.add('highlight-wed-fri');
            }
        },
        eventClick: function(info) {
            info.jsEvent.preventDefault();

            const event = info.event;
            const sourceUrl = event.source?.url || '';
            const isRequest = sourceUrl.includes('/get-request');

            let modalTitle = '';
            let modalBody = '';

            if (isRequest) {
                modalTitle = "Document Request Details";

                const requestor = event.extendedProps.requestor || 'N/A';
                const relation = event.extendedProps.relationship || 'N/A';
                const recName = event.extendedProps.rec_name || 'N/A';
                const ceremony = event.extendedProps.ceremony || 'N/A';
                const cerDate = event.extendedProps.cer_date || 'N/A';
                const status = event.extendedProps.status || 'N/A';
                const remarks = event.extendedProps.remarks || null;

                modalBody = `
                    <p><strong>Requestor:</strong> ${requestor}</p>
                    <p><strong>Relation to the owner:</strong> ${relation}</p>
                    <p><strong>Name on Document:</strong> ${recName}</p>
                    <p><strong>Ceremony:</strong> ${ceremony}</p>
                    <p><strong>Ceremony Date:</strong> ${cerDate}</p>
                    <hr>
                    <p><strong>Status:</strong> ${status}</p>
                    ${remarks ? `<hr><p><strong>Remarks:</strong> ${remarks}</p>` : ''}
                `;
            } else {
                modalTitle = "Event Details";

                // const title = event.title || 'Untitled Event';
                const title = event.title ? event.title.toUpperCase() : 'UNTITLED EVENT';
                const start = event.start ? event.start.toLocaleString() : 'N/A';
                const end = event.end ? event.end.toLocaleString() : 'N/A';
                const status = event.extendedProps.status || 'Scheduled';
                const description = event.extendedProps.description || null;

                modalBody = `
                    <p><strong style="font-size: 1.2em;">${title}</strong></p>
                    <p><strong>Date & Time:</strong> ${start} - ${end}</p>
                    <hr>
                    <p><strong>Status:</strong> ${status}</p>
                    ${description ? `<hr><p><strong>Description:</strong> ${description}</p>` : ''}
                `;
            }

            document.getElementById('eventDetailLabel').textContent = modalTitle;
            document.getElementById('eventDetailBody').innerHTML = modalBody;
            const modal = new bootstrap.Modal(document.getElementById('eventDetailModal'));
            modal.show();
        }
    });

    calendar.render();

    document.getElementById('prevBtn').addEventListener('click', () => {
        calendar.prev();
        openDetailDate = null;
        document.querySelectorAll('.fc-custom-detail-row').forEach(el => el.remove());
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        calendar.next();
        openDetailDate = null;
        document.querySelectorAll('.fc-custom-detail-row').forEach(el => el.remove());
    });

    document.getElementById('currentMonthBtn').addEventListener('click', () => {
        calendar.today();
        openDetailDate = null;
        document.querySelectorAll('.fc-custom-detail-row').forEach(el => el.remove());
    });

    const helpTooltip = new bootstrap.Tooltip(document.getElementById('calendarHelpIcon'), {
        title: `
            <div>
                <div><span class="tooltip-box fc-event sched-baptism">Baptism</span></div>
                <div><span class="tooltip-box fc-event sched-confirmation">Confirmation</span></div>
                <div><span class="tooltip-box fc-event sched-wedding">Wedding</span></div>
                <div><span class="tooltip-box fc-event sched-death">Funeral</span></div>
                <div><span class="tooltip-box event-request">Request</span></div>

                <hr class="my-1">
                <div><span class="circle-indicator bg-success me-1"></span>Active</div>
                <div><span class="circle-indicator bg-danger me-1"></span>Cancelled / Rejected</div>
            </div>
        `,
        html: true,
        placement: 'left',
    });

    function fetchRequestCount(startDate, endDate) {
        $.ajax({
            url: `/api_db/get-request/count?start=${startDate}&end=${endDate}`,
            type: "GET",
            success: function (data) {
                $(".reviewCount").text(data.pending || 0);
                $(".inprogCount").text(data.processing || 0);
                $(".pickupCount").text(data.ready || 0);
                $(".rejectCount").text(data.rejected || 0);
                $(".cancelCount").text(data.cancelled || 0);
                $(".completeCount").text(data.completed || 0);
            },
            error: function () {
                console.error("Error fetching record count.");
            }
        });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = endOfMonth.toISOString().split('T')[0];

    fetchRequestCount(startDate, endDate);

});

function formatCustomDate(date) {
    if (!(date instanceof Date)) return 'N/A';
    return date.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: undefined,
        hour12: true,
    }).replace(':00', '').toLowerCase(); 
}

