const ctaButton = document.querySelector('button.cta-button');
if (ctaButton) {
    ctaButton.addEventListener("click", (e) => {
        alert("Gedrückt!");
    });
}