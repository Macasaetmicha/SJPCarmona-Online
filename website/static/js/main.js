// document.addEventListener('DOMContentLoaded', function () {
//     const recModal = document.getElementById('recordsModal');

//     if (recModal) {
//         modal.addEventListener('hidden.bs.modal', function () {
//             // Collapse all accordion sections using Bootstrap's method
//             let accordionItems = document.querySelectorAll('.accordion-collapse.show');
//             accordionItems.forEach(item => {
//                 new bootstrap.Collapse(item).hide();
//             });

//             // Reset all accordion buttons manually
//             let accordionButtons = document.querySelectorAll('.accordion-button');
//             accordionButtons.forEach(button => {
//                 button.classList.add('collapsed');  
//                 button.setAttribute('aria-expanded', 'false'); 
//             });

//             document.activeElement.blur(); 
//         });

//         // Force the first tab to always be open when modal is shown
//         modal.addEventListener('shown.bs.modal', function () {
//             let firstAccordion = document.querySelector('.accordion-collapse');
//             let firstButton = document.querySelector('.accordion-button');

//             if (firstAccordion && firstButton) {
//                 new bootstrap.Collapse(firstAccordion, { toggle: true });
//                 firstButton.classList.remove('collapsed');
//                 firstButton.setAttribute('aria-expanded', 'true');
//             }
//         });
//     } else {
//         console.error('Modal element not found!');
//     }
// });

document.addEventListener('DOMContentLoaded', function () {
    let modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
        modal.addEventListener('hidden.bs.modal', function () {
            // Collapse all accordion sections inside THIS modal
            let accordionItems = modal.querySelectorAll('.accordion-collapse.show');
            accordionItems.forEach(item => {
                new bootstrap.Collapse(item).hide();
            });

            // Reset all accordion buttons inside THIS modal
            let accordionButtons = modal.querySelectorAll('.accordion-button');
            accordionButtons.forEach(button => {
                button.classList.add('collapsed');
                button.setAttribute('aria-expanded', 'false');
            });

            document.activeElement.blur();
        });

        modal.addEventListener('shown.bs.modal', function () {
            let firstAccordion = modal.querySelector('.accordion-collapse');
            let firstButton = modal.querySelector('.accordion-button');

            if (firstAccordion && firstButton) {
                new bootstrap.Collapse(firstAccordion, { toggle: true });
                firstButton.classList.remove('collapsed');
                firstButton.setAttribute('aria-expanded', 'true');
            }
        });
    });
});

