document.addEventListener("DOMContentLoaded", chargerPalmares);

async function chargerPalmares() {
    const timeline = document.getElementById("timeline");

    if (!timeline) return;

    timeline.innerHTML = `
        <p class="timeline-message">
            Chargement du palmarès…
        </p>
    `;

    try {
        const response = await fetch(
            "/.netlify/functions/palmares",
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
        const entrees = data.items || [];

        /*
         * On conserve les cinq années de résultats
         * les plus récentes.
         */
        const resultatsRecents = entrees
            .filter((entree) => entree.fields?.objectifs !== true)
            .sort(trierParAnneeDecroissante)
            .slice(0, 5);

        /*
         * Les objectifs, par exemple 2028 et 2030,
         * restent toujours affichés.
         */
        const objectifs = entrees
            .filter((entree) => entree.fields?.objectifs === true);

        /*
         * On regroupe les résultats et les objectifs,
         * puis on trie dans l’ordre chronologique.
         */
        const palmaresAAfficher = [
            ...resultatsRecents,
            ...objectifs
        ].sort(trierParAnneeCroissante);

        afficherPalmares(palmaresAAfficher, timeline);

    } catch (error) {
        console.error(
            "Erreur lors du chargement du palmarès :",
            error
        );

        timeline.innerHTML = `
            <p class="timeline-message timeline-message--error">
                Impossible de charger le palmarès :
                ${echapperHtml(error.message)}
            </p>
        `;
    }
}


function afficherPalmares(entrees, timeline) {
    timeline.innerHTML = "";

    if (entrees.length === 0) {
        timeline.innerHTML = `
            <p class="timeline-message">
                Aucun résultat disponible pour le moment.
            </p>
        `;
        return;
    }

    const ligne = document.createElement("div");
    ligne.className = "line";

    timeline.appendChild(ligne);

    entrees.forEach((entree) => {
        const fields = entree.fields || {};

        /*
         * API identifiers Contentful :
         * years
         * rsultats
         * objectifs
         */
        const annee = fields.years || "";
        const resultats = fields.rsultats;
        const objectif = fields.objectifs === true;

        const etape = document.createElement("article");

        etape.className = objectif
            ? "step gold"
            : "step";

        etape.innerHTML = `
            <div class="dot"></div>

            <h3>
                ${echapperHtml(annee)}
            </h3>

            <div class="timeline-results">
                ${convertirResultats(resultats)}
            </div>
        `;

        timeline.appendChild(etape);
    });
}


/*
 * Convertit le champ Résultats en HTML.
 * Compatible avec un texte simple ou un Rich Text Contentful.
 */
function convertirResultats(resultats) {
    if (!resultats) {
        return "";
    }

    /*
     * Champ texte simple.
     */
    if (typeof resultats === "string") {
        return resultats
            .split(/\n\s*\n/)
            .filter((bloc) => bloc.trim() !== "")
            .map((bloc) => {
                return `
                    <p>
                        ${echapperHtml(bloc).replace(/\n/g, "<br>")}
                    </p>
                `;
            })
            .join("");
    }

    /*
     * Champ Rich Text Contentful.
     */
    if (Array.isArray(resultats.content)) {
        return resultats.content
            .map(convertirNoeudRichText)
            .join("");
    }

    return "";
}


function convertirNoeudRichText(noeud) {
    if (!noeud) return "";

    if (noeud.nodeType === "text") {
        let texte = echapperHtml(noeud.value || "");

        const marques = noeud.marks || [];

        marques.forEach((marque) => {
            if (marque.type === "bold") {
                texte = `<strong>${texte}</strong>`;
            }

            if (marque.type === "italic") {
                texte = `<em>${texte}</em>`;
            }
        });

        return texte;
    }

    const contenu = (noeud.content || [])
        .map(convertirNoeudRichText)
        .join("");

    switch (noeud.nodeType) {
        case "paragraph":
            return contenu.trim()
                ? `<p>${contenu}</p>`
                : "";

        case "unordered-list":
            return `<ul>${contenu}</ul>`;

        case "ordered-list":
            return `<ol>${contenu}</ol>`;

        case "list-item":
            return `<li>${contenu}</li>`;

        case "hyperlink":
            return `
                <a
                    href="${securiserLien(noeud.data?.uri)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ${contenu}
                </a>
            `;

        default:
            return contenu;
    }
}


function trierParAnneeCroissante(a, b) {
    const anneeA = Number(a.fields?.years || 0);
    const anneeB = Number(b.fields?.years || 0);

    return anneeA - anneeB;
}


function trierParAnneeDecroissante(a, b) {
    const anneeA = Number(a.fields?.years || 0);
    const anneeB = Number(b.fields?.years || 0);

    return anneeB - anneeA;
}


function securiserLien(lien) {
    if (!lien) return "#";

    try {
        const url = new URL(lien);

        if (!["http:", "https:"].includes(url.protocol)) {
            return "#";
        }

        return url.href;

    } catch {
        return "#";
    }
}


function echapperHtml(valeur = "") {
    return valeur
        .toString()
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}