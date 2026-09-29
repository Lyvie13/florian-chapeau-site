document.addEventListener("DOMContentLoaded", chargerSponsors);

async function chargerSponsors() {
    const conteneur = document.getElementById("supporters-logos");

    if (!conteneur) return;

    try {
        const response = await fetch(
            "/.netlify/functions/sponsors",
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const data = await response.json();
        const assets = indexerAssets(data.includes?.Asset || []);

        const sponsors = (data.items || [])
            .map((entree) => normaliserSponsor(entree, assets))
            .filter((sponsor) => sponsor.actif && sponsor.logo)
            .sort((a, b) => {
                return a.ordre - b.ordre ||
                    a.nom.localeCompare(b.nom, "fr");
            });

        if (sponsors.length === 0) return;

        afficherSponsors(sponsors, conteneur);
    } catch (error) {
        console.error("Erreur lors du chargement des sponsors :", error);
        // Les cinq logos présents dans le HTML restent affichés en secours.
    }
}

function indexerAssets(assets) {
    return assets.reduce((index, asset) => {
        index[asset.sys.id] = asset;
        return index;
    }, {});
}

function normaliserSponsor(entree, assets) {
    const fields = entree.fields || {};
    const referenceLogo = fields.logo?.sys?.id;
    const asset = referenceLogo ? assets[referenceLogo] : null;

    return {
        nom: String(fields.nom || fields.name || "Sponsor").trim(),
        logo: obtenirUrlAsset(asset),
        lien: securiserLien(fields.lien || fields.link || ""),
        ordre: convertirOrdre(fields.ordre ?? fields.order),
        actif: (fields.actif ?? fields.active) !== false
    };
}

function obtenirUrlAsset(asset) {
    const url = asset?.fields?.file?.url;

    if (!url) return "";
    return url.startsWith("//") ? `https:${url}` : url;
}

function convertirOrdre(valeur) {
    const ordre = Number(valeur);
    return Number.isFinite(ordre) ? ordre : 999;
}

function securiserLien(valeur) {
    if (!valeur) return "";

    try {
        const url = new URL(valeur, window.location.origin);

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return "";
        }

        return url.href;
    } catch {
        return "";
    }
}

function afficherSponsors(sponsors, conteneur) {
    conteneur.replaceChildren();

    if (sponsors.length <= 5) {
        conteneur.className = "supporters-logos supporters-logos--static";
        conteneur.removeAttribute("aria-label");

        sponsors.forEach((sponsor) => {
            conteneur.appendChild(creerLogoSponsor(sponsor));
        });

        return;
    }

    conteneur.className = "supporters-logos supporters-logos--carousel";
    conteneur.setAttribute("aria-label", "Sponsors de Florian Chapeau");

    const piste = document.createElement("div");
    piste.className = "supporters-track";
    piste.style.setProperty(
        "--supporters-duration",
        `${Math.max(24, sponsors.length * 4)}s`
    );

    piste.appendChild(creerSerieSponsors(sponsors));

    const copie = creerSerieSponsors(sponsors, true);
    copie.setAttribute("aria-hidden", "true");
    piste.appendChild(copie);

    conteneur.appendChild(piste);
}

function creerSerieSponsors(sponsors, duplique = false) {
    const serie = document.createElement("div");
    serie.className = "supporters-set";

    sponsors.forEach((sponsor) => {
        serie.appendChild(creerLogoSponsor(sponsor, duplique));
    });

    return serie;
}

function creerLogoSponsor(sponsor, duplique = false) {
    const element = document.createElement(sponsor.lien ? "a" : "span");
    element.className = "supporter-logo";
    element.setAttribute("aria-label", sponsor.nom);

    if (sponsor.lien) {
        element.href = sponsor.lien;
        element.target = "_blank";
        element.rel = "noopener noreferrer";

        if (duplique) {
            element.tabIndex = -1;
        }
    }

    const image = document.createElement("img");
    image.src = sponsor.logo;
    image.alt = sponsor.nom;
    image.loading = "lazy";

    element.appendChild(image);
    return element;
}
