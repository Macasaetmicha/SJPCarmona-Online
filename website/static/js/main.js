document.addEventListener('DOMContentLoaded', function () {
    let modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
        modal.addEventListener('hidden.bs.modal', function () {
            let accordionItems = modal.querySelectorAll('.accordion-collapse.show');
            accordionItems.forEach(item => {
                new bootstrap.Collapse(item).hide();
            });

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

