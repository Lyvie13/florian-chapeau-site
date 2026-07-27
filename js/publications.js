  document.addEventListener("DOMContentLoaded", chargerPublications);

  async function chargerPublications() {
    const articlesContainer = document.getElementById("articles-list");
    const interviewsContainer = document.getElementById("interviews-list");

if (articlesContainer) {
  afficherChargement(articlesContainer);
}

if (interviewsContainer) {
  afficherChargement(interviewsContainer);
}
    try {
      const response = await fetch(
        "/.netlify/functions/publications",
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
      }

      const data = await response.json();

      const assets = creerIndexImages(data.includes?.Asset || []);
      const publications = data.items || [];

const page = window.location.pathname.toLowerCase();
console.log(page);

let articles = publications
  .filter((publication) => {
    return normaliserTexte(publication.fields?.type) === "article";
  })
  .sort(trierParDate);

let interviews = publications
  .filter((publication) => {
    return normaliserTexte(publication.fields?.type) === "interview";
  })
  .sort(trierParDate);

if (page.endsWith("presse.html") || page === "/" || page.endsWith("/")) {
  articles = articles.slice(0, 3);
  interviews = interviews.slice(0, 3);
}

if (page.endsWith("articles.html")) {
  interviews = [];
}

if (page.endsWith("interviews.html")) {
  articles = [];
}
if (articlesContainer) {
  afficherPublications(articles, articlesContainer, assets);
}

if (interviewsContainer) {
  afficherPublications(interviews, interviewsContainer, assets);
}
    } catch (error) {
      console.error("Erreur lors du chargement des publications :", error);

if (articlesContainer) {
  afficherErreur(
    articlesContainer,
    "Impossible de charger les articles pour le moment."
  );
}

if (interviewsContainer) {
  afficherErreur(
    interviewsContainer,
    "Impossible de charger les interviews pour le moment."
  );
}    }
  }

  function creerIndexImages(assets) {
    return assets.reduce((index, asset) => {
      index[asset.sys.id] = asset;
      return index;
    }, {});
  }

  function afficherPublications(publications, container, assets) {
    container.innerHTML = "";

    if (publications.length === 0) {
      container.innerHTML = `
        <p class="press-message">
          Aucune publication disponible pour le moment.
        </p>
      `;
      return;
    }

    publications.forEach((publication) => {
      const carte = creerCartePublication(publication, assets);
      container.appendChild(carte);
    });
  }

  function creerCartePublication(publication, assets) {
    const fields = publication.fields || {};

    const titre = fields.titre || "Publication";
    const description = nettoyerDescription(fields.description || "");
    const lien = securiserLien(fields.lien);
    const date = formaterDate(fields.date);

    const imageId = fields.image?.sys?.id;
    const asset = imageId ? assets[imageId] : null;
    const imageUrl = obtenirUrlImage(asset);

    const article = document.createElement("article");
    article.className = "press-card";

    article.innerHTML = `
      <div class="press-card__image-wrapper">
        ${
          imageUrl
            ? `
              <img
                class="press-card__image"
                src="${echapperHtml(imageUrl)}"
                alt="${echapperHtml(titre)}"
                loading="lazy"
              >
            `
            : `
              <div class="press-card__placeholder">
                Image indisponible
              </div>
            `
        }
      </div>

      <div class="press-card__content">
        <p class="press-card__date">${echapperHtml(date)}</p>

        <h3 class="press-card__title">
          ${echapperHtml(titre)}
        </h3>

        ${
          description
            ? `
              <p class="press-card__description">
                ${echapperHtml(description)}
              </p>
            `
            : ""
        }

        ${
          lien
            ? `
              <a
                class="press-card__link"
                href="${echapperHtml(lien)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Lire la publication
              </a>
            `
            : ""
        }
      </div>
    `;

    return article;
  }

  function obtenirUrlImage(asset) {
    const url = asset?.fields?.file?.url;

    if (!url) {
      return "";
    }

    if (url.startsWith("//")) {
      return `https:${url}`;
    }

    return url;
  }

  function formaterDate(dateBrute) {
    if (!dateBrute) {
      return "";
    }

    const date = new Date(`${dateBrute}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateBrute;
    }

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function trierParDate(a, b) {
    const dateA = new Date(a.fields?.date || 0);
    const dateB = new Date(b.fields?.date || 0);

    return dateB - dateA;
  }

  function normaliserTexte(texte = "") {
    return texte
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function nettoyerDescription(description) {
    return description
      .replace(/!\[[^\]]*]\([^)]+\)/g, "")
      .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
      .replace(/[#*_>`~-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function securiserLien(lien) {
    if (!lien) {
      return "";
    }

    try {
      const url = new URL(lien);

      if (!["http:", "https:"].includes(url.protocol)) {
        return "";
      }

      return url.href;
    } catch {
      return "";
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

  function afficherChargement(container) {
    if (!container) return;

    container.innerHTML = `
      <p class="press-message">
        Chargement des publications…
      </p>
    `;
  }

  function afficherErreur(container, message) {
    if (!container) return;

    container.innerHTML = `
      <p class="press-message press-message--error">
        ${echapperHtml(message)}
      </p>
    `;
  }
