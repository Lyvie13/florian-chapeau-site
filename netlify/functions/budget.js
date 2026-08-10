document.addEventListener("DOMContentLoaded", chargerBudget);

async function chargerBudget() {

    const montant = document.getElementById("budget-montant");
    const libelle = document.getElementById("budget-libelle");

    if (!montant || !libelle) return;

    try {

        const response = await fetch(
            "/.netlify/functions/budget",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const data = await response.json();

        const entree = data.items?.[0];

        if (!entree) {
            throw new Error("Aucune entrée budget trouvée dans Contentful");
        }

        const fields = entree.fields || {};

        montant.textContent = fields.montant || "";
        libelle.textContent = fields.libelle || "";

    } catch (error) {

        console.error(
            "Erreur lors du chargement du budget :",
            error
        );

        montant.textContent = "50 000 €";
        libelle.textContent = "Budget annuel";
    }
}