// https://vike.dev/data

import { useConfig } from "vike-solid/useConfig";
import type { Movie, MovieDetails } from "../types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data() {
  // https://vike.dev/useConfig
  const config = useConfig();

  try {
    const response = await fetch("https://brillout.github.io/star-wars/api/films.json");
    const moviesData = (await response.json()) as MovieDetails[];

    // 确保 moviesData 是数组
    const safeMoviesData = Array.isArray(moviesData) ? moviesData : [];

    config({
      // Set <title>
      title: `${safeMoviesData.length} Star Wars Movies`,
    });

    // We remove data we don't need because the data is passed to the client; we should
    // minimize what is sent over the network.
    const movies = minimize(safeMoviesData);

    return { movies };
  } catch (error) {
    console.error("Failed to fetch Star Wars movies:", error);
    config({
      title: "Star Wars Movies",
    });
    return { movies: [] };
  }
}

function minimize(movies: MovieDetails[]): Movie[] {
  if (!Array.isArray(movies)) {
    return [];
  }
  return movies.map((movie) => {
    const { title, release_date, id } = movie;
    return { title, release_date, id };
  });
}
