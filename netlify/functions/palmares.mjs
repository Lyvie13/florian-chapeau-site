export default async () => {
  try {
    const spaceId = process.env.CONTENTFUL_SPACE_ID;
    const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

    if (!spaceId || !accessToken) {
      return Response.json(
        {
          error: "Variables Contentful manquantes dans Netlify"
        },
        {
          status: 500
        }
      );
    }

    const url =
      `https://cdn.contentful.com/spaces/${spaceId}` +
      `/environments/master/entries` +
      `?content_type=palmares&include=2`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: "Erreur Contentful",
          details: data
        },
        {
          status: response.status
        }
      );
    }

    return Response.json(data, {
      status: 200
    });

  } catch (error) {
    return Response.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    );
  }
};