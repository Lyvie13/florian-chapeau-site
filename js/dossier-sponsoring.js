document.addEventListener(
    "DOMContentLoaded",
    chargerDossierSponsoring
);

async function chargerDossierSponsoring() {
    const liens = document.querySelectorAll(
        ".dossier-sponsoring-link"
    );

    if (liens.length === 0) return;

    try {
        const response = await fetch(
            "/.netlify/functions/dossier-sponsoring",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            const erreur = await response.json().catch(() => ({}));

            throw new Error(
                erreur.error || `Erreur HTTP : ${response.status}`
            );
        }

        const data = await response.json();
        const entree = data.items?.[0];

        if (!entree) {
            throw new Error(
                "Aucun dossier de sponsoring publié dans Contentful"
            );
        }

        /*
         * API identifier du champ média Contentful :
         * pdf
         */
        const referencePdf = entree.fields?.pdf;

        if (!referencePdf?.sys?.id) {
            throw new Error(
                "Le champ PDF est vide ou son API identifier n'est pas pdf"
            );
        }

        const fichier = data.includes?.Asset?.find(
            (asset) => asset.sys.id === referencePdf.sys.id
        );

        const urlPdf = fichier?.fields?.file?.url;

        if (!urlPdf) {
            throw new Error("URL du PDF introuvable");
        }

        const urlComplete = urlPdf.startsWith("//")
            ? `https:${urlPdf}`
            : urlPdf;

liens.forEach((bouton) => {

    bouton.removeAttribute("aria-disabled");
    bouton.removeAttribute("title");

    bouton.onclick = () => {
        window.open(urlComplete, "_blank");
    };

});
    } catch (error) {
        console.error(
            "Erreur lors du chargement du dossier de sponsoring :",
            error
        );

liens.forEach((bouton) => {

    bouton.onclick = null;

    bouton.setAttribute("aria-disabled", "true");
    bouton.title =
        "Dossier de sponsoring temporairement indisponible";

});    }
}